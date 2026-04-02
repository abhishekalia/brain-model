import { AnalyzeRequest, AnalyzeResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function analyzeContent(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
}

export async function analyzeVideoFile(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Start job
  const startRes = await fetch(`${API_URL}/api/analyze-video`, {
    method: 'POST',
    body: formData,
  });
  if (!startRes.ok) {
    const error = await startRes.json();
    throw new Error(error.detail || 'Failed to start video analysis');
  }
  const { job_id } = await startRes.json();

  // Poll every 5s until done
  const POLL_INTERVAL = 5000;
  const MAX_WAIT = 15 * 60 * 1000; // 15 min max
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const pollRes = await fetch(`${API_URL}/api/analyze-video/${job_id}`);
    if (!pollRes.ok) throw new Error('Failed to poll job status');
    const job = await pollRes.json();

    if (job.status === 'done') return job.result as AnalyzeResponse;
    if (job.status === 'error') throw new Error(job.error || 'Video analysis failed');

    // Still pending
    const elapsed = Math.round((Date.now() - start) / 1000);
    onProgress?.(`Analyzing with TRIBE v2... ${elapsed}s`);
  }

  throw new Error('Analysis timed out. Try a shorter video.');
}
