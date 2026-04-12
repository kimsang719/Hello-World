import fs from "fs";
import path from "path";
import readline from "readline";
import { logger } from "./logger";

let dictionary: Map<string, string> | null = null;
let phienAmDict: Map<string, string> | null = null;
let maxKeyLength = 0;

async function loadFile(filePath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.substring(0, eqIdx);
    const value = line.substring(eqIdx + 1).trim();
    if (key && value) map.set(key, value);
  }
  return map;
}

export async function loadVietPhraseDictionary(): Promise<void> {
  const base = path.resolve(process.cwd(), "../../attached_assets");
  const vietPhrasePath = path.join(base, "VietPhrase_1776007255745.txt");
  const phienAmPath = path.join(base, "ChinesePhienAmWords_1776007975102.txt");

  if (!fs.existsSync(vietPhrasePath)) {
    logger.warn({ vietPhrasePath }, "VietPhrase dictionary file not found");
    return;
  }

  dictionary = await loadFile(vietPhrasePath);
  for (const key of dictionary.keys()) {
    if (key.length > maxKeyLength) maxKeyLength = key.length;
  }
  logger.info({ entries: dictionary.size, maxKeyLength }, "VietPhrase dictionary loaded");

  if (fs.existsSync(phienAmPath)) {
    phienAmDict = await loadFile(phienAmPath);
    logger.info({ entries: phienAmDict.size }, "PhienAm dictionary loaded");
  } else {
    logger.warn({ phienAmPath }, "PhienAm dictionary file not found");
  }
}

export function isDictionaryLoaded(): boolean {
  return dictionary !== null;
}

function pickFirstMeaning(value: string): string {
  return value.split("/")[0].split("|")[0].trim();
}

const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff\u31c0-\u31ef]/;

export function translateWithDictionary(text: string): string {
  if (!dictionary) return text;

  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Pass through non-Chinese characters directly
    if (!CHINESE_RE.test(ch)) {
      result.push(ch);
      i++;
      continue;
    }

    // Greedy longest-match against VietPhrase
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
      // Fallback: look up single character in PhienAm dictionary
      const phienAm = phienAmDict?.get(ch);
      if (phienAm) {
        const meaning = pickFirstMeaning(phienAm);
        if (result.length > 0 && !/\s$/.test(result[result.length - 1])) {
          result.push(" ");
        }
        result.push(meaning);
      } else {
        // No match anywhere — keep original character
        result.push(ch);
      }
      i++;
    }
  }

  return result.join("").trim();
}
