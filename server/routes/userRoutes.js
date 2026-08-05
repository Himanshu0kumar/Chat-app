import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getUsers, getProfile, updateProfile, searchUsers, getConversations, deleteAccount } from '../controllers/userController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.get('/conversations', getConversations);
router.get('/search', searchUsers);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

export const userRoutes = router;
