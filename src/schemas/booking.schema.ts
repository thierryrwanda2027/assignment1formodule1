import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    listingId: z.string().uuid(),
    checkIn: z.string().datetime().or(z.string()),
    checkOut: z.string().datetime().or(z.string()),
  }),
});
