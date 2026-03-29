from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.youtube import extract_youtube_content
from services.claude_analyzer import analyze_with_claude

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        if request.input_type == "youtube":
            content = await extract_youtube_content(request.content)
        else:
            content = request.content

        result = await analyze_with_claude(content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
