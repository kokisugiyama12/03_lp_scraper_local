export interface ContactInfo {
  phoneNumber: string | null;
  presidentName: string | null;
  companyName: string | null;
  allPhoneNumbers?: string[];
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
