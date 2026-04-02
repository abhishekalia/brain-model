# TRIBE v2 Integration Plan
> Brain Trigger — replacing Claude-estimated scores with real fMRI predictions for video content

---

## Overview

**Goal:** When a user submits a YouTube URL, use Meta's TRIBE v2 model to generate real brain activation scores across 6 of 7 regions. Claude still handles text-only analysis and generates all descriptions, summaries, and recommendations (enriched with real scores for video).

**Amygdala exception:** TRIBE v2 outputs only the cortical surface (20,484 fsaverage5 vertices). Amygdala is subcortical and not in the output. For video analysis, Amygdala score is estimated by Claude from the transcript. This is disclosed in the UI.

---

## Architecture

```
TEXT INPUT
    └─► claude_analyzer.analyze_with_claude()
            └─► Full Claude analysis (scores + descriptions + everything)
                                                        ─► AnalyzeResponse

YOUTUBE INPUT
    └─► tribe_service.analyze_video(youtube_url)
            └─► [RunPod GPU Worker]
                    ├─ yt-dlp downloads video
                    ├─ TRIBE v2 inference → (n_timesteps, 20484) cortical activations
                    ├─ summarize_by_roi() → HCP region scores
                    ├─ Map HCP → Brain Trigger regions (6 regions)
                    └─ Return { FFA: 82, PPA: 60, ... }  (0-100 normalized)
            └─► claude_analyzer.enrich_with_tribe_scores(transcript, tribe_scores)
                    └─► Claude generates descriptions, Amygdala score, summaries,
                        what_works, what_doesnt_work, recommendations
                        (scores for 6 regions are FIXED from TRIBE, not estimated)
                                                        ─► AnalyzeResponse
```

---

## Part 1: RunPod GPU Worker

**New directory:** `tribe_worker/`

### Files to create

#### `tribe_worker/main.py`
FastAPI app. Loads TRIBE v2 once at startup. Single endpoint.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
import os
from .model import TribeWorker

worker: TribeWorker = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker
    worker = TribeWorker()
    worker.load()          # loads model + downloads weights
    yield

app = FastAPI(lifespan=lifespan)
api_key_header = APIKeyHeader(name="X-API-Key")

@app.post("/analyze")
async def analyze(body: dict, api_key: str = Security(api_key_header)):
    if api_key != os.getenv("TRIBE_API_KEY"):
        raise HTTPException(status_code=403)
    youtube_url = body.get("youtube_url")
    if not youtube_url:
        raise HTTPException(status_code=422, detail="youtube_url required")
    return await worker.analyze(youtube_url)

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": worker is not None}
```

#### `tribe_worker/model.py`
Core inference logic.

```python
import numpy as np
import tempfile, os
from pathlib import Path
from tribev2.demo_utils import TribeModel
from tribev2.utils import get_hcp_roi_indices, summarize_by_roi
import yt_dlp

CACHE = Path("/workspace/tribe_cache")

# HCP-MMP1 label mapping for each Brain Trigger region
# Labels verified against HCP atlas — run get_hcp_labels() to confirm exact strings
HCP_REGION_MAP = {
    "FFA":            ["FFC", "TE1p", "TE2p"],
    "PPA":            ["PHA1", "PHA2", "PHA3"],
    "Visual Cortex":  ["V1", "V2", "V3", "V4", "V3A", "V3B"],
    "Auditory Cortex":["A1", "MBelt", "LBelt", "PBelt"],
    "Broca's Area":   ["44", "45", "IFJa", "IFJp"],    # left hemi only
    "TPJ":            ["TPOJ1", "TPOJ2", "TPOJ3", "PGi"],
    # Amygdala: subcortical — excluded, Claude handles this
}

