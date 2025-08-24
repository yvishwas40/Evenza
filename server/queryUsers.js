// Query users from MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// User schema (simplified for querying)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  isActive: Boolean,
  dateOfBirth: Date,
  occupation: String,
  company: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function queryUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get all users (excluding passwords for security)
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    console.log('\n📊 User Database Summary:');
    console.log('='.repeat(50));
    console.log(`Total Users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 All Users:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   📱 Phone: ${user.phone || 'Not provided'}`);
        console.log(`   💼 Role: ${user.role}`);
        console.log(`   🏢 Company: ${user.company || 'Not provided'}`);
        console.log(`   💼 Occupation: ${user.occupation || 'Not provided'}`);
        console.log(`   ✅ Active: ${user.isActive}`);
        console.log(`   📅 Created: ${user.createdAt}`);
        console.log(`   🔄 Updated: ${user.updatedAt}`);
      });
    } else {
      console.log('\n❌ No users found in the database');
    }

    // Get the most recent user
    if (users.length > 0) {
      const recentUser = users[0];
      console.log('\n🆕 Most Recent User:');
      console.log(`   📧 ${recentUser.email}`);
      console.log(`   👤 ${recentUser.name}`);
      console.log(`   📅 Created: ${recentUser.createdAt}`);
    }

  } catch (error) {
    console.error('❌ Error querying users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
    process.exit(0);
  }
}

// Run the query
queryUsers();
