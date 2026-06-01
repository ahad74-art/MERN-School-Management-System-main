const FeeStructure = require('../models/feeStructureSchema');
const StudentFee = require('../models/studentFeeSchema');
const Payment = require('../models/paymentSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const mongoose = require('mongoose');

// Create fee structure
const createFeeStructure = async (req, res) => {
    try {
        const {
            name,
            description,
            sclass,
            academicYear,
            feeType,
            paymentFrequency,
            amount,
            currency,
            dueDate,
            lateFeeAmount,
            lateFeeType,
            gracePeriodDays,
            installments,
            applicableStudents,
            school,
            createdBy
        } = req.body;

        console.log('Creating fee structure with data:', req.body);

        const feeStructure = new FeeStructure({
            name,
            description,
            school: school,
            sclass,
            academicYear,
            feeType,
            paymentFrequency,
            amount,
            currency: currency || 'PKR',
            dueDate: new Date(dueDate),
            lateFeeAmount: lateFeeAmount || 0,
            lateFeeType: lateFeeType || 'fixed',
            gracePeriodDays: gracePeriodDays || 0,
            installments: installments || [],
            applicableStudents: applicableStudents || [],
            createdBy: createdBy
        });

        await feeStructure.save();

        // Create student fee records for applicable students
        if (applicableStudents && applicableStudents.length > 0) {
            await createStudentFeeRecords(feeStructure, applicableStudents);
        } else {
            // Apply to all students in the class
            console.log('Looking for students in class:', sclass);
            const classStudents = await Student.find({ sclassName: sclass });
            console.log('Found students:', classStudents.length);
            const allStudents = classStudents.map(student => ({ student: student._id }));
            if (allStudents.length > 0) {
                console.log('Creating fee records for', allStudents.length, 'students');
                await createStudentFeeRecords(feeStructure, allStudents);
            } else {
                console.log('No students found in class, skipping student fee record creation');
            }
        }

        const populatedFeeStructure = await FeeStructure.findById(feeStructure._id)
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Fee structure created successfully',
            feeStructure: populatedFeeStructure
        });

    } catch (error) {
        console.error('Error creating fee structure:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Helper function to create student fee records
const createStudentFeeRecords = async (feeStructure, applicableStudents) => {
    try {
        const studentFeeRecords = [];

        for (const studentData of applicableStudents) {
            // Calculate final amount (simple calculation for now)
            let finalAmount = feeStructure.amount;
            
            if (studentData.discount) {
                if (studentData.discountType === 'percentage') {
                    finalAmount = finalAmount - (finalAmount * studentData.discount / 100);
                } else {
                    finalAmount = finalAmount - studentData.discount;
                }
            }
            
            finalAmount = Math.max(0, finalAmount);
            
            const studentFee = new StudentFee({
                student: studentData.student,
                feeStructure: feeStructure._id,
                school: feeStructure.school,
                academicYear: feeStructure.academicYear,
                totalAmount: feeStructure.amount,
                discountAmount: studentData.discount || 0,
                finalAmount: finalAmount,
                pendingAmount: finalAmount,
                dueDate: feeStructure.dueDate,
                installments: feeStructure.installments.map(inst => ({
                    installmentNumber: inst.installmentNumber,
                    amount: inst.amount,
                    dueDate: inst.dueDate,
                    paidAmount: 0,
                    status: 'pending'
                }))
            });

            studentFeeRecords.push(studentFee);
        }

        if (studentFeeRecords.length > 0) {
            await StudentFee.insertMany(studentFeeRecords);
        }
    } catch (error) {
        console.error('Error creating student fee records:', error);
        throw error;
    }
};

// Get all fee structures
const getFeeStructures = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            academicYear, 
            sclass, 
            feeType, 
            isActive 
        } = req.query;

        const query = { school: schoolId };
        
        if (academicYear) query.academicYear = academicYear;
        if (sclass) query.sclass = sclass;
        if (feeType) query.feeType = feeType;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const feeStructures = await FeeStructure.find(query)
            .populate('sclass', 'sclassName')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await FeeStructure.countDocuments(query);

        res.json({
            success: true,
            feeStructures,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching fee structures:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update fee structure
const updateFeeStructure = async (req, res) => {
    try {
        const { feeStructureId } = req.params;
        const updateData = req.body;

        const feeStructure = await FeeStructure.findByIdAndUpdate(
            feeStructureId,
            updateData,
            { new: true, runValidators: true }
        ).populate('sclass', 'sclassName')
         .populate('createdBy', 'name email');

        if (!feeStructure) {
            return res.status(404).json({
                success: false,
                message: 'Fee structure not found'
            });
        }

        res.json({
            success: true,
            message: 'Fee structure updated successfully',
            feeStructure
        });

    } catch (error) {
        console.error('Error updating fee structure:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete fee structure
const deleteFeeStructure = async (req, res) => {
    try {
        const { feeStructureId } = req.params;

        // Check if there are any payments for this fee structure
        const paymentsCount = await Payment.countDocuments({ 
            feeStructure: feeStructureId,
            status: 'completed'
        });

        if (paymentsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete fee structure with completed payments'
            });
        }

        // Delete related student fee records
        await StudentFee.deleteMany({ feeStructure: feeStructureId });

        // Delete the fee structure
        const feeStructure = await FeeStructure.findByIdAndDelete(feeStructureId);

        if (!feeStructure) {
            return res.status(404).json({
                success: false,
                message: 'Fee structure not found'
            });
        }

        res.json({
            success: true,
            message: 'Fee structure deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting fee structure:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all payments with filters
const getAllPayments = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            page = 1,
            limit = 10,
            status,
            paymentGateway,
            dateFrom,
            dateTo,
            studentId,
            feeType,
            search
        } = req.query;

        const query = { school: new mongoose.Types.ObjectId(schoolId) };

        if (status) query.status = status;
        if (paymentGateway) query.paymentGateway = paymentGateway;
        if (studentId) query.student = new mongoose.Types.ObjectId(studentId);
        
        if (dateFrom || dateTo) {
            query.paymentDate = {};
            if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
            if (dateTo) query.paymentDate.$lte = new Date(dateTo);
        }

        let aggregationPipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $lookup: {
                    from: 'feestructures',
                    localField: 'feeStructure',
                    foreignField: '_id',
                    as: 'feeStructure'
                }
            },
            { $unwind: '$student' },
            { $unwind: '$feeStructure' }
        ];

        // Add search filter
        if (search) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { 'student.name': { $regex: search, $options: 'i' } },
                        { 'student.rollNum': { $regex: search, $options: 'i' } },
                        { paymentId: { $regex: search, $options: 'i' } },
                        { transactionId: { $regex: search, $options: 'i' } },
                        { receiptNumber: { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Add fee type filter
        if (feeType) {
            aggregationPipeline.push({
                $match: { 'feeStructure.feeType': feeType }
            });
        }

        // Add sorting
        aggregationPipeline.push({ $sort: { paymentDate: -1 } });

        // Add pagination
        aggregationPipeline.push(
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        );

        const payments = await Payment.aggregate(aggregationPipeline);

        // Get total count for pagination
        const totalPipeline = [...aggregationPipeline];
        totalPipeline.pop(); // Remove limit
        totalPipeline.pop(); // Remove skip
        totalPipeline.push({ $count: 'total' });
        
        const totalResult = await Payment.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        res.json({
            success: true,
            payments: payments.map(payment => ({
                paymentId: payment.paymentId,
                transactionId: payment.transactionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                paymentGateway: payment.paymentGateway,
                paymentDate: payment.paymentDate,
                receiptNumber: payment.receiptNumber,
                student: {
                    id: payment.student._id,
                    name: payment.student.name,
                    rollNum: payment.student.rollNum,
                    email: payment.student.email
                },
                feeStructure: {
                    id: payment.feeStructure._id,
                    name: payment.feeStructure.name,
                    feeType: payment.feeStructure.feeType
                }
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get pending/overdue fees
const getPendingFees = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            overdueOnly = false,
            sclass,
            feeType 
        } = req.query;

        const query = { 
            school: schoolId,
            status: { $in: ['pending', 'partially_paid', 'overdue'] }
        };

        if (overdueOnly === 'true') {
            query.dueDate = { $lt: new Date() };
        }

        if (sclass) query.sclass = sclass;

        let aggregationPipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            {
                $lookup: {
                    from: 'feestructures',
                    localField: 'feeStructure',
                    foreignField: '_id',
                    as: 'feeStructure'
                }
            },
            { $unwind: '$student' },
            { $unwind: '$feeStructure' }
        ];

        if (feeType) {
            aggregationPipeline.push({
                $match: { 'feeStructure.feeType': feeType }
            });
        }

        aggregationPipeline.push(
            { $sort: { dueDate: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        );

        const pendingFees = await StudentFee.aggregate(aggregationPipeline);

        // Get total count
        const totalPipeline = [...aggregationPipeline];
        totalPipeline.pop(); // Remove limit
        totalPipeline.pop(); // Remove skip
        totalPipeline.push({ $count: 'total' });
        
        const totalResult = await StudentFee.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        res.json({
            success: true,
            pendingFees: pendingFees.map(fee => ({
                id: fee._id,
                student: {
                    id: fee.student._id,
                    name: fee.student.name,
                    rollNum: fee.student.rollNum,
                    email: fee.student.email,
                    phone: fee.student.phone
                },
                feeStructure: {
                    id: fee.feeStructure._id,
                    name: fee.feeStructure.name,
                    feeType: fee.feeStructure.feeType
                },
                totalAmount: fee.finalAmount,
                paidAmount: fee.paidAmount,
                pendingAmount: fee.pendingAmount,
                lateFeeAmount: fee.lateFeeAmount,
                status: fee.status,
                dueDate: fee.dueDate,
                daysOverdue: fee.daysOverdue || 0
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching pending fees:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Mark fee as paid manually (for offline payments)
const markFeeAsPaid = async (req, res) => {
    try {
        const { studentFeeId } = req.params;
        const {
            amount,
            paymentMethod = 'cash',
            notes,
            attachments = []
        } = req.body;

        const { currentUser } = req.user || req.body;
        if (!currentUser) {
            return res.status(400).json({ success: false, message: 'currentUser is required' });
        }

        const studentFee = await StudentFee.findById(studentFeeId)
            .populate('student', 'name rollNum')
            .populate('feeStructure', 'name');

        if (!studentFee) {
            return res.status(404).json({
                success: false,
                message: 'Student fee record not found'
            });
        }

        if (amount > studentFee.pendingAmount) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount cannot exceed pending amount'
            });
        }

        // Create manual payment record
        const payment = new Payment({
            student: studentFee.student._id,
            feeStructure: studentFee.feeStructure._id,
            school: studentFee.school,
            amount: amount,
            currency: 'PKR', // Default currency
            paymentType: amount >= studentFee.pendingAmount ? 'full' : 'partial',
            paymentGateway: 'manual',
            paymentMethod: paymentMethod,
            status: 'completed',
            completedAt: new Date(),
            description: `Manual payment for ${studentFee.feeStructure.name}`,
            manualPayment: {
                isManual: true,
                recordedBy: currentUser._id,
                recordedAt: new Date(),
                notes: notes,
                attachments: attachments
            }
        });

        payment.generateReceiptNumber();
        await payment.save();

        // Update student fee record
        await studentFee.addPayment(payment._id, amount);

        // Add audit log
        await payment.addAuditLog(
            'manual_payment_recorded',
            currentUser._id,
            'admin',
            {
                amount,
                paymentMethod,
                notes,
                studentName: studentFee.student.name,
                feeStructureName: studentFee.feeStructure.name
            },
            req
        );

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            payment: {
                paymentId: payment.paymentId,
                receiptNumber: payment.receiptNumber,
                amount: payment.amount,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Error marking fee as paid:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get payment analytics
const getPaymentAnalytics = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { 
            academicYear, 
            dateFrom, 
            dateTo,
            groupBy = 'month'
        } = req.query;

        // CRITICAL: convert string to ObjectId for aggregation pipeline
        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
        const matchQuery = { school: schoolObjectId };
        
        if (academicYear) {
            const feeStructures = await FeeStructure.find({
                school: schoolObjectId,
                academicYear: academicYear
            }).select('_id');
            matchQuery.feeStructure = { $in: feeStructures.map(fs => fs._id) };
        }

        if (dateFrom || dateTo) {
            matchQuery.paymentDate = {};
            if (dateFrom) matchQuery.paymentDate.$gte = new Date(dateFrom);
            if (dateTo) matchQuery.paymentDate.$lte = new Date(dateTo);
        }

        // Overall statistics
        const overallStats = await Payment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    completedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    completedAmount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
                    },
                    failedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    pendingPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Payment method breakdown
        const paymentMethodStats = await Payment.aggregate([
            { $match: { ...matchQuery, status: 'completed' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Fee type breakdown
        const feeTypeStats = await Payment.aggregate([
            { $match: { ...matchQuery, status: 'completed' } },
            {
                $lookup: {
                    from: 'feestructures',
                    localField: 'feeStructure',
                    foreignField: '_id',
                    as: 'feeStructure'
                }
            },
            { $unwind: '$feeStructure' },
            {
                $group: {
                    _id: '$feeStructure.feeType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Time-based analytics
        let dateGrouping;
        switch (groupBy) {
            case 'day':
                dateGrouping = {
                    year: { $year: '$paymentDate' },
                    month: { $month: '$paymentDate' },
                    day: { $dayOfMonth: '$paymentDate' }
                };
                break;
            case 'week':
                dateGrouping = {
                    year: { $year: '$paymentDate' },
                    week: { $week: '$paymentDate' }
                };
                break;
            default: // month
                dateGrouping = {
                    year: { $year: '$paymentDate' },
                    month: { $month: '$paymentDate' }
                };
        }

        const timeBasedStats = await Payment.aggregate([
            { $match: { ...matchQuery, status: 'completed' } },
            {
                $group: {
                    _id: dateGrouping,
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);

        // Outstanding fees summary
        const outstandingFees = await StudentFee.aggregate([
            {
                $match: {
                    school: new mongoose.Types.ObjectId(schoolId),
                    status: { $in: ['pending', 'partially_paid', 'overdue'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOutstanding: { $sum: '$pendingAmount' },
                    totalOverdue: {
                        $sum: {
                            $cond: [
                                { $lt: ['$dueDate', new Date()] },
                                '$pendingAmount',
                                0
                            ]
                        }
                    },
                    overdueCount: {
                        $sum: {
                            $cond: [
                                { $lt: ['$dueDate', new Date()] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            analytics: {
                overall: overallStats[0] || {
                    totalPayments: 0,
                    totalAmount: 0,
                    completedPayments: 0,
                    completedAmount: 0,
                    failedPayments: 0,
                    pendingPayments: 0
                },
                paymentMethods: paymentMethodStats,
                feeTypes: feeTypeStats,
                timeBased: timeBasedStats,
                outstanding: outstandingFees[0] || {
                    totalOutstanding: 0,
                    totalOverdue: 0,
                    overdueCount: 0
                }
            }
        });

    } catch (error) {
        console.error('Error fetching payment analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Export payment data
const exportPaymentData = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { format = 'csv', dateFrom, dateTo, status } = req.query;

        const query = { school: schoolId };
        
        if (status) query.status = status;
        if (dateFrom || dateTo) {
            query.paymentDate = {};
            if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
            if (dateTo) query.paymentDate.$lte = new Date(dateTo);
        }

        const payments = await Payment.find(query)
            .populate('student', 'name rollNum email phone')
            .populate('feeStructure', 'name feeType')
            .sort({ paymentDate: -1 });

        if (format === 'csv') {
            const csvData = payments.map(payment => ({
                'Payment ID': payment.paymentId,
                'Transaction ID': payment.transactionId || '',
                'Receipt Number': payment.receiptNumber || '',
                'Student Name': payment.student.name,
                'Roll Number': payment.student.rollNum,
                'Student Email': payment.student.email,
                'Fee Type': payment.feeStructure.name,
                'Amount': payment.amount,
                'Currency': payment.currency,
                'Status': payment.status,
                'Payment Method': payment.paymentMethod,
                'Payment Gateway': payment.paymentGateway,
                'Payment Date': payment.paymentDate.toISOString().split('T')[0],
                'Completed At': payment.completedAt ? payment.completedAt.toISOString().split('T')[0] : ''
            }));

            // Convert to CSV format
            const csvHeaders = Object.keys(csvData[0] || {}).join(',');
            const csvRows = csvData.map(row => Object.values(row).join(','));
            const csvContent = [csvHeaders, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
            res.send(csvContent);
        } else {
            // Return JSON format
            res.json({
                success: true,
                payments: payments.map(payment => ({
                    paymentId: payment.paymentId,
                    transactionId: payment.transactionId,
                    receiptNumber: payment.receiptNumber,
                    student: payment.student,
                    feeStructure: payment.feeStructure,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod,
                    paymentGateway: payment.paymentGateway,
                    paymentDate: payment.paymentDate,
                    completedAt: payment.completedAt
                }))
            });
        }

    } catch (error) {
        console.error('Error exporting payment data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Test fee creation endpoint
const testFeeCreation = async (req, res) => {
    try {
        console.log('Test fee creation endpoint called');
        res.json({
            success: true,
            message: 'Fee creation test endpoint working',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Test endpoint error',
            error: error.message
        });
    }
};

// Simple fee summary — uses Mongoose find (auto-casts ObjectId, no aggregation issues)
const getFeeSummary = async (req, res) => {
    try {
        const { schoolId } = req.params;

        // Use Mongoose find — it auto-casts string to ObjectId
        const completedPayments = await Payment.find({
            school: schoolId,
            status: 'completed',
        }).populate('student', 'name rollNum email').populate('feeStructure', 'name feeType');

        const totalCollected = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        res.json({
            success: true,
            totalCollected,
            totalPayments: completedPayments.length,
            recentPayments: completedPayments
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 20)
                .map(p => ({
                    paymentId: p.paymentId,
                    receiptNumber: p.receiptNumber,
                    amount: p.amount,
                    currency: p.currency,
                    completedAt: p.completedAt,
                    paymentGateway: p.paymentGateway,
                    student: {
                        name: p.student?.name || 'N/A',
                        rollNum: p.student?.rollNum || 'N/A',
                        email: p.student?.email || '',
                    },
                    feeType: p.feeStructure?.name || 'N/A',
                })),
        });
    } catch (error) {
        console.error('Error in getFeeSummary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Demo payment completion endpoint (for testing Pakistani payment methods)
const completeDemoPayment = async (req, res) => {
    try {
        const { paymentId, studentId, feeStructureId, amount, paymentMethod, currency = 'PKR' } = req.body;
        
        console.log('Demo payment completion:', { paymentId, studentId, feeStructureId, amount, paymentMethod, currency });

        // Look up the student to get the real school ID
        const student = await Student.findById(studentId).select('school');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Create a demo payment record
        const payment = new Payment({
            student: studentId,
            feeStructure: feeStructureId,
            school: student.school,  // Use real school ID from student record
            amount: amount,
            currency: currency,
            paymentType: 'full',
            paymentGateway: paymentMethod,
            paymentMethod: paymentMethod === 'easypaisa' ? 'wallet' : 
                          paymentMethod === 'jazzcash' ? 'wallet' : 
                          paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card',
            status: 'completed',
            completedAt: new Date(),
            description: `Demo payment via ${paymentMethod}`,
            transactionId: `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            manualPayment: {
                isManual: true,
                recordedBy: studentId,
                recordedAt: new Date(),
                notes: `Demo payment processed via ${paymentMethod} in ${currency}`
            }
        });

        payment.generateReceiptNumber();
        await payment.save();

        // Update student fee record
        const studentFee = await StudentFee.findOne({
            student: studentId,
            feeStructure: feeStructureId
        });

        if (studentFee) {
            await studentFee.addPayment(payment._id, amount);
        }

        res.json({
            success: true,
            message: 'Demo payment completed successfully',
            payment: {
                paymentId: payment.paymentId,
                transactionId: payment.transactionId,
                receiptNumber: payment.receiptNumber,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Error completing demo payment:', error);
        res.status(500).json({
            success: false,
            message: 'Demo payment failed',
            error: error.message
        });
    }
};

module.exports = {
    createFeeStructure,
    getFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    getAllPayments,
    getPendingFees,
    markFeeAsPaid,
    getPaymentAnalytics,
    exportPaymentData,
    testFeeCreation,
    completeDemoPayment,
    getFeeSummary,
};