class TribeWorker:
    def __init__(self):
        self.model = None

    def load(self):
        self.model = TribeModel.from_pretrained(
            "facebook/tribev2",
            cache_folder=CACHE,
            device="auto",
        )

    async def analyze(self, youtube_url: str) -> dict:
        with tempfile.TemporaryDirectory() as tmpdir:
            video_path = self._download_video(youtube_url, tmpdir)
            transcript = self._get_transcript(youtube_url)   # for returning to main backend
            scores = self._run_tribe(video_path)
        return {"tribe_scores": scores, "transcript": transcript}

    def _download_video(self, url: str, tmpdir: str) -> str:
        out = os.path.join(tmpdir, "video.mp4")
        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4",
            "outtmpl": out,
            "quiet": True,
            "max_filesize": 500 * 1024 * 1024,  # 500MB cap
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return out

    def _get_transcript(self, url: str) -> str:
        """Best-effort transcript via youtube-transcript-api for Claude enrichment."""
        try:
            import re
            from youtube_transcript_api import YouTubeTranscriptApi
            video_id = re.search(r'(?:v=|youtu\.be/)([0-9A-Za-z_-]{11})', url).group(1)
            fetched = YouTubeTranscriptApi().fetch(video_id)
            return ' '.join([e.text for e in fetched])[:4000]
        except Exception:
            return ""

    def _run_tribe(self, video_path: str) -> dict[str, int]:
        df = self.model.get_events_dataframe(video_path=video_path)
        preds, _ = self.model.predict(events=df)
        # preds: (n_timesteps, 20484)

        # Aggregate predictions by HCP ROI across time
        roi_preds = summarize_by_roi(preds, hemisphere="both")
        # roi_preds: (n_timesteps, n_hcp_regions)
        mean_roi = roi_preds.mean(axis=0)  # (n_hcp_regions,) — one value per region

        # Get HCP labels list to index into mean_roi
        from tribev2.utils import get_hcp_labels
        all_labels = get_hcp_labels(hemisphere="both")

        scores = {}
        for bt_region, hcp_labels in HCP_REGION_MAP.items():
            vals = []
            for label in hcp_labels:
                if label in all_labels:
                    idx = list(all_labels).index(label)
                    vals.append(mean_roi[idx])
            if vals:
                scores[bt_region] = self._to_score(np.mean(vals), mean_roi)

        return scores

    def _to_score(self, val: float, all_vals: np.ndarray) -> int:
        """Normalize a raw activation value to 0-100 using percentile rank across all regions."""
        pct = float(np.mean(all_vals <= val)) * 100
        return max(0, min(100, round(pct)))
```

> **Note on HCP labels:** The exact strings for `HCP_REGION_MAP` must be verified by running `get_hcp_labels()` on a live instance. The values above are best-guess based on HCP-MMP1 documentation. First thing to do when worker is running: print all labels and confirm.

#### `tribe_worker/requirements.txt`
```
fastapi
uvicorn[standard]
tribev2 @ git+https://github.com/facebookresearch/tribev2.git
yt-dlp
youtube-transcript-api
python-multipart
```

#### `tribe_worker/Dockerfile`
```dockerfile
FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .

ENV TRIBE_API_KEY=""
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### RunPod Setup
- Template: **RunPod PyTorch 2.5.1 / CUDA 12.1**
- GPU: **RTX 4090** (24GB VRAM) — minimum for TRIBE v2 + feature extractors
- Persistent volume: `/workspace/tribe_cache` — ~15GB for model weights
- Pod type: **On-Demand** or **Serverless** (serverless is cheaper for low-volume)
- Expose port 8000
- Set env var: `TRIBE_API_KEY=<secret>`
- First boot downloads ~15GB of weights (LLaMA 3.2-3B, V-JEPA2, Wav2Vec-BERT, TRIBE v2)

---

## Part 2: Main Backend Changes

### 2a. New file: `backend/services/tribe_service.py`

HTTP client that calls the RunPod worker.

```python
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TRIBE_WORKER_URL = os.getenv("TRIBE_WORKER_URL")   # e.g. https://<pod-id>-8000.proxy.runpod.net
TRIBE_API_KEY = os.getenv("TRIBE_API_KEY")
TRIBE_TIMEOUT = 120  # seconds — inference can take 30-60s


async def get_tribe_scores(youtube_url: str) -> dict:
    """
    Returns:
        {
            "tribe_scores": {"FFA": 82, "PPA": 60, ...},  # 6 regions, 0-100
            "transcript": "..."
        }
    Raises on timeout or worker error.
    """
    if not TRIBE_WORKER_URL:
        raise RuntimeError("TRIBE_WORKER_URL not set")

    async with httpx.AsyncClient(timeout=TRIBE_TIMEOUT) as client:
        resp = await client.post(
            f"{TRIBE_WORKER_URL}/analyze",
            json={"youtube_url": youtube_url},
            headers={"X-API-Key": TRIBE_API_KEY},
        )
        resp.raise_for_status()
        return resp.json()
```

### 2b. Modify: `backend/services/claude_analyzer.py`

Add a second entry point that accepts pre-computed TRIBE scores for 6 regions, and only asks Claude to: write descriptions, estimate Amygdala, generate summary/what_works/what_doesnt_work/recommendations.

```python
async def enrich_with_tribe_scores(
    transcript: str,
    tribe_scores: dict[str, int],
) -> AnalyzeResponse:
    """
    Used for YouTube analysis. tribe_scores has real values for 6 regions.
    Claude fills in: descriptions, Amygdala score, summaries, recommendations.
    """
    # Build a prompt telling Claude the scores are fixed — do NOT change them
    scores_str = "\n".join(f"- {k}: {v}/100" for k, v in tribe_scores.items())
    # ... prompt construction ...
    # Claude returns JSON with same schema but scores for 6 regions are
    # validated against tribe_scores before returning (Claude cannot override them)
```

The `analyze_with_claude()` function stays **unchanged** for text-only inputs.

### 2c. Modify: `backend/routers/analyze.py`

Route YouTube → TRIBE + Claude, text → Claude only.

