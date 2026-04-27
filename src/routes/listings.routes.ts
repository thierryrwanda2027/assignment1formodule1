import { Router } from 'express';
import { getAllListings, getListingById, createListing, updateListing, deleteListing } from '../controllers/listings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllListings);
router.get('/:id', getListingById);

// Protected routes (Host/Admin only enforced in controller)
router.post('/', authenticate, createListing);
router.put('/:id', authenticate, updateListing);
router.delete('/:id', authenticate, deleteListing);

export default router;

