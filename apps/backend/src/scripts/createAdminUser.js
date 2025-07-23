import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

export const createAdminUser = async (adminData = null) => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Admin user details
    const defaultAdminData = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      firstName: 'Sheel',
      lastName: 'Morjaria',
      role: 'admin',
      isActive: true,
      emailVerified: true
    };
    
    const finalAdminData = adminData || defaultAdminData;

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: finalAdminData.email });
    if (existingAdmin) {
      console.log(`Admin user with email ${finalAdminData.email} already exists`);
      
      // Update existing user to admin role if needed
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('Updated existing user to admin role');
      }
      
      if (!adminData) process.exit(0); // Only exit if running as script
      return existingAdmin;
    }

    // Create new admin user
    const adminUser = new User(finalAdminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${finalAdminData.email}`);
    console.log(`Password: ${finalAdminData.password}`);
    console.log('');
    console.log('🔐 Please change the default password after first login');
    console.log('🌐 Admin login URL: http://localhost:3000/admin/login (frontend)');
    
    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    if (!adminData) { // Only disconnect if running as script
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
};

// Run the script only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}