export interface ContactInfo {
  /** 法人格を含む正式名称 (例: 医療法人社団○○、株式会社サンプル)。なければ null */
  companyNameFormal: string | null;
  /** 通称・店舗名 (例: ○○クリニック)。formal と同一なら null */
  companyNameBrand: string | null;
  presidentName: string | null;
  /** 全ての電話番号 (重複なし、優先度順ソート前のフラットリスト) */
  phones: string[];
}

export interface AdResult {
  headline: string;
  description: string;
  url: string;
  displayUrl: string;
}

export interface JobEvent {
  type:
    | "query_start"
    | "query_complete"
    | "result_found"
    | "extraction_failed"
    | "job_complete"
    | "job_failed";
  data: Record<string, unknown>;
}
