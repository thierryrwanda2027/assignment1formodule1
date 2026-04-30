import { ChatGroq } from "@langchain/groq";
import "dotenv/config";

// Creative model for generative tasks (Descriptions, Chatbot)
export const model = new ChatGroq({
  apiKey: process.env["GROQ_API_KEY"],
  model: "llama3-8b-8192",
  temperature: 0.7,
});

// Deterministic model for extraction tasks (Search, Recommendation structure)
export const structuredModel = new ChatGroq({
  apiKey: process.env["GROQ_API_KEY"],
  model: "llama3-8b-8192",
  temperature: 0,
});

export default model;
