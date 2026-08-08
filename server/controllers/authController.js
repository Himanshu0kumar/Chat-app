import { registerUser, authenticateUser, getCurrentUser } from '../services/authService.js';

export async function handleSignup(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await registerUser({ username, password });
    res.status(201).json({
      message: 'Account created successfully',
      ...result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await authenticateUser({ username, password });
    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleGetMe(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const user = await getCurrentUser(token);
    res.json({ user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}
