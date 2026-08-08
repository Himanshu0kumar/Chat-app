import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, findUserById } from '../database.js';
import { config } from '../config/index.js';

export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

export async function registerUser({ username, password }) {
  if (!username || !password) {
    const err = new Error('Username and password are required');
    err.statusCode = 400;
    throw err;
  }

  const trimmedUser = username.trim();
  if (trimmedUser.length < 3) {
    const err = new Error('Username must be at least 3 characters long');
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error('Password must be at least 6 characters long');
    err.statusCode = 400;
    throw err;
  }

  const existing = await findUserByUsername(trimmedUser);
  if (existing) {
    const err = new Error('Username is already taken');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await createUser(trimmedUser, passwordHash);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: newUser.id,
      tag_id: newUser.tag_id,
      username: newUser.username,
    },
  };
}

export async function authenticateUser({ username, password }) {
  if (!username || !password) {
    const err = new Error('Username and password are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await findUserByUsername(username.trim());
  if (!user) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      tag_id: user.tag_id,
      username: user.username,
    },
  };
}

export async function getCurrentUser(token) {
  if (!token) {
    const err = new Error('No token provided');
    err.statusCode = 401;
    throw err;
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}
