import { Router } from "express";
import { createBooking, cancelBooking, getMyBookings } from "../controllers/bookings.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createBooking);
router.delete("/:id", authenticate, cancelBooking);
router.get("/me", authenticate, getMyBookings);

export default router;
