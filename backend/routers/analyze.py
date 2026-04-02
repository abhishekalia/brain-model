from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.youtube import extract_youtube_content
from services.claude_analyzer import analyze_with_claude, enrich_with_tribe_scores
from services.tribe_service import get_tribe_scores, is_tribe_available

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        if request.input_type == "youtube":
            if is_tribe_available():
                # TRIBE v2 path — real fMRI scores for 6 regions
                tribe_result = await get_tribe_scores(request.content)
                result = await enrich_with_tribe_scores(
                    transcript=tribe_result.get("transcript", ""),
                    tribe_scores=tribe_result["tribe_scores"],
                    video_title=tribe_result.get("video_title", ""),
                )
            else:
                # Fallback — TRIBE worker not deployed, use Claude only
                content = await extract_youtube_content(request.content)
                result = await analyze_with_claude(content)
        else:
            # Text input — Claude only
            result = await analyze_with_claude(request.content)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
