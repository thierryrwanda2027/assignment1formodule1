import type { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { catchAsync } from "../utils/catchAsync";
import { getCache, setCache, clearCache } from "../config/cache";

export const createReview = catchAsync(async (req: AuthRequest, res: Response) => {
  const { listingId, rating, comment } = req.body;
  const guestId = req.userId!;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

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

  // Invalidate caches
  clearCache(`reviews_${listingId}_1_10`);
  clearCache(`review_summary_${listingId}`);

  return res.status(201).json(review);
});

export const getListingReviews = catchAsync(async (req: Request, res: Response) => {
  const { listingId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `reviews_${listingId}_${page}_${limit}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { listingId },
      skip,
      take: limit,
      include: { guest: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.review.count({ where: { listingId } })
  ]);

  const responseData = {
    data: reviews,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };

  setCache(cacheKey, responseData, 30); // Cache for 30s

  res.status(200).json(responseData);
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

  // Clear cache
  clearCache(`reviews_${review.listingId}`);

  res.status(200).json({ message: "Review deleted successfully" });
});
