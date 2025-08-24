// Simple server test
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

console.log('Testing Node.js setup...');

async function runTests() {
  try {
    console.log('Testing imports...');
    
    // Test dotenv
    dotenv.config();
    console.log('✅ dotenv imported');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    console.log('✅ mongoose imported');
    console.log('✅ bcryptjs imported');
    
    // Test password hashing
    const testPassword = 'password123';
    const hashed = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashed);
    console.log('✅ bcrypt test passed:', isValid);
    
    console.log('All basic tests passed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

runTests();
