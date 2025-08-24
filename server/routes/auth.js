import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

// Register Admin
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      organization,
      phone
    });

    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail({ email: admin.email, name: admin.name }, 'admin').catch(err => console.error('Welcome email error (admin):', err));

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        organization: admin.organization
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login Admin
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true });
    console.log('Admin found:', !!admin);
    if (!admin) {
      console.log('Admin not found in database');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing admin password...');
    const isMatch = await admin.comparePassword(password);
    console.log('Admin password match:', isMatch);
    if (!isMatch) {
      console.log('Admin password comparison failed');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    console.log('Admin login successful for:', admin.email);
    res.json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        organization: admin.organization
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get current admin
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Register User
router.post('/user/register', async (req, res) => {
  try {
    console.log('🆕 User registration attempt:', req.body.email);
    const { name, email, password, phone, dateOfBirth, occupation, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      occupation,
      company
    });

    await user.save();
    console.log('✅ User created successfully:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail({ email: user.email, name: user.name }, 'user').catch(err => console.error('Welcome email error (user):', err));

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        company: user.company
      },
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login User
router.post('/user/login', async (req, res) => {
  try {
    console.log('User login attempt:', req.body.email);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password comparison failed');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    console.log('Login successful for user:', user.email);
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        company: user.company
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get current user
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;