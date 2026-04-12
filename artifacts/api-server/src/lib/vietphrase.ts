import fs from "fs";
import path from "path";
import readline from "readline";
import { logger } from "./logger";

let dictionary: Map<string, string> | null = null;
let maxKeyLength = 0;

export async function loadVietPhraseDictionary(): Promise<void> {
  const dictPath = path.resolve(process.cwd(), "../../attached_assets/VietPhrase_1776007255745.txt");

  if (!fs.existsSync(dictPath)) {
    logger.warn({ dictPath }, "VietPhrase dictionary file not found");
    return;
  }

  dictionary = new Map();
  const fileStream = fs.createReadStream(dictPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.substring(0, eqIdx);
    const value = line.substring(eqIdx + 1).trim();
    if (key && value) {
      dictionary.set(key, value);
      if (key.length > maxKeyLength) maxKeyLength = key.length;
    }
  }

  logger.info({ entries: dictionary.size, maxKeyLength }, "VietPhrase dictionary loaded");
}

export function isDictionaryLoaded(): boolean {
  return dictionary !== null;
}

function pickFirstMeaning(value: string): string {
  // VietPhrase dùng "/" để phân tách nghĩa, "|" để phân tách tên gọi khác
  return value.split("/")[0].split("|")[0].trim();
}

export function translateWithDictionary(text: string): string {
  if (!dictionary) return text;

  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Pass through non-Chinese characters directly (spaces, punctuation, latin, numbers)
    if (!/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff\u31c0-\u31ef]/.test(ch)) {
      result.push(ch);
      i++;
      continue;
    }

    // Greedy longest-match for Chinese characters
    const maxLen = Math.min(maxKeyLength, text.length - i);
    let matched = false;

    for (let len = maxLen; len >= 1; len--) {
      const key = text.substring(i, i + len);
      const value = dictionary.get(key);
      if (value !== undefined) {
        const meaning = pickFirstMeaning(value);
        if (result.length > 0 && !/\s$/.test(result[result.length - 1])) {
          result.push(" ");
        }
        result.push(meaning);
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No match found — keep the original character
      result.push(ch);
      i++;
    }
  }

  return result.join("").trim();
}
