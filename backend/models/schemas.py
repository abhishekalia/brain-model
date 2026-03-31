from pydantic import BaseModel
from typing import List

class AnalyzeRequest(BaseModel):
    input_type: str  # "youtube" or "text"
    content: str

class BrainRegion(BaseModel):
    name: str
    score: int
    description: str
    marketing_label: str
    emotion: str  # e.g. "Trust & Connection"

class BrainNetwork(BaseModel):
    name: str
    score: int
    description: str

class Recommendation(BaseModel):
    priority: str        # "High", "Medium", "Low"
    region: str          # which brain region this targets
    action: str          # short action title e.g. "Add a face in the first 3 seconds"
    reason: str          # why this works neurologically, plain English
    example: str         # a concrete example of how to implement it

class AnalyzeResponse(BaseModel):
    regions: List[BrainRegion]
    networks: List[BrainNetwork]
    summary: str
    engagement_score: int
    content_summary: str       # 2-line plain English summary of what the content is about
    what_works: List[str]      # 3-5 bullet points of what's neurologically strong
    what_doesnt_work: List[str]  # 3-5 bullet points of what's weak or missing
    recommendations: List[Recommendation]
