import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, findUserById } from './database.js';
import { config } from './config/index.js';

export const authRouter = express.Router();
export const JWT_SECRET = config.jwtSecret;

// Register a new user
authRouter.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const trimmedUser = username.trim();
    if (trimmedUser.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existing = await findUserByUsername(trimmedUser);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser(trimmedUser, passwordHash);

    // Sign JWT Token using unified config.jwtSecret
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        tag_id: newUser.tag_id,
        username: newUser.username,
      },
    });
  } catch (err) {
    console.error('[Auth Error] Signup failed:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Log in existing user
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await findUserByUsername(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password with bcryptjs
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Sign JWT Token using unified config.jwtSecret
    const token = jwt.sign(
      { id: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        tag_id: user.tag_id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('[Auth Error] Login failed:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Verify token / Current User profile
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// JWT Verification helper for Socket.IO handshake
export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}
