const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URL:', process.env.MONGO_URL ? 'URL is set' : 'URL is not set');
        
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Successfully connected to MongoDB');
        
        // Test basic operations
        const Admin = require('../models/adminSchema');
        const adminCount = await Admin.countDocuments();
        console.log('Total admins in database:', adminCount);
        
        // Check if guest admin exists
        const guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        console.log('Guest admin exists:', !!guestAdmin);
        
        if (guestAdmin) {
            console.log('Guest admin details:', {
                name: guestAdmin.name,
                email: guestAdmin.email,
                schoolName: guestAdmin.schoolName
            });
        }
        
        await mongoose.disconnect();
        console.log('✅ Database connection test completed');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();