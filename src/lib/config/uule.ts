/**
 * Google検索の `uule` URL パラメータを生成する。
 * `uule` は Google Search が公式に位置スプーフィングのために使うパラメータ。
 * X-Geo HTTP ヘッダーは現在では無視されることが多いため、URLパラメータで指定する方が確実。
 *
 * 形式: w+CAIQICI{LengthChar}{Base64(canonical_name)}
 *   - LengthChar は base64アルファベット (A-Za-z0-9+/) のN番目の文字
 *   - canonical_name は "Tokyo,Japan" などの英語の地名 (Google AdWords geo-target 形式)
 *
 * 例:
 *   makeUule("Tokyo,Japan")     → "w+CAIQICILVG9reW8sSmFwYW4"
 *   makeUule("Hokkaido,Japan")  → "w+CAIQICIOSG9ra2FpZG8sSmFwYW4"
 *
 * canonical_name が 64文字を超える場合は対応していない (今回扱う日本の地名は全て64字以内)。
 */
const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function makeUule(canonicalName: string): string {
  const buf = Buffer.from(canonicalName, "utf-8");
  const length = buf.length;
  if (length > 63) {
    throw new Error(
      `canonical name too long for short-form uule: ${canonicalName} (${length} bytes)`
    );
  }
  const lenChar = BASE64_ALPHABET[length];
  const b64 = buf.toString("base64").replace(/=+$/, "");
  return `w+CAIQICI${lenChar}${b64}`;
}

/**
 * @deprecated X-Geo ヘッダーは Google Search に無視されることが多いため、`makeUule` を使うこと
 */
export function formatXGeoHeader(lat: number, lng: number): string {
  return `a gl:${lat},${lng} t:ul`;
}
