import type { Request, Response } from "express";
import prisma from "../config/prisma";

// 1. GET ALL USERS
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { listings: true }
        }
      }
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 2. GET USER BY ID
export const getUserById = async (req: Request, res: Response) => {
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

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// 3. CREATE USER
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, phone, role, avatar, bio } = req.body;

    if (!name || !email || !username || !phone || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newUser = await prisma.user.create({
      data: { name, email, username, phone, role, avatar, bio }
    });

    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};

// 4. UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: req.body
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
};

// 5. DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to delete user" });
  }
};
