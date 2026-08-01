import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { handleCreateGroup, handleGetMyGroups, handleGetGroupDetails } from '../controllers/groupController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', handleCreateGroup);
router.get('/', handleGetMyGroups);
router.get('/:groupId', handleGetGroupDetails);

export const groupRoutes = router;
