import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, translationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { TranslateBody, LookupDictionaryQueryParams } from "@workspace/api-zod";

const router = Router();

router.post("/translate", async (req, res) => {
  const parse = TranslateBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text, saveToHistory } = parse.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a professional Chinese to Vietnamese translator with deep knowledge of Classical and Modern Chinese. 
When given Chinese text, you must return a JSON object with:
1. "translatedText": the full Vietnamese translation (natural, idiomatic Vietnamese)
2. "pinyin": the full pinyin romanization of the original text (with tone marks)
3. "dictionary": an array of unique Chinese words/characters found in the text, each with:
   - "simplified": the simplified Chinese character(s)
   - "traditional": the traditional Chinese character(s) (if different)
   - "pinyin": pinyin with tone marks for this word
   - "meanings": array of Vietnamese meanings/definitions (2-5 meanings covering different contexts)
   - "examples": array of 1-2 example sentences, each with "chinese", "pinyin", and "vietnamese"

Return ONLY valid JSON, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content ?? "{}";
    let parsed: {
      translatedText?: string;
      pinyin?: string;
      dictionary?: Array<{
        simplified: string;
        traditional?: string;
        pinyin: string;
        meanings: string[];
        examples?: Array<{ chinese: string; pinyin: string; vietnamese: string }>;
      }>;
    };

    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = { translatedText: rawResponse, pinyin: "", dictionary: [] };
    }

    const result = {
      originalText: text,
      translatedText: parsed.translatedText ?? "",
      pinyin: parsed.pinyin ?? "",
      dictionary: (parsed.dictionary ?? []).map((d) => ({
        simplified: d.simplified,
        traditional: d.traditional,
        pinyin: d.pinyin,
        meanings: d.meanings,
        examples: d.examples ?? [],
      })),
    };

    if (saveToHistory && result.translatedText) {
      await db.insert(translationsTable).values({
        originalText: text,
        translatedText: result.translatedText,
        pinyin: result.pinyin,
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Translation error");
    res.status(500).json({ error: "Translation failed" });
  }
});

router.get("/dictionary", async (req, res) => {
  const parse = LookupDictionaryQueryParams.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: "Missing word parameter" });
    return;
  }

  const { word } = parse.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are a comprehensive Chinese-Vietnamese dictionary. When given a Chinese word or character, return a JSON object with:
- "word": the queried word
- "entries": array of dictionary entries, each with:
  - "simplified": simplified Chinese
  - "traditional": traditional Chinese (if different)
  - "pinyin": pinyin with tone marks
  - "meanings": array of Vietnamese meanings/definitions (3-6 meanings for different contexts: noun, verb, adjective uses etc.)
  - "examples": array of 2-3 example sentences, each with "chinese", "pinyin", and "vietnamese"

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: word,
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { word?: string; entries?: unknown[] };

    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = { word, entries: [] };
    }

    res.json({
      word,
      entries: parsed.entries ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Dictionary lookup error");
    res.status(500).json({ error: "Dictionary lookup failed" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const history = await db
      .select()
      .from(translationsTable)
      .orderBy(desc(translationsTable.createdAt))
      .limit(50);

    res.json(
      history.map((t) => ({
        id: t.id,
        originalText: t.originalText,
        translatedText: t.translatedText,
        pinyin: t.pinyin,
        createdAt: t.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "History fetch error");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.delete("/history", async (req, res) => {
  try {
    await db.delete(translationsTable);
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Clear history error");
    res.status(500).json({ error: "Failed to clear history" });
  }
});

router.delete("/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    await db.delete(translationsTable).where(eq(translationsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Delete history error");
    res.status(500).json({ error: "Failed to delete history" });
  }
});

export default router;
