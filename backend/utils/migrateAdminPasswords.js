const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Admin = require('../models/adminSchema.js');
require('dotenv').config();

const migrateAdminPasswords = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Find all admins
        const admins = await Admin.find({});
        console.log(`Found ${admins.length} admin(s) to check`);
        
        let updatedCount = 0;
        
        for (const admin of admins) {
            // Check if password is already hashed (bcrypt hashes start with $2b$)
            if (!admin.password.startsWith('$2b$')) {
                console.log(`Hashing password for admin: ${admin.name} (${admin.email})`);
                
                // Hash the plain text password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(admin.password, salt);
                
                // Update the admin with hashed password
                await Admin.findByIdAndUpdate(admin._id, {
                    password: hashedPassword
                });
                
                updatedCount++;
                console.log(`✅ Updated password for ${admin.name}`);
            } else {
                console.log(`⏭️  Password already hashed for ${admin.name}`);
            }
        }
        
        console.log(`\n🎉 Migration completed! Updated ${updatedCount} admin password(s)`);
        
        // Verify the migration
        console.log('\n🔍 Verifying migration...');
        const updatedAdmins = await Admin.find({});
        
        for (const admin of updatedAdmins) {
            if (admin.password.startsWith('$2b$')) {
                console.log(`✅ ${admin.name}: Password properly hashed`);
            } else {
                console.log(`❌ ${admin.name}: Password NOT hashed!`);
            }
        }
        
        console.log('\n✅ Migration verification completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the migration
if (require.main === module) {
    migrateAdminPasswords();
}

module.exports = migrateAdminPasswords;