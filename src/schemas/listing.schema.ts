import { z } from "zod";

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    pricePerNight: z.number().positive().or(z.string().regex(/^\\d+$/).transform(Number)),
    guests: z.number().int().positive().or(z.string().regex(/^\\d+$/).transform(Number)),
    type: z.string(),
    amenities: z.array(z.string()).or(z.string().transform(s => [s])),
    location: z.string(),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(10).optional(),
    pricePerNight: z.number().positive().or(z.string().regex(/^\\d+$/).transform(Number)).optional(),
    guests: z.number().int().positive().or(z.string().regex(/^\\d+$/).transform(Number)).optional(),
    type: z.string().optional(),
    amenities: z.array(z.string()).or(z.string().transform(s => [s])).optional(),
    location: z.string().optional(),
  }),
});

export const getListingsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\\d+$/).transform(Number).optional(),
    location: z.string().optional(),
    minPrice: z.string().regex(/^\\d+$/).transform(Number).optional(),
    maxPrice: z.string().regex(/^\\d+$/).transform(Number).optional(),
  }).optional(),
});
