/**
 * 電話番号の分類と優先度付け。
 * テレアポ用途として「市外局番の固定電話」が最も価値が高いという前提で
 * 優先度を付ける (ただしユーザー要望により出力は携帯を1番、固定2番)。
 */

export type PhoneCategory =
  | "mobile" // 070/080/090
  | "landline" // 市外局番 (03, 06, 092 等)
  | "ip" // 050
  | "freedial" // 0120/0800
  | "unknown";

/** 電話番号の種別を判定 */
export function classifyPhone(phone: string): PhoneCategory {
  const digits = phone.replace(/[^0-9]/g, "");
  if (/^(0120|0800)/.test(digits)) return "freedial";
  if (/^(070|080|090)/.test(digits)) return "mobile";
  if (/^050/.test(digits)) return "ip";
  if (/^0[1-9]/.test(digits) && digits.length >= 9) return "landline";
  return "unknown";
}

/** 出力カラム上の優先度 (小さいほど TEL1 寄り) */
const OUTPUT_PRIORITY: Record<PhoneCategory, number> = {
  mobile: 1, // ユーザー指定で最優先
  landline: 2, // ユーザー指定で2番目
  ip: 3,
  freedial: 4,
  unknown: 5,
};

/** 出力優先度順にソート (携帯 → 市外局番 → IP → フリーダイヤル → unknown) */
export function sortPhones(phones: string[]): string[] {
  return [...phones].sort(
    (a, b) =>
      OUTPUT_PRIORITY[classifyPhone(a)] - OUTPUT_PRIORITY[classifyPhone(b)]
  );
}

/** 重複を排除 (ハイフンや全角スペース等の表記ゆれを正規化) */
export function uniquePhones(phones: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of phones) {
    const norm = normalizePhone(raw);
    if (!norm) continue;
    const key = norm.replace(/[^0-9]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(norm);
  }
  return out;
}

/** 表記揺れを正規化 (全角→半角、ー→-) */
export function normalizePhone(raw: string): string {
  return raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー－―]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

/** 市外局番の固定電話があるか (深掘り停止条件) */
export function hasLandline(phones: string[]): boolean {
  return phones.some((p) => classifyPhone(p) === "landline");
}
