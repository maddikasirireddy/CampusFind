// backend/src/auth.js
// Authentication middleware & Auth endpoints (register, login, me, profile, change-password).

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('./db');

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

// In production, enforce that JWT_SECRET is explicitly set and sufficiently strong
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('FATAL: A strong JWT_SECRET (at least 32 characters) must be set in production.');
}

const SECRET = process.env.JWT_SECRET || (isProduction ? null : 'campusfind_dev_insecure_secret_key');
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const ROUNDS = 10;

// Centralized validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// JWT Auth Middleware
function authenticate(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: EXPIRES }
  );
}

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// POST /api/auth/register
// Student registration: explicitly forces role to 'student' to prevent privilege escalation
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be ≥ 6 chars'),
    body('student_id').trim().notEmpty().withMessage('Student ID is required'),
  ],
  validate,
  async (req, res) => {
    const { name, email, password, student_id, phone } = req.body;
    try {
      const exists = await query(
        'SELECT id FROM users WHERE email=$1 OR student_id=$2',
        [email, student_id]
      );
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: 'Email or student ID already registered' });
      }

      const hash = await bcrypt.hash(password, ROUNDS);
      const result = await query(
        `INSERT INTO users (name, email, password, student_id, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'student') RETURNING *`,
        [name, email, hash, student_id, phone || null]
      );

      const user = result.rows[0];
      const token = makeToken(user);
      return res.status(201).json({ token, user: safeUser(user) });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await query('SELECT * FROM users WHERE email=$1', [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = makeToken(user);
      return res.json({ token, user: safeUser(user) });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { name, phone, avatar_url } = req.body;
    try {
      const result = await query(
        `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone),
         avatar_url=COALESCE($3,avatar_url) WHERE id=$4 RETURNING *`,
        [name || null, phone || null, avatar_url || null, req.user.id]
      );
      return res.json({ user: safeUser(result.rows[0]) });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const { rows } = await query('SELECT password FROM users WHERE id=$1', [req.user.id]);
      const ok = await bcrypt.compare(currentPassword, rows[0].password);
      if (!ok) return res.status(401).json({ error: 'Current password incorrect' });

      const hash = await bcrypt.hash(newPassword, ROUNDS);
      await query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.user.id]);
      return res.json({ message: 'Password updated' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = { router, authenticate, requireAdmin, validate };
