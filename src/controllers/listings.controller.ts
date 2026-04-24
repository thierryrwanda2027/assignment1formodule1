import type { Request, Response } from "express";
import prisma from "../config/prisma";

// 1. GET ALL LISTINGS
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        pricePerNight: true,
        type: true,
        host: {
          select: { name: true, avatar: true }
        }
      }
    });
    res.status(200).json(listings);
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
        host: true
      }
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listing" });
  }
};

// 3. CREATE LISTING
export const createListing = async (req: Request, res: Response) => {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities, hostId } = req.body;

    if (!title || !description || !location || !pricePerNight || !guests || !type || !amenities || !hostId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify host exists
    const hostExists = await prisma.user.findUnique({ where: { id: hostId } });
    if (!hostExists) {
      return res.status(404).json({ error: "Host not found" });
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
export const updateListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: req.body
    });

    res.status(200).json(updatedListing);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.status(500).json({ error: "Failed to update listing" });
  }
};

// 5. DELETE LISTING
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.listing.delete({ where: { id } });
    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.status(500).json({ error: "Failed to delete listing" });
  }
};
