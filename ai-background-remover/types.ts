export interface ProcessedResult {
  originalUrl: string;
  processedUrl: string | null;
  error?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