```python
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    try:
        if request.input_type == "youtube":
            # Try TRIBE v2 first
            if os.getenv("TRIBE_WORKER_URL"):
                tribe_result = await get_tribe_scores(request.content)
                result = await enrich_with_tribe_scores(
                    transcript=tribe_result["transcript"],
                    tribe_scores=tribe_result["tribe_scores"],
                )
            else:
                # Fallback: extract transcript, use Claude entirely
                content = await extract_youtube_content(request.content)
                result = await analyze_with_claude(content)
        else:
            result = await analyze_with_claude(request.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 2d. Modify: `backend/models/schemas.py`

Add `analysis_source` to `BrainRegion` so the frontend can show which regions came from TRIBE vs Claude.

```python
class BrainRegion(BaseModel):
    name: str
    score: int
    description: str
    marketing_label: str
    emotion: str
    source: str = "claude"   # "tribe_v2" or "claude"
```

---

## Part 3: Frontend Changes

### 3a. `frontend/src/types/index.ts`
Add `source` field to `BrainRegion`:
```ts
export interface BrainRegion {
  name: string;
  score: number;
  description: string;
  marketing_label: string;
  emotion: string;
  source?: 'tribe_v2' | 'claude';
}
```

### 3b. `frontend/src/components/ResultsPanel.tsx`
In the Brain Regions section, show a small source badge per region:
- `tribe_v2` → small `TRIBE v2` pill in blue/dark
- `claude` → small `estimated` pill in muted gray
- Amygdala always shows `estimated` (subcortical note on hover)

### 3c. `frontend/src/app/page.tsx`
No changes needed.

---

## Part 4: Env Vars

### Main backend `.env`
```
ANTHROPIC_API_KEY=...          # existing
TRIBE_WORKER_URL=https://...   # new: RunPod worker URL
TRIBE_API_KEY=...               # new: shared secret
```

### RunPod worker env
```
TRIBE_API_KEY=...               # must match above
```

---

## Implementation Order

1. ✅ **Build Modal tribe_worker** — `tribe_worker/modal_app.py` + `tribe_worker/NOTES.md`
   - Modal image: PyTorch 2.5.1 + ffmpeg + tribev2 + yt-dlp + spacy
   - Persistent volume `tribe-v2-weights` for model weights (~15GB)
   - `analyze_video()` function: download → TRIBE v2 → HCP mapping → 0-100 scores
   - `verify_hcp_labels()` helper to confirm label strings before trusting scores

2. ✅ **Wire up main backend**
   - `backend/services/tribe_service.py` — Modal Python client wrapper
   - `backend/services/claude_analyzer.py` — added `enrich_with_tribe_scores()`
   - `backend/routers/analyze.py` — YouTube → TRIBE+Claude, text → Claude only
   - `backend/models/schemas.py` — added `source` field to BrainRegion
   - `backend/requirements.txt` — added `modal`

3. ✅ **Frontend**
   - `frontend/src/types/index.ts` — added `source?: 'tribe_v2' | 'claude'`
   - `frontend/src/components/ResultsPanel.tsx` — fMRI / estimated badges per region
     - "Powered by TRIBE v2" header badge when video analysis
     - Amygdala footnote explaining subcortical exclusion

4. **NEXT — Deploy & verify**
   - `pip install modal && modal setup`
   - `modal deploy tribe_worker/modal_app.py`
   - `modal run tribe_worker/modal_app.py::verify_hcp_labels` → fix HCP_REGION_MAP
   - End-to-end test with a YouTube URL
   - Verify 6 regions have `source: "tribe_v2"`, Amygdala has `source: "claude"`
   - Verify Claude does not override TRIBE scores

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| HCP label strings don't match exactly | Print `get_hcp_labels()` on first run, update map |
| TRIBE inference fails on some videos | Fallback to full Claude analysis in `analyze.py` |
| Inference >120s timeout | Increase timeout; cap video length at 5 min in yt-dlp |
| CC-BY-NC license for commercial use | Non-commercial/research only until Meta arrangement |
| RunPod pod cold start (serverless) | Use persistent pod during development; evaluate serverless later |
| Score normalization feels off | Can tune: percentile rank vs min-max vs z-score |

---

## Open Questions (answer before building)

1. **Exact HCP labels** — must verify against `get_hcp_labels()` output on a real instance. `FFC`, `PHA1`, `44`, etc. are best guesses.
2. **`summarize_by_roi()` return type** — confirmed to exist, but exact return shape/type needs one live test call.
3. **Broca's Area hemisphere** — should use left hemisphere only (language-dominant). Confirm `get_hcp_roi_indices()` accepts a `hemisphere` param.
4. **Video length cap** — TRIBE processes ~1 second per TR. A 10-minute video = 600 timesteps, fine. A 2-hour video needs chunking.
5. **RunPod serverless vs persistent** — serverless has cold start (~60s model load). During testing, use persistent pod.
