// Server-only AI client (used by the API in server/). Any OpenAI-compatible chat-completions gateway
// (AI Lodge uses apiyi). Config from env only:
//   API_KEY            required (old name OPENAI_API_KEY still works)
//   API_BASE_URL       default https://api.apiyi.com/v1 (old name OPENAI_BASE_URL)
//   MODEL_NAME         text model, rescue recipes (old name OPENAI_MODEL); default deepseek-v4-flash (JSON mode + zod)
//   VISION_MODEL_NAME  receipt reading (json_schema); default gemini-3.5-flash-lite (DeepSeek has no vision)
// The original used the OpenAI Responses API (original-supabase/lib/openai.ts).
import OpenAI from "openai";

let client: OpenAI | undefined;

export function aiConfigured(): boolean {
  return Boolean(process.env.API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export function getAI(): OpenAI {
  if (!aiConfigured()) throw new Error("API_KEY is not configured");
  return client ??= new OpenAI({
    apiKey: process.env.API_KEY?.trim() || process.env.OPENAI_API_KEY!.trim(),
    baseURL: process.env.API_BASE_URL?.trim() || process.env.OPENAI_BASE_URL?.trim() || "https://api.apiyi.com/v1",
    maxRetries: 1,
    timeout: 60_000,
  });
}

export function textModel(): string {
  return process.env.MODEL_NAME?.trim() || process.env.OPENAI_MODEL?.trim() || "deepseek-v4-flash";
}

export function visionModel(): string {
  return process.env.VISION_MODEL_NAME?.trim() || "gemini-3.5-flash-lite";
}

/** The JSON text of a chat-completions reply (some models wrap it in code fences). */
export function replyJson(response: OpenAI.Chat.Completions.ChatCompletion): unknown {
  const text = response.choices[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The model's reply had no JSON");
  return JSON.parse(text.slice(start, end + 1));
}
