import express from 'express';
import { handleSignup, handleLogin, handleGetMe } from '../controllers/authController.js';

export const authRoutes = express.Router();

authRoutes.post('/signup', handleSignup);
authRoutes.post('/login', handleLogin);
authRoutes.get('/me', handleGetMe);
