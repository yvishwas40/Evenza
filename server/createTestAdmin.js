// Create test admin account
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Admin schema inline for this script
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['super_admin', 'organizer'], default: 'organizer' },
  organization: { type: String, trim: true },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

async function createTestAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('❌ Test admin already exists with email: admin@test.com');
      process.exit(0);
    }

    // Create test admin
    const testAdmin = new Admin({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      organization: 'Test Organization',
      phone: '+1234567890',
      role: 'super_admin'
    });

    await testAdmin.save();
    console.log('✅ Test admin created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔐 Password: password123');
    console.log('🎯 Role: super_admin');
    
    // Also create a basic organizer
    const testOrganizer = new Admin({
      name: 'Test Organizer',
      email: 'organizer@test.com',
      password: 'password123',
      organization: 'Event Company',
      phone: '+1234567891',
      role: 'organizer'
    });

    await testOrganizer.save();
    console.log('✅ Test organizer created successfully!');
    console.log('📧 Email: organizer@test.com');
    console.log('🔐 Password: password123');
    console.log('🎯 Role: organizer');

  } catch (error) {
    console.error('❌ Error creating test admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createTestAdmin();
