import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import readline from 'readline';
import { randomBytes } from 'crypto';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminInteractive() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin details interactively
    console.log('\n=== Create New Admin User ===\n');
    
    const email = await question('Enter admin email: ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    
    // Generate a secure temporary password
    const tempPassword = randomBytes(16).toString('base64').slice(0, 16) + '!Aa1';
    
    // Create the admin user
    const adminData = {
      email: email.toLowerCase().trim(),
      password: tempPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'admin',
      isActive: true,
      emailVerified: true,
      mustChangePassword: true // Add this field to your User model
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log('\n❌ User with this email already exists!');
      
      if (existingUser.role !== 'admin') {
        const upgrade = await question('\nUpgrade existing user to admin? (yes/no): ');
        if (upgrade.toLowerCase() === 'yes') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log('✅ User upgraded to admin successfully!');
        }
      } else {
        console.log('ℹ️  User is already an admin.');
      }
      
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${adminData.email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Share this password securely with the admin.');
    console.log('⚠️  They will be required to change it on first login.');
    
    rl.close();
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createAdminInteractive();