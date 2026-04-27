const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Admin = require('../models/adminSchema.js');
require('dotenv').config();

const testCompleteLogin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Testing complete login flow...\n');
        
        // Get the admin from database
        const admin = await Admin.findOne({});
        if (!admin) {
            console.log('❌ No admin found in database');
            return;
        }
        
        console.log(`👨‍💼 Testing login for: ${admin.name} (${admin.email})`);
        console.log(`Password hash in DB: ${admin.password.substring(0, 30)}...`);
        
        // Simulate the login process exactly as the controller does
        const testPassword = 'ahad123'; // Replace with actual password
        console.log(`🔑 Testing with password: ${testPassword}`);
        
        // This is exactly what the adminLogIn controller does
        const validated = await bcrypt.compare(testPassword, admin.password);
        
        console.log(`\n🔐 bcrypt.compare result: ${validated ? '✅ VALID - Login would succeed' : '❌ INVALID - Login would fail'}`);
        
        if (validated) {
            console.log('✅ SUCCESS: The login system is working correctly!');
            console.log('✅ Password reset and login are now compatible');
        } else {
            console.log('❌ ISSUE: Password comparison failed');
            console.log('💡 This could mean:');
            console.log('   - The test password is incorrect');
            console.log('   - There might be an issue with the password hash');
        }
        
        // Test with a known password by creating a test hash
        console.log('\n🧪 Testing with known password hash:');
        const knownPassword = 'testPassword123';
        const knownHash = await bcrypt.hash(knownPassword, 10);
        const knownTest = await bcrypt.compare(knownPassword, knownHash);
        
        console.log(`Known password test: ${knownTest ? '✅ PASS' : '❌ FAIL'}`);
        
        console.log('\n🎉 Complete login test finished!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the test
if (require.main === module) {
    testCompleteLogin();
}

module.exports = testCompleteLogin;