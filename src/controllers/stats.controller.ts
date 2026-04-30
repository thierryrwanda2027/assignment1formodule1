import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getCache, setCache, clearCachePrefix } from "../config/cache";
import { catchAsync } from "../utils/catchAsync";

// 1. GET LISTING STATS
export const getListingStats = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = "stats_listings";
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalListings, averagePriceAggr, byLocation, byType] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.aggregate({
      _avg: { pricePerNight: true }
    }),
    prisma.listing.groupBy({
      by: ['location'],
      _count: { location: true },
      orderBy: { _count: { location: 'desc' } }
    }),
    prisma.listing.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    })
  ]);

  const responseData = {
    totalListings,
    averagePrice: averagePriceAggr._avg.pricePerNight || 0,
    byLocation,
    byType
  };

  setCache(cacheKey, responseData, 300); // Cache for 5 minutes

  res.status(200).json(responseData);
});

// 2. GET USER STATS
export const getUsersStats = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = "stats_users";
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalUsers, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      orderBy: { _count: { role: 'desc' } }
    })
  ]);

  const responseData = {
    totalUsers,
    byRole
  };

  setCache(cacheKey, responseData, 300); // Cache for 5 minutes

  res.status(200).json(responseData);
});
