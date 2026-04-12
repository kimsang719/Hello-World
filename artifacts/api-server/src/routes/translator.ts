import { Router } from "express";
import { db, translationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { TranslateBody, LookupDictionaryQueryParams } from "@workspace/api-zod";
import { translateWithDictionary, isDictionaryLoaded } from "../lib/vietphrase";

const router = Router();

router.post("/translate", async (req, res) => {
  const parse = TranslateBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text, saveToHistory } = parse.data;

  if (!isDictionaryLoaded()) {
    res.status(503).json({ error: "Từ điển chưa sẵn sàng, vui lòng thử lại sau" });
    return;
  }

  const translatedText = translateWithDictionary(text);

  const result = {
    originalText: text,
    translatedText,
    pinyin: "",
    dictionary: [],
  };

  if (saveToHistory && translatedText) {
    try {
      await db.insert(translationsTable).values({
        originalText: text,
        translatedText,
        pinyin: "",
      });
    } catch (err) {
      req.log.warn({ err }, "Failed to save to history");
    }
  }

  res.json(result);
});

router.get("/dictionary", async (req, res) => {
  const parse = LookupDictionaryQueryParams.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: "Missing word parameter" });
    return;
  }

  const { word } = parse.data;
  const translation = translateWithDictionary(word);

  res.json({
    word,
    entries: translation !== word
      ? [{ simplified: word, pinyin: "", meanings: [translation], examples: [] }]
      : [],
  });
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
