import { Router } from "express";
import { createBooking, cancelBooking, getMyBookings, getAllBookings, getBookingById } from "../../controllers/bookings.controller";
import { strictLimiter } from "../../middlewares/rateLimiter";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createBookingSchema } from "../../schemas/booking.schema";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         listingId:
 *           type: string
 *         checkIn:
 *           type: string
 *           format: date
 *         checkOut:
 *           type: string
 *           format: date
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId, checkIn, checkOut]
 *             properties:
 *               listingId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post("/", authenticate, strictLimiter, validate(createBookingSchema), createBooking);

/**
 * @swagger
 * /bookings/me:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 */
router.get("/me", authenticate, getMyBookings);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
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
 *         description: Booking cancelled successfully
 */
router.post("/:id/cancel", authenticate, cancelBooking);

router.get("/", authenticate, getAllBookings);
router.get("/:id", authenticate, getBookingById);

export default router;
