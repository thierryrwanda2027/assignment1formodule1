import { Router } from "express";
import {
  smartSearch,
  generateListingDescription,
  chat,
  recommendBookings,
  summarizeReviews,
} from "../../controllers/v1/ai.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Search listings using natural language
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Listings matching query
 */
router.post("/search", smartSearch);

/**
 * @swagger
 * /ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate a listing description using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tone:
 *                 type: string
 *                 example: "luxury"
 *     responses:
 *       200:
 *         description: Generated listing description
 */
router.post("/listings/:id/generate-description", authenticate, generateListingDescription);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with the Airbnb AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, sessionId]
 *             properties:
 *               message:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               listingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post("/chat", chat);

/**
 * @swagger
 * /ai/recommend:
 *   post:
 *     summary: Recommend bookings using AI based on history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 */
router.post("/recommend", authenticate, recommendBookings);

/**
 * @swagger
 * /ai/listings/{id}/review-summary:
 *   get:
 *     summary: Summarize reviews for a listing
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary generated successfully
 */
router.get("/listings/:id/review-summary", summarizeReviews);

export default router;
