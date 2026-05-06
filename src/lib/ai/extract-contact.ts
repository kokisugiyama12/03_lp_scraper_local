import { getTeleapoConfig } from "@/lib/config/teleapo-config";
import { uniquePhones, normalizePhone } from "@/lib/utils/phones";
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
  // 旧API (locationIdを使った優先順位選定) は phones.ts に移ったので使わない
  locationId?: string | null;
}

interface BackendResponse {
  data?: {
    companyNameFormal: string | null;
    companyNameBrand: string | null;
    presidentName: string | null;
    phones: string[];
  };
  error?: string;
  usage?: { remaining: number; limit: number };
}

async function callBackendExtract(
  pageText: string
): Promise<BackendResponse | null> {
  const { apiBase, licenseKey } = getTeleapoConfig();
  if (!apiBase || !licenseKey) return null;

  try {
    const response = await fetch(`${apiBase}/api/ai/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey,
      },
      body: JSON.stringify({ pageText }),
    });
    const json = (await response.json()) as BackendResponse;
    if (!response.ok) {
      console.error("Backend extract error:", response.status, json.error);
      return null;
    }
    return json;
  } catch (error) {
    console.error("Backend extract request failed:", error);
    return null;
  }
}

const EMPTY_CONTACT: ContactInfo = {
  companyNameFormal: null,
  companyNameBrand: null,
  presidentName: null,
  phones: [],
};

export async function extractContactInfo(
  pageText: string
): Promise<ContactInfo> {
  if (!pageText.trim()) return { ...EMPTY_CONTACT };

  await rateLimitDelay();
  const backend = await callBackendExtract(pageText);

  if (!backend?.data) {
    // AI 不可時は regex フォールバック
    return extractWithRegex(pageText);
  }

  // AIから得た phones に regex フォールバックの phones も合算 (取りこぼし防止)
  const aiPhones = backend.data.phones || [];
  const regexFallback = extractWithRegex(pageText);
  const allPhones = uniquePhones([...aiPhones, ...regexFallback.phones]);

  return {
    companyNameFormal: backend.data.companyNameFormal,
    companyNameBrand: backend.data.companyNameBrand,
    presidentName: backend.data.presidentName,
    phones: allPhones,
  };
}

/**
 * 2つの ContactInfo をマージする。前者を優先 (前のステップで取れたものは保持)。
 * phones は両方の和集合 (重複排除)。
 */
export function mergeContact(a: ContactInfo, b: ContactInfo): ContactInfo {
  return {
    companyNameFormal: a.companyNameFormal || b.companyNameFormal,
    companyNameBrand: a.companyNameBrand || b.companyNameBrand,
    presidentName: a.presidentName || b.presidentName,
    phones: uniquePhones([...a.phones, ...b.phones]),
  };
}

/** AI 不在時の正規表現ベースのフォールバック抽出 */
function extractWithRegex(text: string): ContactInfo {
  const phones = extractAllPhones(text);

  let companyNameFormal: string | null = null;
  let companyNameBrand: string | null = null;

  // 法人格を含む正式名称
  const formalPatterns = [
    /((?:株式会社|有限会社|合同会社|医療法人(?:社団|財団)?|一般社団法人|一般財団法人|学校法人|社会福祉法人|宗教法人)\s*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z\s]{1,30})/u,
    /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z\s]{1,20}(?:株式会社|有限会社|合同会社))/u,
  ];
  for (const pattern of formalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 60) {
        companyNameFormal = candidate;
        break;
      }
    }
  }

  // 通称・店舗名 (クリニック、医院、整体院、薬局 等で終わる文字列)
  const brandPattern =
    /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z\s]{2,20}(?:クリニック|医院|歯科|整骨院|接骨院|整体院|薬局|皮膚科|眼科|耳鼻科|内科|外科|サロン|スタジオ|ジム))/u;
  const brandMatch = text.match(brandPattern);
  if (brandMatch) {
    const candidate = brandMatch[1].trim();
    if (candidate !== companyNameFormal && candidate.length < 40) {
      companyNameBrand = candidate;
    }
  }

  let presidentName: string | null = null;
  const presidentMatch = text.match(
    /代表取締役[社長]?\s*[\s　\t]+([^\s\n（(代]{2,10})/
  );
  if (presidentMatch) {
    presidentName = presidentMatch[1].trim();
  }
  if (!presidentName) {
    const altMatch = text.match(
      /(?:代表者|院長|オーナー|理事長)[：:\s\t]+([^\s\n（(]{2,10})/
    );
    if (altMatch) {
      const name = altMatch[1].trim();
      if (
        name.length >= 2 &&
        !name.includes("http") &&
        !name.includes("を見る")
      ) {
        presidentName = name;
      }
    }
  }

  return {
    companyNameFormal,
    companyNameBrand,
    presidentName,
    phones,
  };
}

function extractAllPhones(text: string): string[] {
  const normalized = text
    .replace(/T\s+E\s+L/g, "TEL")
    .replace(/F\s+A\s+X/g, "FAX");

  const out: string[] = [];
  const patterns = [
    /(?:TEL|Tel|tel|電話|☎|お電話)[.：:\s\t\n]*([0-9０-９]{2,4}[-ー－][0-9０-９]{2,4}[-ー－][0-9０-９]{3,4})/g,
    /(0120[-ー－][0-9０-９]{2,4}[-ー－][0-9０-９]{2,4})/g,
    /(0800[-ー－][0-9０-９]{3,4}[-ー－][0-9０-９]{4})/g,
    /(0[0-9]{1,3}[-ー－][0-9]{2,4}[-ー－][0-9]{3,4})/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      out.push(normalizePhone(match[1] || match[0]));
    }
  }
  return uniquePhones(out);
}
