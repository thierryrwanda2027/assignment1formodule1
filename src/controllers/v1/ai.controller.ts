import type { Request, Response } from "express";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { model, structuredModel } from "../../config/ai";
import prisma from "../../config/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { getCache, setCache, clearCachePrefix } from "../../config/cache";

// ─── 1. Smart Search (Pagination & Structured Filters) ──────────────────────

const searchPrompt = ChatPromptTemplate.fromTemplate(`
You are a search assistant for an Airbnb-like platform.
Extract search filters from the user's natural language query.

User query: {query}

Return a JSON object with these optional fields:
- location: string (city or area mentioned)
- type: one of APARTMENT, HOUSE, VILLA, CABIN (if mentioned)
- guests: number (max guests needed)
- maxPrice: number (maximum price per night in USD)

Return ONLY valid JSON. No explanation. No markdown. Example:
{{"location": "Miami", "type": "VILLA", "guests": 4, "maxPrice": 300}}

If a field is not mentioned, omit it from the JSON.
If no filters can be extracted, return an empty JSON object {{}}.
`);

const searchParser = new JsonOutputParser();
const searchChain = searchPrompt.pipe(structuredModel).pipe(searchParser);

export const smartSearch = catchAsync(async (req: Request, res: Response) => {
  const { query } = req.body;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!query) {
    return res.status(400).json({ error: "query is required in the body" });
  }

  const filters = await searchChain.invoke({ query }) as any;

  if (!filters || Object.keys(filters).length === 0) {
    return res.status(400).json({ error: "Could not extract any filters from your query, please be more specific" });
  }

  const where: any = {};
  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.guests) {
    where.guests = { gte: filters.guests };
  }
  if (filters.maxPrice) {
    where.pricePerNight = { lte: filters.maxPrice };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: {
        host: { select: { name: true, email: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  res.status(200).json({
    filters,
    data: listings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// ─── 2. AI Description Generator with Tone ────────────────────────────────────

const descriptionPrompt = ChatPromptTemplate.fromTemplate(`
You are a professional copywriter for an Airbnb-like platform.
Write a description using a {tone} tone.

Listing details:
- Title: {title}
- Location: {location}
- Type: {type}
- Max guests: {guests}
- Amenities: {amenities}
- Price per night: ${"{price}"} USD

Write a 3-paragraph description:
1. Opening hook — what makes this place special
2. The space — describe the property and its features
3. The location — what guests can do nearby

Keep it between 150-200 words. Be specific and inviting. Do not use generic phrases.
`);

const descriptionChain = descriptionPrompt.pipe(model).pipe(new StringOutputParser());

export const generateListingDescription = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const tone = req.body.tone || "professional";

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  if (listing.hostId !== req.userId && req.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized to generate description for this listing" });
  }

  const description = await descriptionChain.invoke({
    tone,
    title: listing.title,
    location: listing.location,
    type: listing.type,
    guests: listing.guests,
    amenities: listing.amenities.join(", "),
    price: listing.pricePerNight,
  });

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: { description },
  });

  res.status(200).json({ description, listing: updatedListing });
});

// ─── 3. Chatbot with Memory & Context ────────────────────────────────────────

const sessionHistories = new Map<string, InMemoryChatMessageHistory>();

function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, new InMemoryChatMessageHistory());
  }
  const history = sessionHistories.get(sessionId)!;
  return history;
}

const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful guest support assistant for an Airbnb-like platform.
{listingContext}

