import json
import os
import anthropic
from dotenv import load_dotenv
from models.schemas import AnalyzeResponse, BrainRegion, BrainNetwork, Recommendation

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ---------------------------------------------------------------------------
# SYSTEM_PROMPT — used for text-only analysis (Claude estimates all scores)
# ---------------------------------------------------------------------------
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

For recommendations: provide 3-5 specific, actionable recommendations ranked by priority (High/Medium/Low). Each recommendation must:
- Target a specific underperforming brain region (score < 70)
- Give a concrete, specific action the creator can take (not vague advice)
- Explain the neuroscience reason in plain English
- Give a real-world example of how to implement it

Example of a good recommendation:
{
  "priority": "High",
  "region": "Amygdala",
  "action": "Add urgency in the first 5 seconds",
  "reason": "The amygdala — your brain's alarm system — isn't firing, meaning viewers feel no urgency to act. Without this, conversion rates drop significantly.",
  "example": "Open with 'Only 3 spots left' or show a countdown timer, or start with a surprising statistic that creates immediate tension."
}

Bad recommendations say things like "improve your visuals" — good ones say exactly what to add, change, or remove.

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
  ],
  "recommendations": [
    {
      "priority": "High",
      "region": "Amygdala",
      "action": "Add urgency in the first 5 seconds",
      "reason": "The amygdala isn't firing — viewers feel no urgency to act.",
      "example": "Open with a surprising stat, countdown timer, or scarcity signal."
    }
  ]
}"""

# ---------------------------------------------------------------------------
# TRIBE_ENRICHMENT_SYSTEM_PROMPT — used when TRIBE v2 scores are available.
# Claude writes descriptions + Amygdala score. It CANNOT change the 6 TRIBE scores.
# ---------------------------------------------------------------------------
TRIBE_ENRICHMENT_SYSTEM_PROMPT = """You are a neuroscience and marketing expert interpreting real fMRI brain activation data for marketers and content creators.

You have been given REAL brain activation scores for 6 regions, measured by Meta's TRIBE v2 fMRI model from actual video analysis. These scores are scientific measurements — do NOT change them.

Your job:
1. Write a description for each of the 6 TRIBE-measured regions using this pattern:
   "When viewers watch this, [what happens in plain terms] — meaning [what the viewer feels], [so what this means for the campaign]." Never use the region name in the description.
2. Estimate a score (0-100) for Amygdala based on the transcript/content (it is subcortical and not measured by TRIBE v2).
3. Write all descriptions, summaries, what_works, what_doesnt_work, recommendations — informed by the real scores.

Emotion mappings (use these exact labels):
- FFA → emotion: "Trust & Relatability"
- PPA → emotion: "Immersion & Context"
- Broca's Area → emotion: "Clarity & Recall"
- TPJ → emotion: "Empathy & Desire"
- Auditory Cortex → emotion: "Mood & Atmosphere"
- Visual Cortex → emotion: "Attention & Impact"
- Amygdala → emotion: "Urgency & Action"

For what_works: list 3-5 specific, concrete things the content does neurologically well. Each item should be one sentence starting with a strong verb.

For what_doesnt_work: list 3-5 specific weaknesses. Each item should be one sentence explaining the problem and its marketing consequence.

For content_summary: write exactly 2 short sentences describing what this content is about in plain English. No marketing jargon.

For recommendations: provide 3-5 specific, actionable recommendations ranked by priority (High/Medium/Low). Each must target a specific underperforming region (score < 70), give a concrete action, explain the neuroscience in plain English, and give a real-world example.

CRITICAL: The scores for FFA, PPA, Visual Cortex, Auditory Cortex, Broca's Area, and TPJ in your JSON response MUST exactly match the provided TRIBE v2 scores. Do not alter them.

