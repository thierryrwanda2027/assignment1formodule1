import { Router } from "express";
import { createReview, getListingReviews, deleteReview } from "../controllers/reviews.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createReviewSchema } from "../schemas/review.schema";

const router = Router();

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a review for a listing you've stayed at
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId, rating, comment]
 *             properties:
 *               listingId:
 *                 type: string
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post("/", authenticate, validate(createReviewSchema), createReview);

/**
 * @swagger
 * /reviews/{listingId}:
 *   get:
 *     summary: Get reviews for a listing
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved
 */
router.get("/:listingId", getListingReviews);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete("/:id", authenticate, deleteReview);

export default router;
