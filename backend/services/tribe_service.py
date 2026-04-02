"""
Brain Trigger — TRIBE v2 Service Client
=========================================
Calls the Modal worker function to get TRIBE v2 brain activation scores
for a YouTube video.

The Modal Python client calls the deployed function directly — no HTTP
endpoint needed, no API key management. Modal handles auth via the
environment's MODAL_TOKEN_ID / MODAL_TOKEN_SECRET.

Returns tribe_scores for 6 regions (Amygdala excluded — subcortical).
The calling code (analyze router) passes these to enrich_with_tribe_scores()
in claude_analyzer.py for Claude to generate descriptions + Amygdala score.
"""

import os


async def get_tribe_scores(youtube_url: str) -> dict:
    """
    Call the Modal TRIBE v2 worker for a YouTube URL.

    Returns:
        {
            "tribe_scores": {
                "FFA": 82,
                "PPA": 60,
                "Visual Cortex": 74,
                "Auditory Cortex": 55,
                "Broca's Area": 68,
                "TPJ": 71,
            },
            "transcript": "...",
            "video_title": "...",
            "duration_seconds": 143,
        }

    Raises:
        RuntimeError if Modal is not configured or worker call fails.
    """
    try:
        import modal
    except ImportError:
        raise RuntimeError(
            "modal package not installed — run: pip install modal"
        )

    try:
        analyze_video = modal.Function.lookup(
            "brain-trigger-tribe-worker",
            "analyze_video",
        )
    except Exception as e:
        raise RuntimeError(
            f"Could not find Modal function 'analyze_video' — "
            f"is the worker deployed? (modal deploy tribe_worker/modal_app.py)\n{e}"
        )

    # Modal .remote() is synchronous — wrap in thread pool to keep FastAPI async
    import asyncio
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: analyze_video.remote(youtube_url=youtube_url),
    )

    return result


def is_tribe_available() -> bool:
    """Check if Modal worker is reachable. Used for graceful fallback."""
    try:
        import modal
        modal.Function.lookup("brain-trigger-tribe-worker", "analyze_video")
        return True
    except Exception:
        return False
