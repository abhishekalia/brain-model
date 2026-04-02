"""
Brain Trigger — Video Upload Endpoint
Accepts a direct video file upload, runs TRIBE v2 inference via Modal,
enriches with Claude, returns AnalyzeResponse.
"""

import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import AnalyzeResponse
from services.claude_analyzer import enrich_with_tribe_scores, analyze_with_claude

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


@router.post("/analyze-video", response_model=AnalyzeResponse)
async def analyze_video(file: UploadFile = File(...)):
    # Validate file type
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Use mp4, mov, avi, mkv, or webm."
        )

    try:
        video_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    if len(video_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 500MB.")

    try:
        # Call Modal TRIBE v2 worker with raw video bytes
        import modal
        analyze_video_file = modal.Function.from_name(
            "brain-trigger-tribe-worker",
            "analyze_video_file",
        )

        import asyncio
        loop = asyncio.get_event_loop()
        tribe_result = await loop.run_in_executor(
            None,
            lambda: analyze_video_file.remote(
                video_bytes=video_bytes,
                title=file.filename or "",
            ),
        )

        result = await enrich_with_tribe_scores(
            transcript=tribe_result.get("transcript", ""),
            tribe_scores=tribe_result["tribe_scores"],
            video_title=file.filename or "",
        )
        return result

    except Exception as e:
        error_msg = str(e)
        # If Modal isn't available, fall back to Claude with no content
        if "not found" in error_msg.lower() or "modal" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="TRIBE v2 worker unavailable. Deploy the Modal worker first."
            )
        raise HTTPException(status_code=500, detail=error_msg)
