import { createAdminUser } from './createAdminUser.js';
import dotenv from 'dotenv';

dotenv.config();

// Define the new admin user details
const newAdminData = {
  email: 'admin2@grapheneos-store.com', // Change this email
  password: 'SecurePassword456!', // Change this password
  firstName: 'New', // Change this name
  lastName: 'Admin', // Change this name
  role: 'admin',
  isActive: true,
  emailVerified: true
};

// Create the new admin user
createAdminUser(newAdminData)
  .then(user => {
    console.log('✅ New admin user created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  });