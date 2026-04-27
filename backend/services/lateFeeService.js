const StudentFee = require('../models/studentFeeSchema');
const FeeStructure = require('../models/feeStructureSchema');

class LateFeeService {
    // Calculate and apply late fees for overdue payments
    async calculateAndApplyLateFees() {
        try {
            console.log('Starting late fee calculation...');

            const overdueFees = await StudentFee.find({
                status: { $in: ['pending', 'partially_paid'] },
                dueDate: { $lt: new Date() }
            }).populate('feeStructure');

            let processedCount = 0;
            let updatedCount = 0;

            for (const studentFee of overdueFees) {
                processedCount++;
                
                const feeStructure = studentFee.feeStructure;
                const currentLateFee = this.calculateLateFee(studentFee, feeStructure);
                
                // Only update if late fee has changed
                if (currentLateFee !== studentFee.lateFeeAmount) {
                    studentFee.lateFeeAmount = currentLateFee;
                    studentFee.status = 'overdue';
                    
                    // Add note about late fee application
                    studentFee.notes.push({
                        note: `Late fee of $${currentLateFee.toFixed(2)} applied. Days overdue: ${studentFee.daysOverdue}`,
                        addedBy: null, // System generated
                        addedByModel: 'admin',
                        isPrivate: false
                    });

                    await studentFee.save();
                    updatedCount++;
                    
                    console.log(`Applied late fee of $${currentLateFee.toFixed(2)} to student fee ${studentFee._id}`);
                }
            }

            console.log(`Late fee calculation completed. Processed: ${processedCount}, Updated: ${updatedCount}`);

            return {
                success: true,
                processed: processedCount,
                updated: updatedCount,
                message: 'Late fees calculated and applied successfully'
            };

        } catch (error) {
            console.error('Error calculating late fees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calculate late fee for a specific student fee
    calculateLateFee(studentFee, feeStructure) {
        const now = new Date();
        const dueDate = new Date(studentFee.dueDate);
        const gracePeriodEnd = new Date(dueDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (feeStructure.gracePeriodDays || 0));

        // No late fee if still within grace period
        if (now <= gracePeriodEnd) {
            return 0;
        }

        const daysOverdue = Math.ceil((now - gracePeriodEnd) / (1000 * 60 * 60 * 24));
        
        if (feeStructure.lateFeeType === 'percentage') {
            // Percentage-based late fee
            const baseAmount = studentFee.pendingAmount || studentFee.finalAmount;
            return (baseAmount * feeStructure.lateFeeAmount) / 100;
        } else {
            // Fixed late fee (can be progressive based on days overdue)
            return this.calculateProgressiveLateFee(feeStructure.lateFeeAmount, daysOverdue);
        }
    }

    // Calculate progressive late fee based on days overdue
    calculateProgressiveLateFee(baseLateFeee, daysOverdue) {
        if (daysOverdue <= 7) {
            // First week: base late fee
            return baseLateFeee;
        } else if (daysOverdue <= 30) {
            // 1-4 weeks: 1.5x base late fee
            return baseLateFeee * 1.5;
        } else if (daysOverdue <= 60) {
            // 1-2 months: 2x base late fee
            return baseLateFeee * 2;
        } else {
            // Over 2 months: 3x base late fee (capped)
            return baseLateFeee * 3;
        }
    }

    // Get late fee statistics for a school
    async getLateFeeStats(schoolId, academicYear) {
        try {
            const matchQuery = { school: schoolId };
            if (academicYear) {
                matchQuery.academicYear = academicYear;
            }

            const stats = await StudentFee.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: null,
                        totalLateFees: { $sum: '$lateFeeAmount' },
                        overdueCount: {
                            $sum: {
                                $cond: [
                                    { $and: [
                                        { $lt: ['$dueDate', new Date()] },
                                        { $in: ['$status', ['pending', 'partially_paid', 'overdue']] }
                                    ]},
                                    1,
                                    0
                                ]
                            }
                        },
                        averageLateFee: { $avg: '$lateFeeAmount' },
                        maxLateFee: { $max: '$lateFeeAmount' }
                    }
                }
            ]);

            // Get late fee breakdown by days overdue
            const lateFeeBreakdown = await StudentFee.aggregate([
                {
                    $match: {
                        ...matchQuery,
                        lateFeeAmount: { $gt: 0 },
                        status: { $in: ['pending', 'partially_paid', 'overdue'] }
                    }
                },
                {
                    $addFields: {
                        daysOverdue: {
                            $ceil: {
                                $divide: [
                                    { $subtract: [new Date(), '$dueDate'] },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        }
                    }
                },
                {
                    $bucket: {
                        groupBy: '$daysOverdue',
                        boundaries: [0, 7, 30, 60, 365],
                        default: '365+',
                        output: {
                            count: { $sum: 1 },
                            totalLateFees: { $sum: '$lateFeeAmount' },
                            averageLateFee: { $avg: '$lateFeeAmount' }
                        }
                    }
                }
            ]);

            return {
                success: true,
                stats: stats[0] || {
                    totalLateFees: 0,
                    overdueCount: 0,
                    averageLateFee: 0,
                    maxLateFee: 0
                },
                breakdown: lateFeeBreakdown
            };

        } catch (error) {
            console.error('Error getting late fee stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Waive late fee for a specific student fee
    async waiveLateFee(studentFeeId, reason, approvedBy) {
        try {
            const studentFee = await StudentFee.findById(studentFeeId);
            
            if (!studentFee) {
                return {
                    success: false,
                    message: 'Student fee record not found'
                };
            }

            const waivedAmount = studentFee.lateFeeAmount;
            
            studentFee.lateFeeAmount = 0;
            studentFee.waiver = {
                isWaived: true,
                waivedAmount: waivedAmount,
                reason: reason,
                approvedBy: approvedBy,
                approvedAt: new Date()
            };

            // Add note about late fee waiver
            studentFee.notes.push({
                note: `Late fee of $${waivedAmount.toFixed(2)} waived. Reason: ${reason}`,
                addedBy: approvedBy,
                addedByModel: 'admin',
                isPrivate: false
            });

            await studentFee.save();

            return {
                success: true,
                message: 'Late fee waived successfully',
                waivedAmount: waivedAmount
            };

        } catch (error) {
            console.error('Error waiving late fee:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get students eligible for late fee waiver (financial hardship, etc.)
    async getLateFeeWaiverEligible(schoolId, criteria = {}) {
        try {
            const matchQuery = {
                school: schoolId,
                lateFeeAmount: { $gt: 0 },
                status: { $in: ['pending', 'partially_paid', 'overdue'] }
            };

            // Add criteria filters
            if (criteria.maxLateFee) {
                matchQuery.lateFeeAmount = { ...matchQuery.lateFeeAmount, $lte: criteria.maxLateFee };
            }

            if (criteria.minDaysOverdue) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - criteria.minDaysOverdue);
                matchQuery.dueDate = { $lt: cutoffDate };
            }

            const eligibleFees = await StudentFee.find(matchQuery)
                .populate('student', 'name rollNum email phone')
                .populate('feeStructure', 'name feeType')
                .sort({ lateFeeAmount: -1 });

            return {
                success: true,
                eligibleFees: eligibleFees.map(fee => ({
                    id: fee._id,
                    student: fee.student,
                    feeStructure: fee.feeStructure,
                    lateFeeAmount: fee.lateFeeAmount,
                    daysOverdue: fee.daysOverdue,
                    pendingAmount: fee.pendingAmount
                }))
            };

        } catch (error) {
            console.error('Error getting late fee waiver eligible students:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Schedule automatic late fee calculation (to be called by cron job)
    async scheduleLateFeeCalculation() {
        console.log('Scheduled late fee calculation started at:', new Date().toISOString());
        
        const result = await this.calculateAndApplyLateFees();
        
        console.log('Scheduled late fee calculation completed:', result);
        
        return result;
    }
}

module.exports = new LateFeeService();