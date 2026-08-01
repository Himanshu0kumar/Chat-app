import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return next(new Error('Invalid or expired authentication token'));
  }

  socket.user = decoded;
  next();
}