Return ONLY valid JSON in this exact format:
{
  "regions": [
    {"name": "FFA", "score": <TRIBE_SCORE>, "emotion": "Trust & Relatability", "description": "When viewers watch this...", "marketing_label": "People & Faces", "source": "tribe_v2"},
    {"name": "PPA", "score": <TRIBE_SCORE>, "emotion": "Immersion & Context", "description": "...", "marketing_label": "Places & Scenes", "source": "tribe_v2"},
    {"name": "Broca's Area", "score": <TRIBE_SCORE>, "emotion": "Clarity & Recall", "description": "...", "marketing_label": "Language Processing", "source": "tribe_v2"},
    {"name": "TPJ", "score": <TRIBE_SCORE>, "emotion": "Empathy & Desire", "description": "...", "marketing_label": "Emotional Response", "source": "tribe_v2"},
    {"name": "Auditory Cortex", "score": <TRIBE_SCORE>, "emotion": "Mood & Atmosphere", "description": "...", "marketing_label": "Sound & Music", "source": "tribe_v2"},
    {"name": "Visual Cortex", "score": <TRIBE_SCORE>, "emotion": "Attention & Impact", "description": "...", "marketing_label": "Visual Impact", "source": "tribe_v2"},
    {"name": "Amygdala", "score": <YOUR_ESTIMATE>, "emotion": "Urgency & Action", "description": "...", "marketing_label": "Intensity & Urgency", "source": "claude"}
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
  "what_works": ["Builds instant trust through...", "..."],
  "what_doesnt_work": ["Lacks urgency triggers — ...", "..."],
  "recommendations": [
    {
      "priority": "High",
      "region": "Amygdala",
      "action": "Add urgency in the first 5 seconds",
      "reason": "The amygdala isn't firing — viewers feel no urgency to act.",
      "example": "Open with a surprising stat, countdown timer, or scarcity signal."
    }
  ]
}"""


def _parse_response(response_text: str) -> dict:
    start = response_text.find('{')
    end = response_text.rfind('}') + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON found in response: {response_text[:200]}")
    return json.loads(response_text[start:end])


def _build_response(data: dict, default_source: str = "claude") -> AnalyzeResponse:
    regions = []
    for r in data["regions"]:
        region_data = dict(r)
        if "source" not in region_data:
            region_data["source"] = default_source
        regions.append(BrainRegion(**region_data))

    networks = [BrainNetwork(**n) for n in data["networks"]]
    recommendations = [Recommendation(**r) for r in data.get("recommendations", [])]

    return AnalyzeResponse(
        regions=regions,
        networks=networks,
        summary=data["summary"],
        engagement_score=data["engagement_score"],
        content_summary=data["content_summary"],
        what_works=data["what_works"],
        what_doesnt_work=data["what_doesnt_work"],
        recommendations=recommendations,
    )


async def analyze_with_claude(content: str) -> AnalyzeResponse:
    """Text-only path — Claude estimates all 7 region scores."""
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Analyze this content for brain activation:\n\n{content}"}
        ]
    )
    data = _parse_response(message.content[0].text)
    return _build_response(data, default_source="claude")


async def enrich_with_tribe_scores(
    transcript: str,
    tribe_scores: dict[str, int],
    video_title: str = "",
) -> AnalyzeResponse:
    """
    Video path — 6 region scores come from TRIBE v2 (real fMRI predictions).
    Claude writes descriptions, estimates Amygdala, and generates all
    narrative fields. Claude cannot override the 6 TRIBE scores.
    """
    scores_block = "\n".join(
        f"- {region}: {score}/100" for region, score in tribe_scores.items()
    )

    content_block = ""
    if video_title:
        content_block += f"Video title: {video_title}\n\n"
    if transcript:
        content_block += f"Transcript:\n{transcript}"
    else:
        content_block = "No transcript available — use the scores and video title to infer context."

    user_message = f"""I have real fMRI brain activation scores from TRIBE v2 for this video:

{scores_block}

Content:
{content_block}

Using these EXACT scores (do not change them), write descriptions for each of the 6 TRIBE-measured regions, estimate the Amygdala score from the content, and generate all other fields as specified."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=TRIBE_ENRICHMENT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}]
    )

    data = _parse_response(message.content[0].text)

    # Enforce TRIBE scores — Claude must not drift from them
    for region in data.get("regions", []):
        name = region.get("name")
        if name in tribe_scores:
            region["score"] = tribe_scores[name]
            region["source"] = "tribe_v2"
        elif name == "Amygdala":
            region["source"] = "claude"

    return _build_response(data)
