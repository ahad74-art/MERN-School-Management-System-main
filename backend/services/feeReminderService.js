const StudentFee = require('../models/studentFeeSchema');
const Student = require('../models/studentSchema');
const FeeStructure = require('../models/feeStructureSchema');
const nodemailer = require('nodemailer');

class FeeReminderService {
    constructor() {
        this.emailTransporter = this.createEmailTransporter();
    }

    createEmailTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Send due soon reminders (3 days before due date)
    async sendDueSoonReminders() {
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const dueSoonFees = await StudentFee.find({
                status: { $in: ['pending', 'partially_paid'] },
                dueDate: {
                    $gte: new Date(),
                    $lte: threeDaysFromNow
                }
            })
            .populate('student', 'name email phone')
            .populate('feeStructure', 'name amount feeType');

            console.log(`Found ${dueSoonFees.length} fees due soon`);

            for (const fee of dueSoonFees) {
                if (fee.shouldSendReminder('due_soon')) {
                    await this.sendDueSoonReminder(fee);
                    await fee.addReminder('email', 'due_soon', 'sent');
                }
            }

            return {
                success: true,
                processed: dueSoonFees.length,
                message: 'Due soon reminders processed successfully'
            };

        } catch (error) {
            console.error('Error sending due soon reminders:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send overdue reminders
    async sendOverdueReminders() {
        try {
            const overdueFees = await StudentFee.find({
                status: { $in: ['pending', 'partially_paid', 'overdue'] },
                dueDate: { $lt: new Date() }
            })
            .populate('student', 'name email phone')
            .populate('feeStructure', 'name amount feeType');

            console.log(`Found ${overdueFees.length} overdue fees`);

            for (const fee of overdueFees) {
                if (fee.shouldSendReminder('overdue')) {
                    await this.sendOverdueReminder(fee);
                    await fee.addReminder('email', 'overdue', 'sent');
                }
            }

            return {
                success: true,
                processed: overdueFees.length,
                message: 'Overdue reminders processed successfully'
            };

        } catch (error) {
            console.error('Error sending overdue reminders:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send final notice reminders (30+ days overdue)
    async sendFinalNoticeReminders() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const finalNoticeFees = await StudentFee.find({
                status: { $in: ['pending', 'partially_paid', 'overdue'] },
                dueDate: { $lt: thirtyDaysAgo }
            })
            .populate('student', 'name email phone')
            .populate('feeStructure', 'name amount feeType');

            console.log(`Found ${finalNoticeFees.length} fees requiring final notice`);

            for (const fee of finalNoticeFees) {
                if (fee.shouldSendReminder('final_notice')) {
                    await this.sendFinalNoticeReminder(fee);
                    await fee.addReminder('email', 'final_notice', 'sent');
                }
            }

            return {
                success: true,
                processed: finalNoticeFees.length,
                message: 'Final notice reminders processed successfully'
            };

        } catch (error) {
            console.error('Error sending final notice reminders:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendDueSoonReminder(studentFee) {
        const { student, feeStructure } = studentFee;
        const daysUntilDue = Math.ceil((studentFee.dueDate - new Date()) / (1000 * 60 * 60 * 24));

        const emailContent = {
            to: student.email,
            subject: `Fee Payment Reminder - ${feeStructure.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2196F3;">Fee Payment Reminder</h2>
                    
                    <p>Dear ${student.name},</p>
                    
                    <p>This is a friendly reminder that your <strong>${feeStructure.name}</strong> payment is due in <strong>${daysUntilDue} days</strong>.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Payment Details:</h3>
                        <p><strong>Fee Type:</strong> ${feeStructure.feeType}</p>
                        <p><strong>Amount Due:</strong> $${studentFee.pendingAmount.toFixed(2)}</p>
                        <p><strong>Due Date:</strong> ${studentFee.dueDate.toLocaleDateString()}</p>
                    </div>
                    
                    <p>Please make your payment before the due date to avoid late fees.</p>
                    
                    <p>You can make your payment through the student portal or contact the school office for assistance.</p>
                    
                    <p>Thank you for your attention to this matter.</p>
                    
                    <p>Best regards,<br>School Administration</p>
                </div>
            `
        };

        await this.sendEmail(emailContent);
    }

    async sendOverdueReminder(studentFee) {
        const { student, feeStructure } = studentFee;
        const daysOverdue = Math.ceil((new Date() - studentFee.dueDate) / (1000 * 60 * 60 * 24));

        const emailContent = {
            to: student.email,
            subject: `OVERDUE: Fee Payment Required - ${feeStructure.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f44336;">OVERDUE PAYMENT NOTICE</h2>
                    
                    <p>Dear ${student.name},</p>
                    
                    <p>Your <strong>${feeStructure.name}</strong> payment is now <strong>${daysOverdue} days overdue</strong>.</p>
                    
                    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <h3 style="margin-top: 0; color: #f44336;">Payment Details:</h3>
                        <p><strong>Fee Type:</strong> ${feeStructure.feeType}</p>
                        <p><strong>Amount Due:</strong> $${studentFee.pendingAmount.toFixed(2)}</p>
                        <p><strong>Original Due Date:</strong> ${studentFee.dueDate.toLocaleDateString()}</p>
                        ${studentFee.lateFeeAmount > 0 ? `<p><strong>Late Fee:</strong> $${studentFee.lateFeeAmount.toFixed(2)}</p>` : ''}
                    </div>
                    
                    <p><strong>IMMEDIATE ACTION REQUIRED:</strong> Please make your payment as soon as possible to avoid additional late fees and potential academic consequences.</p>
                    
                    <p>If you are experiencing financial difficulties, please contact the school office immediately to discuss payment arrangements.</p>
                    
                    <p>Contact Information:</p>
                    <ul>
                        <li>Phone: [School Phone Number]</li>
                        <li>Email: [School Email]</li>
                        <li>Office Hours: [Office Hours]</li>
                    </ul>
                    
                    <p>Best regards,<br>School Administration</p>
                </div>
            `
        };

        await this.sendEmail(emailContent);
    }

    async sendFinalNoticeReminder(studentFee) {
        const { student, feeStructure } = studentFee;
        const daysOverdue = Math.ceil((new Date() - studentFee.dueDate) / (1000 * 60 * 60 * 24));

        const emailContent = {
            to: student.email,
            subject: `FINAL NOTICE: Immediate Payment Required - ${feeStructure.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f; text-align: center; background-color: #ffebee; padding: 15px; border-radius: 5px;">
                        ⚠️ FINAL NOTICE ⚠️
                    </h2>
                    
                    <p>Dear ${student.name},</p>
                    
                    <p><strong>This is a FINAL NOTICE</strong> regarding your overdue payment for <strong>${feeStructure.name}</strong>.</p>
                    
                    <div style="background-color: #ffcdd2; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #f44336;">
                        <h3 style="margin-top: 0; color: #d32f2f;">CRITICAL PAYMENT INFORMATION:</h3>
                        <p><strong>Fee Type:</strong> ${feeStructure.feeType}</p>
                        <p><strong>Amount Due:</strong> $${studentFee.pendingAmount.toFixed(2)}</p>
                        <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
                        <p><strong>Original Due Date:</strong> ${studentFee.dueDate.toLocaleDateString()}</p>
                        ${studentFee.lateFeeAmount > 0 ? `<p><strong>Late Fee Applied:</strong> $${studentFee.lateFeeAmount.toFixed(2)}</p>` : ''}
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <h4 style="margin-top: 0; color: #f57c00;">CONSEQUENCES OF NON-PAYMENT:</h4>
                        <ul>
                            <li>Academic records may be withheld</li>
                            <li>Student may be barred from examinations</li>
                            <li>Additional late fees may be applied</li>
                            <li>Account may be referred to collections</li>
                        </ul>
                    </div>
                    
                    <p><strong>IMMEDIATE ACTION REQUIRED:</strong> You must contact the school office within 48 hours to resolve this matter.</p>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #2e7d32;">CONTACT INFORMATION:</h4>
                        <p><strong>Phone:</strong> [School Phone Number]</p>
                        <p><strong>Email:</strong> [School Email]</p>
                        <p><strong>Office Hours:</strong> [Office Hours]</p>
                        <p><strong>Payment Portal:</strong> [Student Portal URL]</p>
                    </div>
                    
                    <p>We understand that financial situations can be challenging. Please reach out to discuss payment plans or financial assistance options.</p>
                    
                    <p><strong>This is your final notice before further action is taken.</strong></p>
                    
                    <p>Sincerely,<br>School Administration<br>Finance Department</p>
                </div>
            `
        };

        await this.sendEmail(emailContent);
    }

    async sendEmail(emailContent) {
        try {
            if (!this.emailTransporter) {
                console.log('Email transporter not configured. Email content:', emailContent);
                return;
            }

            await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@school.edu',
                ...emailContent
            });

            console.log(`Email sent successfully to ${emailContent.to}`);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    // Run all reminder types
    async runAllReminders() {
        console.log('Starting fee reminder service...');
        
        const results = {
            dueSoon: await this.sendDueSoonReminders(),
            overdue: await this.sendOverdueReminders(),
            finalNotice: await this.sendFinalNoticeReminders()
        };

        console.log('Fee reminder service completed:', results);
        return results;
    }

    // Get reminder statistics
    async getReminderStats(schoolId, dateFrom, dateTo) {
        try {
            const matchQuery = { school: schoolId };
            
            if (dateFrom || dateTo) {
                matchQuery['reminders.sentAt'] = {};
                if (dateFrom) matchQuery['reminders.sentAt'].$gte = new Date(dateFrom);
                if (dateTo) matchQuery['reminders.sentAt'].$lte = new Date(dateTo);
            }

            const stats = await StudentFee.aggregate([
                { $match: matchQuery },
                { $unwind: '$reminders' },
                {
                    $group: {
                        _id: '$reminders.reminderType',
                        count: { $sum: 1 },
                        successful: {
                            $sum: { $cond: [{ $eq: ['$reminders.status', 'sent'] }, 1, 0] }
                        },
                        failed: {
                            $sum: { $cond: [{ $eq: ['$reminders.status', 'failed'] }, 1, 0] }
                        }
                    }
                }
            ]);

            return {
                success: true,
                stats: stats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        total: stat.count,
                        successful: stat.successful,
                        failed: stat.failed
                    };
                    return acc;
                }, {})
            };

        } catch (error) {
            console.error('Error getting reminder stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new FeeReminderService();