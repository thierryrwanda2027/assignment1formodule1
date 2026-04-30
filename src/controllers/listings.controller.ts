import type { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { getOptimizedUrl } from "../utils/cloudinary";
import { catchAsync } from "../utils/catchAsync";
import { getCache, setCache, clearCachePrefix } from "../config/cache";

// 1. GET ALL LISTINGS (WITH PAGINATION AND FILTERING)
export const getAllListings = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const location = req.query.location as string;
  const type = req.query.type as string;
  const guests = req.query.guests ? parseInt(req.query.guests as string) : undefined;
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

  const where: any = {};
  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (type) {
    where.type = type;
  }
  if (guests !== undefined) {
    where.guests = { gte: guests };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerNight = {};
    if (minPrice !== undefined) where.pricePerNight.gte = minPrice;
    if (maxPrice !== undefined) where.pricePerNight.lte = maxPrice;
  }

  const cacheKey = `listings_${page}_${limit}_${location || ''}_${type || ''}_${guests || ''}_${minPrice || ''}_${maxPrice || ''}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        host: {
          select: { name: true, email: true, avatar: true }
        },
        photos: true
      }
    }),
    prisma.listing.count({ where })
  ]);

  // Optimize photo URLs
  const optimizedListings = listings.map((listing: any) => ({
    ...listing,
    photos: listing.photos.map((photo: any) => ({
      ...photo,
      url: getOptimizedUrl(photo.url, 600, 400)
    }))
  }));

  const responseData = {
    data: optimizedListings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };

  setCache(cacheKey, responseData, 60);

  res.status(200).json(responseData);
});

// 2. GET LISTING BY ID
export const getListingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      host: {
        select: { name: true, avatar: true, bio: true }
      },
      photos: true
    }
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  // Optimize photo URLs
  const optimizedListing = {
    ...listing,
    photos: listing.photos.map((photo: any) => ({
      ...photo,
      url: getOptimizedUrl(photo.url, 1200, 800)
    }))
  };

  res.status(200).json(optimizedListing);
});

// 3. CREATE LISTING
export const createListing = catchAsync(async (req: AuthRequest, res: Response) => {
  const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
  const hostId = req.userId!;

  if (req.role !== "HOST" && req.role !== "ADMIN") {
    return res.status(403).json({ error: "Only hosts can create listings" });
  }

  const newListing = await prisma.listing.create({
    data: {
      title,
      description,
      location,
      pricePerNight: Number(pricePerNight),
      guests: Number(guests),
      type,
      amenities,
      hostId
    }
  });

  clearCachePrefix("listings_");
  clearCachePrefix("stats_listings");

  res.status(201).json(newListing);
});

// 4. UPDATE LISTING
export const updateListing = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (listing.hostId !== userId && req.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized to update this listing" });
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: req.body
  });

  clearCachePrefix("listings_");
  clearCachePrefix("stats_listings");

  res.status(200).json(updatedListing);
});

// 5. DELETE LISTING
export const deleteListing = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (listing.hostId !== userId && req.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized to delete this listing" });
  }

  await prisma.listing.delete({ where: { id } });

  clearCachePrefix("listings_");
  clearCachePrefix("stats_listings");

  res.status(200).json({ message: "Listing deleted successfully" });
});

// 6. GET LISTING STATS (Raw Query)
export const getListingStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await prisma.$queryRaw`
    SELECT
      location,
      COUNT(*)::int AS total,
      ROUND(AVG("pricePerNight")::numeric, 2) AS avg_price,
      MIN("pricePerNight") AS min_price,
      MAX("pricePerNight") AS max_price
    FROM "Listing"
    GROUP BY location
    ORDER BY total DESC
  `;

  res.status(200).json(stats);
});
