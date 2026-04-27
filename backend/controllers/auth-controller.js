const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Admin = require('../models/adminSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');

// ─── Email transporter ────────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Find user by email across all roles ─────────────────────────────────────
const findUserByEmail = async (email) => {
    const admin = await Admin.findOne({ email });
    if (admin) return { user: admin, Model: Admin, role: 'Admin' };
    const teacher = await Teacher.findOne({ email });
    if (teacher) return { user: teacher, Model: Teacher, role: 'Teacher' };
    const student = await Student.findOne({ email });
    if (student) return { user: student, Model: Student, role: 'Student' };
    return null;
};

// ─── POST /forgot-password  (Step 1: send OTP) ───────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const found = await findUserByEmail(email);

        // Always respond the same way to prevent email enumeration
        if (!found) {
            return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
        }

        const { user, Model } = found;

        // Rate limiting: block if OTP was sent within last 60 seconds
        if (user.resetOtpLastSent) {
            const secondsSinceLast = (Date.now() - new Date(user.resetOtpLastSent).getTime()) / 1000;
            if (secondsSinceLast < 60) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting another OTP.`,
                    retryAfter: Math.ceil(60 - secondsSinceLast),
                });
            }
        }

        const otp = generateOtp();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Model.findByIdAndUpdate(user._id, {
            resetOtp: otp,
            resetOtpExpiry: expiry,
            resetOtpAttempts: 0,
            resetOtpLastSent: new Date(),
        });

        // Send OTP email
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"School Management" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:12px;">
                    <h2 style="color:#1E293B;margin-bottom:8px;">Password Reset Request</h2>
                    <p style="color:#64748B;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color:#64748B;">Use the OTP below to reset your password:</p>
                    <div style="text-align:center;margin:28px 0;">
                        <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1E3A8A;background:#EFF6FF;padding:16px 28px;border-radius:10px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color:#DC2626;font-size:13px;text-align:center;">⏱ This OTP expires in <strong>10 minutes</strong>.</p>
                    <p style="color:#94A3B8;font-size:13px;">If you did not request this, please ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
                    <p style="color:#CBD5E1;font-size:12px;">School Management System</p>
                </div>
            `,
        });

        res.json({ success: true, message: 'OTP sent to your email address.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.', error: error.message });
    }
};

// ─── POST /verify-otp  (Step 2: verify OTP) ──────────────────────────────────
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        if (otp.length !== 6) return res.status(400).json({ success: false, message: 'OTP must be 6 digits' });

        const found = await findUserByEmail(email);
        if (!found) return res.status(400).json({ success: false, message: 'Invalid request' });

        const { user, Model } = found;

        // Check max attempts (5)
        if (user.resetOtpAttempts >= 5) {
            await Model.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
            return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Check expiry
        if (!user.resetOtp || !user.resetOtpExpiry || new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Check OTP match
        if (user.resetOtp !== otp) {
            await Model.findByIdAndUpdate(user._id, { $inc: { resetOtpAttempts: 1 } });
            const remaining = 4 - user.resetOtpAttempts;
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
        }

        // OTP valid — generate a short-lived reset token for the password step
        const resetToken = crypto.randomBytes(32).toString('hex');
        await Model.findByIdAndUpdate(user._id, {
            resetOtp: null,
            resetOtpExpiry: null,
            resetOtpAttempts: 0,
            resetToken,
            resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min to set new password
        });

        res.json({ success: true, message: 'OTP verified successfully.', resetToken });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// ─── POST /reset-password  (Step 3: set new password) ────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Strong password: min 6 chars, at least 1 letter and 1 number
        const strongPassword = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (!strongPassword.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters and contain letters and numbers',
            });
        }

        const found = await findUserByEmail(email);
        if (!found) return res.status(400).json({ success: false, message: 'Invalid request' });

        const { user, Model } = found;

        if (!user.resetToken || user.resetToken !== resetToken || new Date() > user.resetTokenExpiry) {
            return res.status(400).json({ success: false, message: 'Reset session expired. Please start again.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await Model.findByIdAndUpdate(user._id, {
            password: hashed,
            resetToken: null,
            resetTokenExpiry: null,
        });

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// ─── Legacy token-based reset (kept for backward compat) ─────────────────────
const resetPasswordByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Token and password required' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        const now = new Date();
        let user = await Admin.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } });
        let Model = Admin;
        if (!user) { user = await Teacher.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } }); Model = Teacher; }
        if (!user) { user = await Student.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } }); Model = Student; }
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await Model.findByIdAndUpdate(user._id, { password: hashed, resetToken: null, resetTokenExpiry: null });
        res.json({ message: 'Password reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const now = new Date();
        let user = await Admin.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } });
        if (!user) user = await Teacher.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } });
        if (!user) user = await Student.findOne({ resetToken: token, resetTokenExpiry: { $gt: now } });
        if (!user) return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
        res.json({ valid: true, name: user.name });
    } catch (error) {
        res.status(500).json({ valid: false, message: 'Server error' });
    }
};

// ─── Legacy endpoints ─────────────────────────────────────────────────────────
const forgetPassword = async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;
        if (!email || !role || !newPassword) return res.status(400).json({ message: 'All fields required' });
        const found = await findUserByEmail(email);
        if (!found) return res.status(404).json({ message: 'User not found' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await found.Model.findByIdAndUpdate(found.user._id, { password: hashed });
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getUserForReset = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email required' });
        const found = await findUserByEmail(email);
        if (!found) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User found', user: { name: found.user.name, email: found.user.email, role: found.role } });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const verifyUpdate = async (req, res) => res.json({ message: 'OK' });

module.exports = {
    forgotPassword,
    verifyOtp,
    resetPassword,
    resetPasswordByToken,
    validateResetToken,
    forgetPassword,
    getUserForReset,
    verifyUpdate,
};
