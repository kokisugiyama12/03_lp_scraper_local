import { getGeminiClient } from "./client";
import {
  CONTACT_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionPrompt,
} from "./prompts";
import { isTollFree, phoneMatchesLocation } from "@/lib/config/area-codes";
import type { ContactInfo } from "@/types/result";

let lastApiCall = 0;

async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastApiCall;
  const minInterval = 4000;
  if (elapsed < minInterval) {
    await new Promise((resolve) => setTimeout(resolve, minInterval - elapsed));
  }
  lastApiCall = Date.now();
}

export interface ExtractionOptions {
  locationId?: string | null;
}

export async function extractContactInfo(
  pageText: string,
  options?: ExtractionOptions
): Promise<ContactInfo> {
  const fallback: ContactInfo = {
    phoneNumber: null,
    presidentName: null,
    companyName: null,
    allPhoneNumbers: [],
  };

  if (!pageText.trim()) return fallback;

  const client = getGeminiClient();
  if (!client) {
    return extractWithRegex(pageText, options);
  }

  try {
    await rateLimitDelay();

    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: CONTACT_EXTRACTION_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(buildExtractionPrompt(pageText));
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return extractWithRegex(pageText, options);

    const parsed = JSON.parse(jsonMatch[0]);
    const aiPhone = parsed.phoneNumber || null;

    const regexResult = extractWithRegex(pageText, options);
    const allPhones = regexResult.allPhoneNumbers || [];

    const bestPhone = selectBestPhone(aiPhone, allPhones, options?.locationId);

    return {
      phoneNumber: bestPhone,
      presidentName: parsed.presidentName || null,
      companyName: parsed.companyName || null,
      allPhoneNumbers: allPhones,
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    return extractWithRegex(pageText, options);
  }
}

function selectBestPhone(
  primaryPhone: string | null,
  allPhones: string[],
  locationId?: string | null,
): string | null {
  if (allPhones.length === 0 && !primaryPhone) return null;

  const candidates = [...new Set([...(primaryPhone ? [primaryPhone] : []), ...allPhones])];
  if (candidates.length === 0) return null;
  if (!locationId) {
    const local = candidates.find((p) => !isTollFree(p));
    return local || candidates[0];
  }

  const localMatching = candidates.filter(
    (p) => !isTollFree(p) && phoneMatchesLocation(p, locationId)
  );
  if (localMatching.length > 0) return localMatching[0];

  const localAny = candidates.filter((p) => !isTollFree(p));
  if (localAny.length > 0) return localAny[0];

  return candidates[0];
}

function normalizePhone(raw: string): string {
  return raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー－]/g, "-");
}

function extractAllPhones(text: string): string[] {
  const normalized = text
    .replace(/T\s+E\s+L/g, "TEL")
    .replace(/F\s+A\s+X/g, "FAX");

  const phones: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /(?:TEL|Tel|tel|電話|☎|お電話)[.：:\s\t\n]*([0-9０-９]{2,4}[-ー－][0-9０-９]{2,4}[-ー－][0-9０-９]{3,4})/g,
    /(0120[-ー－][0-9０-９]{2,4}[-ー－][0-9０-９]{2,4})/g,
    /(0800[-ー－][0-9０-９]{3,4}[-ー－][0-9０-９]{4})/g,
    /(0[0-9]{1,3}[-ー－][0-9]{2,4}[-ー－][0-9]{3,4})/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      const raw = match[1] || match[0];
      const phone = normalizePhone(raw);
      if (!seen.has(phone)) {
        seen.add(phone);
        phones.push(phone);
      }
    }
  }

  return phones;
}

function extractWithRegex(text: string, options?: ExtractionOptions): ContactInfo {
  const allPhones = extractAllPhones(text);
  const phoneNumber = selectBestPhone(null, allPhones, options?.locationId);

  // Company name
  let companyName: string | null = null;
  const companyPatterns = [
    /(?:会社名|称号|商号|社名|運営会社)[：:\s\t]*((?:株式会社|有限会社|合同会社|一般社団法人)\s*.+?)[\n\t]/,
    /(?:会社名|称号|商号|社名|運営会社)[：:\s\t]*(.+?(?:株式会社|有限会社|合同会社))[\s\n\t]/,
    /((?:株式会社|有限会社|合同会社|一般社団法人)\s*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z\s]{1,20})/u,
    /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{1,15}(?:株式会社|有限会社|合同会社))/u,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 40) {
        companyName = candidate;
        break;
      }
    }
  }

  // President name
  let presidentName: string | null = null;
  const presidentMatch = text.match(
    /代表取締役[社長]?\s*[\s　\t]+([^\s\n（(代]{2,10})/
  );
  if (presidentMatch) {
    presidentName = presidentMatch[1].trim();
  }
  if (!presidentName) {
    const altMatch = text.match(
      /代表者[：:\s\t]+代表取締役[\s　]+([^\s\n（(]{2,10})/
    );
    if (altMatch) {
      presidentName = altMatch[1].trim();
    }
  }
  if (!presidentName) {
    const simpleMatch = text.match(
      /(?:代表者|院長|オーナー)[：:\s\t]+([^\s\n（(代]{2,10})/
    );
    if (simpleMatch) {
      const name = simpleMatch[1].trim();
      if (name.length >= 2 && !name.includes("http") && !name.includes("を見る")) {
        presidentName = name;
      }
    }
  }

  return {
    phoneNumber,
    presidentName,
    companyName,
    allPhoneNumbers: allPhones,
  };
}
