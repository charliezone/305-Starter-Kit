import { streamText, type ModelMessage } from "ai";
import { DEFAULT_MODEL, AI_CONFIG } from "./ai-config";

export async function generateChatStream(messages: ModelMessage[]) {
  const result = streamText({
    model: DEFAULT_MODEL,
    system: AI_CONFIG.systemPrompt,
    messages,
    maxOutputTokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
  });

  return result;
}
