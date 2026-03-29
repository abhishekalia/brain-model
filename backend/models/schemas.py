from pydantic import BaseModel
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    input_type: str  # "youtube" or "text"
    content: str

class BrainRegion(BaseModel):
    name: str
    score: int
    description: str
    marketing_label: str

class BrainNetwork(BaseModel):
    name: str
    score: int
    description: str

class AnalyzeResponse(BaseModel):
    regions: List[BrainRegion]
    networks: List[BrainNetwork]
    summary: str
    engagement_score: int
