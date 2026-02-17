import { openai } from "@ai-sdk/openai";

export const DEFAULT_MODEL = openai("gpt-4o-mini");

export const AI_CONFIG = {
  maxTokens: 2048,
  temperature: 0.7,
  systemPrompt: `You are a helpful AI assistant for the 305 Starter Kit platform. 
You provide concise, accurate, and professional responses.`,
} as const;
