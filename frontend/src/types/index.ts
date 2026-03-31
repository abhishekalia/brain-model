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

export interface Recommendation {
  priority: 'High' | 'Medium' | 'Low';
  region: string;
  action: string;
  reason: string;
  example: string;
}

export interface AnalyzeResponse {
  regions: BrainRegion[];
  networks: BrainNetwork[];
  summary: string;
  engagement_score: number;
  content_summary: string;
  what_works: string[];
  what_doesnt_work: string[];
  recommendations: Recommendation[];
}

export interface AnalyzeRequest {
  input_type: 'youtube' | 'text';
  content: string;
}
