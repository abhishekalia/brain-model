export interface BrainRegion {
  name: string;
  score: number;
  description: string;
  marketing_label: string;
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
}

export interface AnalyzeRequest {
  input_type: 'youtube' | 'text';
  content: string;
}
