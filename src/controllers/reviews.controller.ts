import type { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { catchAsync } from "../utils/catchAsync";

export const createReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const { listingId, rating, comment } = req.body;
  const guestId = req.userId!;

  // Optional: Verify the guest actually booked and stayed at the listing
  const hasBooked = await prisma.booking.findFirst({
    where: {
      guestId,
      listingId,
      status: "CONFIRMED",
      checkOut: { lt: new Date() } // They can only review after checkout
    }
  });

  if (!hasBooked) {
    return res.status(403).json({ error: "You can only review listings you have stayed at." });
  }

  // Check if they already reviewed
  const existingReview = await prisma.review.findFirst({
    where: { guestId, listingId }
  });

  if (existingReview) {
    return res.status(400).json({ error: "You have already reviewed this listing." });
  }

  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      guestId,
      listingId
    },
    include: { guest: { select: { name: true, avatar: true } } }
  });

  res.status(201).json(review);
});

export const getListingReviews = catchAsync(async (req: Request, res: Response) => {
  const { listingId } = req.params;

  const reviews = await prisma.review.findMany({
    where: { listingId },
    include: { guest: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "desc" }
  });

  res.status(200).json(reviews);
});

export const deleteReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  if (review.guestId !== userId && req.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized to delete this review" });
  }

  await prisma.review.delete({ where: { id } });
  res.status(200).json({ message: "Review deleted successfully" });
});
