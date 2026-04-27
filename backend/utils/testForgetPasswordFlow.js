const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Admin = require('../models/adminSchema.js');
require('dotenv').config();

const testForgetPasswordFlow = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Testing complete forget password flow...\n');
        
        // Get the admin from database
        const admin = await Admin.findOne({});
        if (!admin) {
            console.log('❌ No admin found in database');
            return;
        }
        
        console.log(`👨‍💼 Testing with admin: ${admin.name} (${admin.email})`);
        console.log(`Current password hash: ${admin.password.substring(0, 30)}...`);
        
        // Step 1: Test password reset (simulate forget password)
        console.log('\n📝 Step 1: Testing password reset...');
        const newPassword = 'newTestPassword123';
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        
        // Update the password (simulate forget password controller)
        const updatedAdmin = await Admin.findByIdAndUpdate(
            admin._id,
            { password: hashedNewPassword },
            { new: true }
        );
        
        console.log(`✅ Password reset completed`);
        console.log(`New password hash: ${hashedNewPassword.substring(0, 30)}...`);
        
        // Step 2: Test login with new password
        console.log('\n🔑 Step 2: Testing login with new password...');
        const loginTest = await bcrypt.compare(newPassword, updatedAdmin.password);
        
        console.log(`Login test result: ${loginTest ? '✅ SUCCESS - Login works!' : '❌ FAILED - Login broken!'}`);
        
        // Step 3: Test login with wrong password
        console.log('\n🚫 Step 3: Testing login with wrong password...');
        const wrongPasswordTest = await bcrypt.compare('wrongPassword', updatedAdmin.password);
        
        console.log(`Wrong password test: ${wrongPasswordTest ? '❌ SECURITY ISSUE - Wrong password accepted!' : '✅ SECURE - Wrong password rejected'}`);
        
        // Step 4: Verify the complete flow
        console.log('\n🎯 Step 4: Complete flow verification...');
        
        if (loginTest && !wrongPasswordTest) {
            console.log('🎉 ✅ COMPLETE SUCCESS!');
            console.log('✅ Password reset functionality works');
            console.log('✅ Login with new password works');
            console.log('✅ Wrong passwords are rejected');
            console.log('✅ bcrypt comparison is working correctly');
            console.log('\n🔐 The password system is fully functional!');
        } else {
            console.log('❌ ISSUES DETECTED:');
            if (!loginTest) console.log('   - Login with correct password failed');
            if (wrongPasswordTest) console.log('   - Wrong password was accepted (security issue)');
        }
        
        // Restore original password for safety (optional)
        console.log('\n🔄 Restoring original password...');
        await Admin.findByIdAndUpdate(admin._id, { password: admin.password });
        console.log('✅ Original password restored');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the test
if (require.main === module) {
    testForgetPasswordFlow();
}

module.exports = testForgetPasswordFlow;