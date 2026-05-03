export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type QueryStatus = "pending" | "running" | "completed" | "failed";
export type ExtractionStatus = "pending" | "success" | "partial" | "failed";

export interface SearchJob {
  id: string;
  keyword: string;
  locationsJson: string;
  spreadsheetId: string | null;
  status: JobStatus;
  totalQueries: number;
  completedQueries: number;
  totalResults: number;
  errorMessage: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchQuery {
  id: number;
  jobId: string;
  locationName: string;
  searchQuery: string;
  status: QueryStatus;
  adsFound: number;
  completedAt: string | null;
}

export interface SearchResult {
  id: number;
  jobId: string;
  queryId: number;
  adUrl: string;
  landingUrl: string | null;
  companyName: string | null;
  phoneNumber: string | null;
  presidentName: string | null;
  adHeadline: string | null;
  locationName: string;
  extractionStatus: ExtractionStatus;
  rawPageText: string | null;
  createdAt: string;
}
