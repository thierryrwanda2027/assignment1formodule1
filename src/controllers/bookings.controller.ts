import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/emails";

// 1. CREATE BOOKING
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, checkIn, checkOut } = req.body;
    const guestId = req.userId;

    if (!listingId || !checkIn || !checkOut || !guestId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ error: "Check-out must be after check-in" });
    }

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { not: "CANCELLED" },
        OR: [
          { checkIn: { lt: end }, checkOut: { gt: start } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "Booking conflict: dates already taken" });
    }

    const totalPrice = listing.pricePerNight * nights;

    const booking = await prisma.booking.create({
      data: {
        listingId,
        guestId,
        checkIn: start,
        checkOut: end,
        totalPrice,
        status: "CONFIRMED",
      },
      include: {
        guest: true,
        listing: true,
      },
    });

    // Send confirmation email
    sendEmail(
      booking.guest.email,
      "Booking Confirmation",
      bookingConfirmationEmail(
        booking.guest.name,
        booking.listing.title,
        booking.listing.location,
        start.toDateString(),
        end.toDateString(),
        totalPrice
      )
    );

    res.status(201).json(booking);
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

// 2. CANCEL BOOKING
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { guest: true, listing: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only guest or admin can cancel
    if (booking.guestId !== userId && req.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized to cancel this booking" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { guest: true, listing: true },
    });

    // Send cancellation email
    sendEmail(
      updatedBooking.guest.email,
      "Booking Cancellation",
      bookingCancellationEmail(
        updatedBooking.guest.name,
        updatedBooking.listing.title,
        updatedBooking.checkIn.toDateString(),
        updatedBooking.checkOut.toDateString()
      )
    );

    res.status(200).json({ message: "Booking cancelled successfully", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};

// 3. GET MY BOOKINGS
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
    });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
