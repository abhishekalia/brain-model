"""
Brain Trigger — Video Upload Endpoint (Async Job Queue)

Flow:
  POST /analyze-video        → upload file, start background job, return {job_id}
  GET  /analyze-video/{id}   → poll status: {status: "pending|done|error", result?, error?}

This avoids Railway's ~60s proxy timeout for long-running TRIBE v2 analysis.
"""

import os
import base64
import uuid
import asyncio
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
from models.schemas import AnalyzeResponse
from services.claude_analyzer import enrich_with_tribe_scores

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB
TRIBE_ENDPOINT = os.getenv("TRIBE_ENDPOINT_URL")
TRIBE_API_KEY = os.getenv("TRIBE_API_KEY", "")

# In-memory job store — fine for single-instance Railway deployment
# Jobs expire naturally when Railway restarts
jobs: dict[str, dict] = {}

# Limit concurrent Modal calls to 1 — prevents 429 rate limiting
# A/B jobs queue up and run sequentially
_tribe_semaphore = asyncio.Semaphore(1)


async def _run_tribe_job(job_id: str, video_bytes: bytes, filename: str):
    """Background task — runs TRIBE v2 and stores result in jobs dict."""
    try:
        video_b64 = base64.b64encode(video_bytes).decode("utf-8")

        # Acquire semaphore — only one Modal call at a time to avoid 429
        async with _tribe_semaphore:
            print(f"[analyze_video] Starting Modal call for job {job_id}")
            async with httpx.AsyncClient(timeout=1200, follow_redirects=True) as client:
                resp = await client.post(
                    TRIBE_ENDPOINT,
                    json={
                        "video_b64": video_b64,
                        "title": filename,
                        "api_key": TRIBE_API_KEY,
                    },
                )
                resp.raise_for_status()
                tribe_result = resp.json()
            print(f"[analyze_video] Modal call complete for job {job_id}")

        result = await enrich_with_tribe_scores(
            transcript=tribe_result.get("transcript", ""),
            tribe_scores=tribe_result["tribe_scores"],
            video_title=filename,
        )
        jobs[job_id] = {"status": "done", "result": result.dict()}

    except Exception as e:
        jobs[job_id] = {"status": "error", "error": str(e)}


@router.post("/analyze-video")
async def start_video_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload video → returns {job_id} immediately. Poll /analyze-video/{job_id} for results."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Use mp4, mov, avi, mkv, or webm."
        )

    video_bytes = await file.read()

    if len(video_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 200MB.")

    if not TRIBE_ENDPOINT:
        raise HTTPException(
            status_code=503,
            detail="TRIBE_ENDPOINT_URL not configured."
        )

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending"}

    background_tasks.add_task(_run_tribe_job, job_id, video_bytes, file.filename or "")

    return {"job_id": job_id}


@router.get("/analyze-video/{job_id}")
async def get_video_analysis(job_id: str):
    """
    Poll for job status.
    Returns:
      {status: "pending"}              — still running
      {status: "done", result: {...}}  — complete, result is AnalyzeResponse
      {status: "error", error: "..."}  — failed
    """
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job
