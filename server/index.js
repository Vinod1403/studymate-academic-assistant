import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ override: true });

const app = express();
const port = Number(process.env.PORT || 3001);
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const prompts = {
  chat: "You are StudyMate, a friendly academic assistant. Explain concepts clearly in simple English. Use headings and examples when useful. Be honest when unsure and never invent citations.",
  generate: "You are an academic study assistant. Create well-organized study notes based on the student's topic. Use a short definition, key points, examples, and a quick recap. Keep language simple.",
  summarize: "Summarize the provided academic text in simple English. Preserve the main ideas and important facts. Use a concise summary and bullet points. Do not add facts that are not in the text.",
  categorize: "Classify the provided academic text. Return: Main subject, specific topic, 2-5 keywords, and a one-sentence reason. If uncertain, say so."
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/ai/ask", async (req, res) => {
  try {
    const { task = "chat", text = "" } = req.body ?? {};
    if (!["chat", "generate", "summarize", "categorize"].includes(task)) {
      return res.status(400).json({ error: "Choose a valid task." });
    }
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Please enter a question or academic text." });
    }
    if (text.length > 20000) {
      return res.status(413).json({ error: "Please keep the input under 20,000 characters." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key is missing. Add it to your .env file and restart the server." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: `${prompts[task]}\n\nStudent's input:\n${text.trim()}`,
      config: { temperature: task === "categorize" ? 0.2 : 0.6 }
    });

    const answer = response.text?.trim();
    if (!answer) throw new Error("The AI returned an empty response. Please try again.");
    res.json({ answer, task });
  } catch (error) {
    const message = String(error?.message || "");
    const status = Number(error?.status || error?.code || 0);
    const safeMessage = process.env.GEMINI_API_KEY
      ? message.replaceAll(process.env.GEMINI_API_KEY, "[REDACTED]")
      : message;
    console.error("Gemini request failed:", { status, model, message: safeMessage });
    if (status === 401 || status === 403 || /API key|PERMISSION_DENIED|invalid.*key/i.test(message)) {
      return res.status(502).json({ error: "Gemini could not authenticate. Check that your API key is valid and enabled." });
    }
    if (status === 429 || /quota|429|RESOURCE_EXHAUSTED/i.test(message)) {
      return res.status(429).json({ error: "Gemini API quota or rate limit reached. Check your Google AI Studio usage and try later." });
    }
    if (status === 503 || /UNAVAILABLE|high demand|temporarily unavailable/i.test(message)) {
      return res.status(503).json({ error: "Gemini is temporarily unavailable due to high demand. Please try again shortly." });
    }
    if (status === 404 || /model.*(not found|unavailable)|not available to new users|NOT_FOUND/i.test(message)) {
      return res.status(502).json({ error: `The configured Gemini model "${model}" is unavailable. Set GEMINI_MODEL to a model supported by your API key and restart the server.` });
    }
    if (error?.code === "ENOTFOUND" || error?.code === "ETIMEDOUT" || /network|fetch failed|timed out/i.test(message)) {
      return res.status(502).json({ error: "Could not reach Gemini. Check your network connection and try again." });
    }
    res.status(500).json({ error: "Something went wrong while generating the answer. Check the server terminal and try again." });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  return next(error);
});

app.listen(port, () => {
  console.log(`StudyMate API running at http://localhost:${port} using ${model}`);
});
