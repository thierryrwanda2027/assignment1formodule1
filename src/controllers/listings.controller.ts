import type { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { getOptimizedUrl } from "../utils/cloudinary";

// 1. GET ALL LISTINGS
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        host: {
          select: { name: true, avatar: true }
        },
        photos: true
      }
    });

    // Optimize photo URLs
    const optimizedListings = listings.map((listing: any) => ({
      ...listing,
      photos: listing.photos.map((photo: any) => ({
        ...photo,
        url: getOptimizedUrl(photo.url, 600, 400)
      }))
    }));

    res.status(200).json(optimizedListings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};

// 2. GET LISTING BY ID
export const getListingById = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
};

// 3. CREATE LISTING
export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities } = req.body;
    const hostId = req.userId;

    if (!title || !description || !location || !pricePerNight || !guests || !type || !amenities || !hostId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    res.status(201).json(newListing);
  } catch (error) {
    console.error("Create Listing Error:", error);
    res.status(500).json({ error: "Failed to create listing" });
  }
};

// 4. UPDATE LISTING
export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
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

    res.status(200).json(updatedListing);
  } catch (error) {
    res.status(500).json({ error: "Failed to update listing" });
  }
};

// 5. DELETE LISTING
export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
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
    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete listing" });
  }
};

