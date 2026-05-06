export interface Prefecture {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /**
   * Google検索の `uule` URL パラメータ用の Canonical Name。
   * Google AdWords の geo-targets 形式 (例: "Tokyo,Japan", "Sapporo,Hokkaido,Japan")。
   * 都道府県は "<Pref>,Japan"、政令指定都市は "<City>,<Pref>,Japan"。
   */
  canonicalName: string;
  isCity?: boolean;
}

export interface PrefectureGroup {
  region: string;
  prefectures: Prefecture[];
}

export const PREFECTURE_GROUPS: PrefectureGroup[] = [
  {
    region: "北海道・東北",
    prefectures: [
      { id: "hokkaido", name: "北海道", lat: 43.0646, lng: 141.3468, canonicalName: "Hokkaido,Japan" },
      { id: "sapporo", name: "札幌市", lat: 43.0618, lng: 141.3545, isCity: true, canonicalName: "Sapporo,Hokkaido,Japan" },
      { id: "aomori", name: "青森県", lat: 40.8244, lng: 140.7400, canonicalName: "Aomori,Japan" },
      { id: "iwate", name: "岩手県", lat: 39.7036, lng: 141.1527, canonicalName: "Iwate,Japan" },
      { id: "miyagi", name: "宮城県", lat: 38.2688, lng: 140.8721, canonicalName: "Miyagi,Japan" },
      { id: "sendai", name: "仙台市", lat: 38.2682, lng: 140.8694, isCity: true, canonicalName: "Sendai,Miyagi,Japan" },
      { id: "akita", name: "秋田県", lat: 39.7186, lng: 140.1024, canonicalName: "Akita,Japan" },
      { id: "yamagata", name: "山形県", lat: 38.2405, lng: 140.3634, canonicalName: "Yamagata,Japan" },
      { id: "fukushima", name: "福島県", lat: 37.7503, lng: 140.4676, canonicalName: "Fukushima,Japan" },
    ],
  },
  {
    region: "関東",
    prefectures: [
      { id: "ibaraki", name: "茨城県", lat: 36.3418, lng: 140.4468, canonicalName: "Ibaraki,Japan" },
      { id: "tochigi", name: "栃木県", lat: 36.5658, lng: 139.8836, canonicalName: "Tochigi,Japan" },
      { id: "gunma", name: "群馬県", lat: 36.3912, lng: 139.0608, canonicalName: "Gunma,Japan" },
      { id: "saitama", name: "埼玉県", lat: 35.8569, lng: 139.6489, canonicalName: "Saitama,Japan" },
      { id: "saitama-city", name: "さいたま市", lat: 35.8617, lng: 139.6455, isCity: true, canonicalName: "Saitama,Saitama,Japan" },
      { id: "chiba", name: "千葉県", lat: 35.6047, lng: 140.1233, canonicalName: "Chiba,Japan" },
      { id: "chiba-city", name: "千葉市", lat: 35.6047, lng: 140.1233, isCity: true, canonicalName: "Chiba,Chiba,Japan" },
      { id: "tokyo", name: "東京都", lat: 35.6762, lng: 139.6503, canonicalName: "Tokyo,Japan" },
      { id: "kanagawa", name: "神奈川県", lat: 35.4478, lng: 139.6425, canonicalName: "Kanagawa,Japan" },
      { id: "yokohama", name: "横浜市", lat: 35.4437, lng: 139.6380, isCity: true, canonicalName: "Yokohama,Kanagawa,Japan" },
      { id: "kawasaki", name: "川崎市", lat: 35.5309, lng: 139.7030, isCity: true, canonicalName: "Kawasaki,Kanagawa,Japan" },
      { id: "sagamihara", name: "相模原市", lat: 35.5714, lng: 139.3735, isCity: true, canonicalName: "Sagamihara,Kanagawa,Japan" },
    ],
  },
  {
    region: "中部",
    prefectures: [
      { id: "niigata", name: "新潟県", lat: 37.9026, lng: 139.0236, canonicalName: "Niigata,Japan" },
      { id: "niigata-city", name: "新潟市", lat: 37.9162, lng: 139.0364, isCity: true, canonicalName: "Niigata,Niigata,Japan" },
      { id: "toyama", name: "富山県", lat: 36.6953, lng: 137.2113, canonicalName: "Toyama,Japan" },
      { id: "ishikawa", name: "石川県", lat: 36.5946, lng: 136.6256, canonicalName: "Ishikawa,Japan" },
      { id: "fukui", name: "福井県", lat: 36.0652, lng: 136.2217, canonicalName: "Fukui,Japan" },
      { id: "yamanashi", name: "山梨県", lat: 35.6642, lng: 138.5684, canonicalName: "Yamanashi,Japan" },
      { id: "nagano", name: "長野県", lat: 36.2321, lng: 138.1810, canonicalName: "Nagano,Japan" },
      { id: "gifu", name: "岐阜県", lat: 35.3912, lng: 136.7223, canonicalName: "Gifu,Japan" },
      { id: "shizuoka", name: "静岡県", lat: 34.9769, lng: 138.3831, canonicalName: "Shizuoka,Japan" },
      { id: "shizuoka-city", name: "静岡市", lat: 34.9756, lng: 138.3827, isCity: true, canonicalName: "Shizuoka,Shizuoka,Japan" },
      { id: "hamamatsu", name: "浜松市", lat: 34.7108, lng: 137.7261, isCity: true, canonicalName: "Hamamatsu,Shizuoka,Japan" },
      { id: "aichi", name: "愛知県", lat: 35.1802, lng: 136.9066, canonicalName: "Aichi,Japan" },
      { id: "nagoya", name: "名古屋市", lat: 35.1815, lng: 136.9066, isCity: true, canonicalName: "Nagoya,Aichi,Japan" },
    ],
  },
  {
    region: "近畿",
    prefectures: [
      { id: "mie", name: "三重県", lat: 34.7303, lng: 136.5086, canonicalName: "Mie,Japan" },
      { id: "shiga", name: "滋賀県", lat: 35.0045, lng: 135.8686, canonicalName: "Shiga,Japan" },
      { id: "kyoto", name: "京都府", lat: 35.0116, lng: 135.7681, canonicalName: "Kyoto,Japan" },
      { id: "kyoto-city", name: "京都市", lat: 35.0116, lng: 135.7681, isCity: true, canonicalName: "Kyoto,Kyoto,Japan" },
      { id: "osaka", name: "大阪府", lat: 34.6937, lng: 135.5023, canonicalName: "Osaka,Japan" },
      { id: "osaka-city", name: "大阪市", lat: 34.6937, lng: 135.5023, isCity: true, canonicalName: "Osaka,Osaka,Japan" },
      { id: "sakai", name: "堺市", lat: 34.5733, lng: 135.4830, isCity: true, canonicalName: "Sakai,Osaka,Japan" },
      { id: "hyogo", name: "兵庫県", lat: 34.6913, lng: 135.1830, canonicalName: "Hyogo,Japan" },
      { id: "kobe", name: "神戸市", lat: 34.6901, lng: 135.1956, isCity: true, canonicalName: "Kobe,Hyogo,Japan" },
      { id: "nara", name: "奈良県", lat: 34.6852, lng: 135.8329, canonicalName: "Nara,Japan" },
      { id: "wakayama", name: "和歌山県", lat: 34.2260, lng: 135.1675, canonicalName: "Wakayama,Japan" },
    ],
  },
  {
    region: "中国",
    prefectures: [
      { id: "tottori", name: "鳥取県", lat: 35.5039, lng: 134.2383, canonicalName: "Tottori,Japan" },
      { id: "shimane", name: "島根県", lat: 35.4723, lng: 133.0505, canonicalName: "Shimane,Japan" },
      { id: "okayama", name: "岡山県", lat: 34.6618, lng: 133.9344, canonicalName: "Okayama,Japan" },
      { id: "okayama-city", name: "岡山市", lat: 34.6618, lng: 133.9344, isCity: true, canonicalName: "Okayama,Okayama,Japan" },
      { id: "hiroshima", name: "広島県", lat: 34.3966, lng: 132.4596, canonicalName: "Hiroshima,Japan" },
      { id: "hiroshima-city", name: "広島市", lat: 34.3853, lng: 132.4553, isCity: true, canonicalName: "Hiroshima,Hiroshima,Japan" },
      { id: "yamaguchi", name: "山口県", lat: 34.1860, lng: 131.4714, canonicalName: "Yamaguchi,Japan" },
    ],
  },
  {
    region: "四国",
    prefectures: [
      { id: "tokushima", name: "徳島県", lat: 34.0658, lng: 134.5593, canonicalName: "Tokushima,Japan" },
      { id: "kagawa", name: "香川県", lat: 34.3401, lng: 134.0434, canonicalName: "Kagawa,Japan" },
      { id: "ehime", name: "愛媛県", lat: 33.8416, lng: 132.7657, canonicalName: "Ehime,Japan" },
      { id: "kochi", name: "高知県", lat: 33.5597, lng: 133.5311, canonicalName: "Kochi,Japan" },
    ],
  },
  {
    region: "九州・沖縄",
    prefectures: [
      { id: "fukuoka", name: "福岡県", lat: 33.6064, lng: 130.4183, canonicalName: "Fukuoka,Japan" },
      { id: "kitakyushu", name: "北九州市", lat: 33.8834, lng: 130.8752, isCity: true, canonicalName: "Kitakyushu,Fukuoka,Japan" },
      { id: "fukuoka-city", name: "福岡市", lat: 33.5904, lng: 130.4017, isCity: true, canonicalName: "Fukuoka,Fukuoka,Japan" },
      { id: "saga", name: "佐賀県", lat: 33.2494, lng: 130.2988, canonicalName: "Saga,Japan" },
      { id: "nagasaki", name: "長崎県", lat: 32.7448, lng: 129.8737, canonicalName: "Nagasaki,Japan" },
      { id: "kumamoto", name: "熊本県", lat: 32.7898, lng: 130.7417, canonicalName: "Kumamoto,Japan" },
      { id: "kumamoto-city", name: "熊本市", lat: 32.7898, lng: 130.7417, isCity: true, canonicalName: "Kumamoto,Kumamoto,Japan" },
      { id: "oita", name: "大分県", lat: 33.2382, lng: 131.6126, canonicalName: "Oita,Japan" },
      { id: "miyazaki", name: "宮崎県", lat: 31.9111, lng: 131.4239, canonicalName: "Miyazaki,Japan" },
      { id: "kagoshima", name: "鹿児島県", lat: 31.5602, lng: 130.5581, canonicalName: "Kagoshima,Japan" },
      { id: "okinawa", name: "沖縄県", lat: 26.2124, lng: 127.6809, canonicalName: "Okinawa,Japan" },
    ],
  },
];
