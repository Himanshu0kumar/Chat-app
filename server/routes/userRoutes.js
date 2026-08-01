import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getUsers, getProfile, updateProfile, searchUsers, getConversations } from '../controllers/userController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.get('/conversations', getConversations);
router.get('/search', searchUsers);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export const userRoutes = router;
