import type { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

// Helper to exclude sensitive fields
const excludeSensitive = (user: any) => {
  const { password, resetToken, resetTokenExpiry, ...rest } = user;
  return rest;
};

// 1. GET ALL USERS (Admin only or Public depending on requirements)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { listings: true }
        }
      }
    });
    res.status(200).json(users.map(excludeSensitive));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 2. GET USER BY ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(excludeSensitive(user));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// 3. GET ME
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { listings: true, bookings: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(excludeSensitive(user));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// 4. UPDATE USER
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id && req.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized to update this profile" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: req.body
    });
    res.status(200).json(excludeSensitive(updatedUser));
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// 5. DELETE USER
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id && req.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized to delete this profile" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

