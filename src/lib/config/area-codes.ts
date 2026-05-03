// 市外局番 → 都道府県IDマッピング
// 主要な市外局番のみ（完全網羅ではないが実用上十分）
const AREA_CODE_MAP: Record<string, string[]> = {
  // 北海道
  "011": ["hokkaido", "sapporo"],
  "012": ["hokkaido"],
  "013": ["hokkaido"],
  "014": ["hokkaido"],
  "015": ["hokkaido"],
  "016": ["hokkaido"],
  "017": ["aomori"],
  // 東北
  "018": ["akita"],
  "019": ["iwate"],
  "022": ["miyagi", "sendai"],
  "023": ["yamagata"],
  "024": ["fukushima"],
  "025": ["niigata", "niigata-city"],
  // 関東
  "026": ["nagano"],
  "027": ["gunma"],
  "028": ["tochigi"],
  "029": ["ibaraki"],
  "03": ["tokyo"],
  "042": ["tokyo"],
  "043": ["chiba", "chiba-city"],
  "044": ["kanagawa", "kawasaki"],
  "045": ["kanagawa", "yokohama"],
  "046": ["kanagawa", "sagamihara"],
  "047": ["chiba"],
  "048": ["saitama", "saitama-city"],
  "049": ["saitama"],
  // 中部
  "052": ["aichi", "nagoya"],
  "053": ["shizuoka", "hamamatsu"],
  "054": ["shizuoka", "shizuoka-city"],
  "055": ["yamanashi", "shizuoka"],
  "058": ["gifu"],
  "059": ["mie"],
  // 北陸
  "076": ["ishikawa", "toyama"],
  "0762": ["ishikawa"],
  "0763": ["toyama"],
  "0764": ["toyama"],
  "0766": ["toyama"],
  "0767": ["ishikawa"],
  "077": ["shiga"],
  "0776": ["fukui"],
  "0778": ["fukui"],
  // 近畿
  "06": ["osaka", "osaka-city"],
  "072": ["osaka", "sakai"],
  "073": ["wakayama"],
  "074": ["nara"],
  "075": ["kyoto", "kyoto-city"],
  "078": ["hyogo", "kobe"],
  "079": ["hyogo"],
  // 中国
  "082": ["hiroshima", "hiroshima-city"],
  "083": ["yamaguchi"],
  "084": ["hiroshima"],
  "085": ["shimane"],
  "086": ["okayama", "okayama-city"],
  "0857": ["tottori"],
  "0858": ["tottori"],
  // 四国
  "087": ["kagawa"],
  "088": ["tokushima", "kochi"],
  "0886": ["tokushima"],
  "0887": ["kochi"],
  "0888": ["kochi"],
  "089": ["ehime"],
  // 九州
  "092": ["fukuoka", "fukuoka-city"],
  "093": ["fukuoka", "kitakyushu"],
  "094": ["fukuoka"],
  "095": ["nagasaki"],
  "096": ["kumamoto", "kumamoto-city"],
  "097": ["oita"],
  "098": ["okinawa"],
  "0982": ["miyazaki"],
  "0983": ["miyazaki"],
  "0984": ["miyazaki"],
  "0985": ["miyazaki"],
  "0986": ["miyazaki"],
  "099": ["kagoshima"],
  "0952": ["saga"],
  "0954": ["saga"],
  "0955": ["saga"],
};

export function getAreaCodePrefectures(phoneNumber: string): string[] {
  const digits = phoneNumber.replace(/[-ー－\s]/g, "");

  // 長い局番から順にマッチ（4桁→3桁→2桁）
  for (const len of [4, 3, 2]) {
    const prefix = digits.slice(0, len);
    if (AREA_CODE_MAP[prefix]) {
      return AREA_CODE_MAP[prefix];
    }
  }
  return [];
}

export function phoneMatchesLocation(phoneNumber: string, locationId: string): boolean {
  const prefectures = getAreaCodePrefectures(phoneNumber);
  if (prefectures.length === 0) return true; // 不明な局番は除外しない
  return prefectures.includes(locationId);
}

export function isTollFree(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/[-ー－\s]/g, "");
  return digits.startsWith("0120") || digits.startsWith("0800");
}

export function getLocationIdFromName(locationName: string): string | null {
  const nameToId: Record<string, string> = {
    "北海道": "hokkaido", "札幌市": "sapporo",
    "青森県": "aomori", "岩手県": "iwate", "宮城県": "miyagi", "仙台市": "sendai",
    "秋田県": "akita", "山形県": "yamagata", "福島県": "fukushima",
    "茨城県": "ibaraki", "栃木県": "tochigi", "群馬県": "gunma",
    "埼玉県": "saitama", "さいたま市": "saitama-city",
    "千葉県": "chiba", "千葉市": "chiba-city",
    "東京都": "tokyo", "東京": "tokyo",
    "神奈川県": "kanagawa", "横浜市": "yokohama", "川崎市": "kawasaki", "相模原市": "sagamihara",
    "新潟県": "niigata", "新潟市": "niigata-city",
    "富山県": "toyama", "石川県": "ishikawa", "福井県": "fukui",
    "山梨県": "yamanashi", "長野県": "nagano", "岐阜県": "gifu",
    "静岡県": "shizuoka", "静岡市": "shizuoka-city", "浜松市": "hamamatsu",
    "愛知県": "aichi", "名古屋市": "nagoya",
    "三重県": "mie", "滋賀県": "shiga",
    "京都府": "kyoto", "京都市": "kyoto-city",
    "大阪府": "osaka", "大阪市": "osaka-city", "堺市": "sakai",
    "兵庫県": "hyogo", "神戸市": "kobe",
    "奈良県": "nara", "和歌山県": "wakayama",
    "鳥取県": "tottori", "島根県": "shimane",
    "岡山県": "okayama", "岡山市": "okayama-city",
    "広島県": "hiroshima", "広島市": "hiroshima-city", "山口県": "yamaguchi",
    "徳島県": "tokushima", "香川県": "kagawa", "愛媛県": "ehime", "高知県": "kochi",
    "福岡県": "fukuoka", "福岡市": "fukuoka-city", "北九州市": "kitakyushu",
    "佐賀県": "saga", "長崎県": "nagasaki",
    "熊本県": "kumamoto", "熊本市": "kumamoto-city",
    "大分県": "oita", "宮崎県": "miyazaki", "鹿児島県": "kagoshima", "沖縄県": "okinawa",
  };
  return nameToId[locationName] || null;
}
