export interface BrainRegion {
  name: string;
  score: number;
  description: string;
  marketing_label: string;
  emotion: string;
}

export interface BrainNetwork {
  name: string;
  score: number;
  description: string;
}

export interface AnalyzeResponse {
  regions: BrainRegion[];
  networks: BrainNetwork[];
  summary: string;
  engagement_score: number;
  content_summary: string;
  what_works: string[];
  what_doesnt_work: string[];
}

export interface AnalyzeRequest {
  input_type: 'youtube' | 'text';
  content: string;
}
