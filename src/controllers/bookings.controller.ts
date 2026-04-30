import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { sendEmail } from "../config/email";
import { bookingConfirmationEmail, bookingCancellationEmail } from "../templates/emails";
import { catchAsync } from "../utils/catchAsync";

// 1. CREATE BOOKING
export const createBooking = catchAsync(async (req: AuthRequest, res: Response) => {
  const { listingId, checkIn, checkOut, guests } = req.body;
  const guestId = req.userId!;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return res.status(400).json({ error: "Check-out must be after check-in" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  const totalPrice = listing.pricePerNight * nights;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Check for conflicts inside the transaction
      const conflict = await tx.booking.findFirst({
        where: {
          listingId,
          status: "CONFIRMED",
          checkIn: { lt: end },
          checkOut: { gt: start },
        },
      });

      if (conflict) {
        throw new Error("BOOKING_CONFLICT");
      }

      return tx.booking.create({
        data: {
          listingId,
          guestId,
          checkIn: start,
          checkOut: end,
          guests: Number(guests),
          totalPrice,
          status: "CONFIRMED",
        },
        include: {
          guest: true,
          listing: true,
        },
      });
    });

    res.status(201).json(booking);

    // Send confirmation email (after response)
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
  } catch (error: any) {
    if (error.message === "BOOKING_CONFLICT") {
      return res.status(409).json({ error: "Booking conflict: dates already taken" });
    }
    throw error;
  }
});

// 2. CANCEL BOOKING
export const cancelBooking = catchAsync(async (req: AuthRequest, res: Response) => {
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

  res.status(200).json({ message: "Booking cancelled successfully", booking: updatedBooking });

  // Send cancellation email (after response)
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
});

// 3. GET MY BOOKINGS (Paginated)
export const getMyBookings = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId: userId },
      skip,
      take: limit,
      include: { listing: { select: { title: true, location: true } } },
    }),
    prisma.booking.count({ where: { guestId: userId } }),
  ]);

  res.status(200).json({
    data: bookings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 3.5 GET USER BOOKINGS BY ID (Paginated)
export const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId: id },
      skip,
      take: limit,
      include: { listing: { select: { title: true, location: true } } },
    }),
    prisma.booking.count({ where: { guestId: id } }),
  ]);

  res.status(200).json({
    data: bookings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 4. GET ALL BOOKINGS (Paginated)
export const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take: limit,
      include: {
        guest: { select: { name: true } },
        listing: { select: { title: true, location: true } }
      },
    }),
    prisma.booking.count(),
  ]);

  res.status(200).json({
    data: bookings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 5. GET BOOKING BY ID
export const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guest: true, listing: true }
  });

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  res.status(200).json(booking);
});

