import { Router } from 'express';
import { getAllUsers, getUserById, getMe, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes (or Admin only depending on choice)
router.get('/', authenticate, getAllUsers);
router.get('/me', authenticate, getMe);
router.get('/:id', authenticate, getUserById);

// Protected routes
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;

