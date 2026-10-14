const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { validateAndNormalizePhone } = require('../utils/phoneValidator');

function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      email: user.email, 
      role: user.role,
      organizationId: user.organizationId 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user._doc || user;
  return safe;
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, phone, password, role = 'customer', organizationId = null } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }

    let normalizedPhone = '';
    if (phone && phone.trim()) {
      const phoneValidation = validateAndNormalizePhone(phone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ success: false, message: phoneValidation.error });
      }
      normalizedPhone = phoneValidation.normalized;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: normalizedPhone,
      passwordHash,
      role: ['admin', 'staff', 'customer'].includes(role) ? role : 'customer',
      organizationId: organizationId || null,
      createdAt: new Date().toISOString()
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/quick-demo-login
async function quickDemoLogin(req, res, next) {
  try {
    const { role = 'customer', email } = req.body;
    let user;

    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ role });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found. Please run seed.` });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Quick logged in as ${user.name} (${user.role})`,
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    res.json({
      success: true,
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  quickDemoLogin,
  getMe
};
