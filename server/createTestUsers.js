import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Admin from './models/Admin.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ email: { $regex: /test/i } });
    await Admin.deleteMany({ email: { $regex: /test/i } });

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@user.com',
      password: 'password123',
      phone: '1234567890',
      dateOfBirth: new Date('1990-01-01'),
      occupation: 'Software Developer',
      company: 'Test Company'
    });
    await testUser.save();
    console.log('Test user created:', testUser.email);

    // Create test admin
    const testAdmin = new Admin({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'admin123',
      role: 'organizer',
      organization: 'Test Org',
      phone: '0987654321'
    });
    await testAdmin.save();
    console.log('Test admin created:', testAdmin.email);

    // Test password comparison
    const savedUser = await User.findOne({ email: 'test@user.com' });
    const isPasswordValid = await savedUser.comparePassword('password123');
    console.log('User password validation test:', isPasswordValid);

    const savedAdmin = await Admin.findOne({ email: 'test@admin.com' });
    const isAdminPasswordValid = await savedAdmin.comparePassword('admin123');
    console.log('Admin password validation test:', isAdminPasswordValid);

    mongoose.disconnect();
    console.log('Test users created successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
};

createTestUsers();
