import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${status} - ${message}`);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: "Validation Error",
      details: err.errors
    });
  }

  // Handle Prisma specific errors
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Unique constraint failed" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
