import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Try to get user info from database for better context
    let userInfo = null;
    if (decoded.role === 'user') {
      userInfo = await User.findById(decoded.id).select('-password');
    } else {
      userInfo = await Admin.findById(decoded.id).select('-password');
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: userInfo?.email || '',
      name: userInfo?.name || ''
    };
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};