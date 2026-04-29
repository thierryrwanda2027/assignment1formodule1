import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prisma";
import { sendEmail } from "../config/email";
import { welcomeEmail, passwordResetEmail } from "../templates/emails";
import { catchAsync } from "../utils/catchAsync";

const JWT_SECRET = process.env["JWT_SECRET"] || "super-secret";
const JWT_EXPIRES_IN = process.env["JWT_EXPIRES_IN"] || "7d";

// 1. REGISTER
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, username, password, phone, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      password: hashedPassword,
      phone,
      role: role || "GUEST",
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);

  // Send welcome email (non-blocking, after response)
  sendEmail(user.email, "Welcome to Airbnb!", welcomeEmail(user.name, user.role));
});

// 2. LOGIN
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );

  const { password: _, ...userWithoutPassword } = user;
  res.status(200).json({ token, user: userWithoutPassword });
});

// 3. FORGOT PASSWORD
export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(200).json({ message: "If an account exists, a reset link was sent." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    },
  });

  const apiUrl = process.env["API_URL"] || "http://localhost:3000";
  const resetLink = `${apiUrl}/auth/reset-password/${resetToken}`;
  
  res.status(200).json({ message: "If an account exists, a reset link was sent." });

  // Send email after response
  sendEmail(user.email, "Password Reset Request", passwordResetEmail(user.name, resetLink));
});

// 4. RESET PASSWORD
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ message: "Password reset successful" });
});
