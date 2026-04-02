"""
Brain Trigger — Video Upload Endpoint
Accepts a direct video file upload, sends to Modal TRIBE v2 worker via HTTP,
enriches with Claude, returns AnalyzeResponse.
"""

import os
import base64
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import AnalyzeResponse
from services.claude_analyzer import enrich_with_tribe_scores

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB
TRIBE_ENDPOINT = os.getenv("TRIBE_ENDPOINT_URL")   # Modal web endpoint URL
TRIBE_API_KEY = os.getenv("TRIBE_API_KEY", "")


@router.post("/analyze-video", response_model=AnalyzeResponse)
async def analyze_video(file: UploadFile = File(...)):
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
            detail="TRIBE_ENDPOINT_URL not set. Add the Modal web endpoint URL to Railway env vars."
        )

    try:
        # Encode video as base64 and POST to Modal web endpoint
        video_b64 = base64.b64encode(video_bytes).decode("utf-8")

        async with httpx.AsyncClient(timeout=1200, follow_redirects=True) as client:
            resp = await client.post(
                TRIBE_ENDPOINT,
                json={
                    "video_b64": video_b64,
                    "title": file.filename or "",
                    "api_key": TRIBE_API_KEY,
                },
            )
            resp.raise_for_status()
            tribe_result = resp.json()

        result = await enrich_with_tribe_scores(
            transcript=tribe_result.get("transcript", ""),
            tribe_scores=tribe_result["tribe_scores"],
            video_title=file.filename or "",
        )
        return result

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="TRIBE v2 analysis timed out. Try a shorter video.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