Answer questions accurately based on the details above. If asked something not covered, say you don't have that information.
Be friendly and concise.`
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
]);

const chatChain = chatPrompt.pipe(model).pipe(new StringOutputParser());

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chatChain,
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

export const chat = catchAsync(async (req: Request, res: Response) => {
  const { message, sessionId, listingId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: "message and sessionId are required" });
  }

  let listingContext = "You are a general assistant to help with bookings and generic platform questions.";
  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (listing) {
      listingContext = `You are currently helping a guest with questions about this specific listing:
Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ")}
Description: ${listing.description}`;
    }
  }

  const response = await chainWithHistory.invoke(
    { input: message, listingContext },
    { configurable: { sessionId } }
  );

  const history = getSessionHistory(sessionId);
  const messages = await history.getMessages();
  
  // Trim to last 20 messages (10 exchanges)
  if (messages.length > 20) {
    const trimmed = messages.slice(messages.length - 20);
    await history.clear();
    await history.addMessages(trimmed);
  }

  res.status(200).json({
    response,
    sessionId,
    messageCount: (await history.getMessages()).length,
  });
});

// ─── 4. Booking Recommendations ──────────────────────────────────────────────

const recommendPrompt = ChatPromptTemplate.fromTemplate(`
Analyze the user's booking history and recommend search filters.
History:
{history}

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{{
  "preferences": "string describing what the user likes",
  "searchFilters": {{
    "location": "string or null",
    "type": "string or null",
    "maxPrice": "number or null",
    "guests": "number or null"
  }},
  "reason": "string explaining the recommendation"
}}
`);

const recommendChain = recommendPrompt.pipe(structuredModel).pipe(new JsonOutputParser());

export const recommendBookings = catchAsync(async (req: any, res: Response) => {
  const userId = req.userId;

  const pastBookings = await prisma.booking.findMany({
    where: { guestId: userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { listing: true }
  });

  if (pastBookings.length === 0) {
    return res.status(400).json({ error: "No booking history found. Make some bookings first to get recommendations." });
  }

  const historyStr = pastBookings.map(b => 
    `Booked ${b.listing.type} in ${b.listing.location} for $${b.listing.pricePerNight}/night, capacity ${b.listing.guests}`
  ).join("\n");

  const recommendation = await recommendChain.invoke({ history: historyStr }) as any;

  const where: any = {};
  if (recommendation.searchFilters?.location) where.location = { contains: recommendation.searchFilters.location, mode: "insensitive" };
  if (recommendation.searchFilters?.type) where.type = recommendation.searchFilters.type;
  if (recommendation.searchFilters?.maxPrice) where.pricePerNight = { lte: recommendation.searchFilters.maxPrice };
  if (recommendation.searchFilters?.guests) where.guests = { gte: recommendation.searchFilters.guests };

  // Exclude previously booked
  where.id = { notIn: pastBookings.map(b => b.listingId) };

  const recommendations = await prisma.listing.findMany({
    where,
    take: 5,
  });

  res.status(200).json({
    preferences: recommendation.preferences,
    reason: recommendation.reason,
    searchFilters: recommendation.searchFilters,
    recommendations,
  });
});

// ─── 5. Listing Review Summarizer ──────────────────────────────────────────

const summaryPrompt = ChatPromptTemplate.fromTemplate(`
Summarize these guest reviews for an Airbnb listing:
{reviews}

Return ONLY a JSON object exactly like this (no markdown, no extra text):
{{
  "summary": "2-3 sentence overall summary of guest experience",
  "positives": ["string array of 3 things consistently praised"],
  "negatives": ["string array of complaints, empty if none"]
}}
`);

const summaryChain = summaryPrompt.pipe(structuredModel).pipe(new JsonOutputParser());

export const summarizeReviews = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `review_summary_${id}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return res.status(200).json(cached);
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  const reviews = await prisma.review.findMany({
    where: { listingId: id },
    include: { guest: { select: { name: true } } }
  });

  if (reviews.length < 3) {
    return res.status(400).json({ error: "Not enough reviews to generate a summary (minimum 3 required)" });
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const reviewsStr = reviews.map(r => `[${r.rating}/5 stars] ${r.guest.name}: ${r.comment}`).join("\n");

  const aiSummary = await summaryChain.invoke({ reviews: reviewsStr }) as any;

  const result = {
    summary: aiSummary.summary,
    positives: aiSummary.positives,
    negatives: aiSummary.negatives,
    averageRating: parseFloat(avgRating.toFixed(1)),
    totalReviews: reviews.length
  };

  setCache(cacheKey, result, 600); // Cache for 10 minutes (600s)

  res.status(200).json(result);
});
