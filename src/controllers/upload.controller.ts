import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";

// 1. UPLOAD AVATAR
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ error: "Unauthorized to change this avatar" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId).catch(err => console.error("Cloudinary delete failed:", err));
    }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        avatar: url,
        avatarPublicId: publicId,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};

// 2. DELETE AVATAR
export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ error: "Unauthorized to delete this avatar" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !user.avatarPublicId) {
      return res.status(400).json({ error: "No avatar to delete" });
    }

    await deleteFromCloudinary(user.avatarPublicId);

    await prisma.user.update({
      where: { id },
      data: {
        avatar: null,
        avatarPublicId: null,
      },
    });

    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete avatar" });
  }
};

// 3. UPLOAD LISTING PHOTOS
export const uploadListingPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Listing ID
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Only the host can upload photos" });
    }

    const currentPhotoCount = listing.photos.length;
    if (currentPhotoCount >= 5) {
      return res.status(400).json({ error: "Maximum 5 photos allowed per listing" });
    }

    const slotsAvailable = 5 - currentPhotoCount;
    const filesToUpload = files.slice(0, slotsAvailable);

    const uploadPromises = filesToUpload.map(file => uploadToCloudinary(file.buffer, "airbnb/listings"));
    const results = await Promise.all(uploadPromises);

    await prisma.listingPhoto.createMany({
      data: results.map(res => ({
        url: res.url,
        publicId: res.publicId,
        listingId: id,
      })),
    });

    const updatedListing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: true },
    });

    res.status(200).json(updatedListing);
  } catch (error) {
    console.error("Upload Photos Error:", error);
    res.status(500).json({ error: "Failed to upload photos" });
  }
};

// 4. DELETE LISTING PHOTO
export const deleteListingPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id, photoId } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ error: "Only the host can delete photos" });
    }

    const photo = await prisma.listingPhoto.findUnique({ where: { id: Number(photoId) } });
    if (!photo || photo.listingId !== id) {
      return res.status(404).json({ error: "Photo not found or doesn't belong to this listing" });
    }

    await deleteFromCloudinary(photo.publicId);
    await prisma.listingPhoto.delete({ where: { id: Number(photoId) } });

    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete photo" });
  }
};
