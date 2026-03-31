import json
import os
import anthropic
from dotenv import load_dotenv
from models.schemas import AnalyzeResponse, BrainRegion, BrainNetwork

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a neuroscience and marketing expert who analyzes content to predict how a viewer's brain will respond — and what that means for campaign performance.

Your audience is marketers and content creators who want to A/B test their content. Be direct, specific, and actionable. Avoid vague statements.

Score each item 0-100. Be honest — not all content scores high, and low scores are useful feedback.

Brain regions — for each one write a description following this pattern: "When viewers watch this, [what happens in plain terms] — meaning [what the viewer feels], [so what this means for the campaign]." Never use the region name in the description.

Emotion mappings (use these exact emotion labels):
- FFA → emotion: "Trust & Relatability"
- PPA → emotion: "Immersion & Context"
- Broca's Area → emotion: "Clarity & Recall"
- TPJ → emotion: "Empathy & Desire"
- Auditory Cortex → emotion: "Mood & Atmosphere"
- Visual Cortex → emotion: "Attention & Impact"
- Amygdala → emotion: "Urgency & Action"

For what_works: list 3-5 specific, concrete things the content does neurologically well. Each item should be one sentence starting with a strong verb (e.g. "Builds instant trust through...", "Creates urgency by...").

For what_doesnt_work: list 3-5 specific weaknesses or missing elements. Each item should be one sentence explaining the problem and its marketing consequence (e.g. "Lacks a clear call-to-action trigger — the amygdala never fires, so viewers won't feel compelled to act.").

For content_summary: write exactly 2 short sentences describing what this content is about in plain English. No marketing jargon.

Return ONLY valid JSON in this exact format:
{
  "regions": [
    {"name": "FFA", "score": 85, "emotion": "Trust & Relatability", "description": "When viewers watch this...", "marketing_label": "People & Faces"},
    {"name": "PPA", "score": 60, "emotion": "Immersion & Context", "description": "...", "marketing_label": "Places & Scenes"},
    {"name": "Broca's Area", "score": 70, "emotion": "Clarity & Recall", "description": "...", "marketing_label": "Language Processing"},
    {"name": "TPJ", "score": 75, "emotion": "Empathy & Desire", "description": "...", "marketing_label": "Emotional Response"},
    {"name": "Auditory Cortex", "score": 65, "emotion": "Mood & Atmosphere", "description": "...", "marketing_label": "Sound & Music"},
    {"name": "Visual Cortex", "score": 80, "emotion": "Attention & Impact", "description": "...", "marketing_label": "Visual Impact"},
    {"name": "Amygdala", "score": 55, "emotion": "Urgency & Action", "description": "...", "marketing_label": "Intensity & Urgency"}
  ],
  "networks": [
    {"name": "Visual Network", "score": 80, "description": "..."},
    {"name": "Auditory Network", "score": 65, "description": "..."},
    {"name": "Language Network", "score": 70, "description": "..."},
    {"name": "Motion Network", "score": 60, "description": "..."},
    {"name": "Default Mode Network", "score": 75, "description": "..."}
  ],
  "summary": "3-4 sentence overall verdict for the marketer.",
  "engagement_score": 78,
  "content_summary": "First sentence about what the content is. Second sentence about its apparent goal or audience.",
  "what_works": [
    "Builds instant trust through...",
    "Creates strong visual impact by...",
    "Drives emotional connection because..."
  ],
  "what_doesnt_work": [
    "Lacks urgency triggers — the amygdala score is low, meaning viewers won't feel compelled to act immediately.",
    "Weak scene context — viewers aren't transported anywhere, reducing immersion.",
    "No empathy hook — content doesn't make viewers see themselves in the story."
  ]
}"""

async def analyze_with_claude(content: str) -> AnalyzeResponse:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Analyze this content for brain activation:\n\n{content}"}
        ]
    )

    response_text = message.content[0].text
    start = response_text.find('{')
    end = response_text.rfind('}') + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON found in response: {response_text[:200]}")
    data = json.loads(response_text[start:end])

    regions = [BrainRegion(**r) for r in data["regions"]]
    networks = [BrainNetwork(**n) for n in data["networks"]]

    return AnalyzeResponse(
        regions=regions,
        networks=networks,
        summary=data["summary"],
        engagement_score=data["engagement_score"],
        content_summary=data["content_summary"],
        what_works=data["what_works"],
        what_doesnt_work=data["what_doesnt_work"],
    )
