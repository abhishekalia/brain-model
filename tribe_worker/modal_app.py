"""
Brain Trigger — TRIBE v2 Modal Worker
======================================
Runs on Modal GPU (A10G, 24GB VRAM).
Accepts a YouTube URL, downloads the video, runs TRIBE v2 inference,
maps HCP-MMP1 cortical regions to Brain Trigger's 7 regions (6 from TRIBE,
Amygdala excluded — subcortical, handled by Claude in main backend).

Deploy:
    modal deploy tribe_worker/modal_app.py

Call from main backend:
    analyze_video.remote(youtube_url="https://youtube.com/watch?v=...")

Returns:
    {
        "tribe_scores": {"FFA": 82, "PPA": 60, ...},   # 6 regions, 0-100
        "transcript": "...",                             # for Claude enrichment
        "video_title": "...",
        "duration_seconds": 143
    }

IMPORTANT — HCP label verification:
    On first deploy, run verify_hcp_labels.remote() to print all available
    HCP-MMP1 label strings and confirm HCP_REGION_MAP keys are correct.
    The labels below are best-guess from HCP-MMP1 documentation.
"""

import os
import modal

# ---------------------------------------------------------------------------
# Modal image — installs everything needed for TRIBE v2
# ---------------------------------------------------------------------------
image = (
    modal.Image.from_registry(
        "pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime",
        add_python="3.11",
    )
    .apt_install("ffmpeg", "git", "curl")
    .run_commands("curl -LsSf https://astral.sh/uv/install.sh | sh")
    .env({"PATH": "/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"})
    .pip_install(
        "fastapi[standard]",
        # TRIBE v2 from GitHub (CC-BY-NC-4.0)
        "tribev2 @ git+https://github.com/facebookresearch/tribev2.git",
        # Video download
        "yt-dlp",
        # Transcript fallback for Claude enrichment
        "youtube-transcript-api",
        # HTTP client for oEmbed metadata
        "httpx",
    )
    # spacy model needed by TRIBE v2's text pipeline
    .run_commands("python -m spacy download en_core_web_sm")
)

# Persistent volume — model weights (~15GB) download once and live here forever
volume = modal.Volume.from_name("tribe-v2-weights", create_if_missing=True)
WEIGHTS_PATH = "/weights"

app = modal.App("brain-trigger-tribe-worker", image=image)

# ---------------------------------------------------------------------------
# HCP-MMP1 → Brain Trigger region mapping
#
# !! VERIFY THESE LABELS !!
# Run verify_hcp_labels.remote() after first deploy and cross-check the
# printed label list against the values below. Adjust if needed.
#
# Amygdala is intentionally excluded — it is subcortical and not present
# in TRIBE v2's cortical surface output (fsaverage5, 20,484 vertices).
# Amygdala score is estimated by Claude in the main backend.
# ---------------------------------------------------------------------------
HCP_REGION_MAP: dict[str, list[str]] = {
    "FFA":             ["FFC", "TE1p", "TE2p"],
    "PPA":             ["PHA1", "PHA2", "PHA3"],
    "Visual Cortex":   ["V1", "V2", "V3", "V4", "V3A", "V3B"],
    "Auditory Cortex": ["A1", "MBelt", "LBelt", "PBelt"],
    "Broca's Area":    ["IFJa", "IFJp", "IFSa", "IFSp"],  # inferior frontal — Broca's equivalent in HCP-MMP1
    "TPJ":             ["TPOJ1", "TPOJ2", "TPOJ3", "PGi"],
}

# Max video length — 30s is standard for ads, keeps encoding time ~5 min on A100
MAX_VIDEO_SECONDS = 30


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _download_video(youtube_url: str, out_path: str) -> dict:
    """Download video with yt-dlp, return metadata dict."""
    import yt_dlp
    import tempfile

    meta = {}
    ydl_opts = {
        "format": "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best",
        "outtmpl": out_path,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": 500 * 1024 * 1024,  # 500 MB cap
    }

    # Write YouTube cookies from env to a temp file so yt-dlp can authenticate
    cookies_b64 = os.environ.get("COOKIES", "")
    print(f"[TRIBE worker] COOKIES env set: {bool(cookies_b64)}, length: {len(cookies_b64)}")
    if cookies_b64:
        import base64
        try:
            cookies_content = base64.b64decode(cookies_b64).decode("utf-8")
        except Exception:
            # Not base64, use raw
            cookies_content = cookies_b64
        print(f"[TRIBE worker] Cookies decoded, length: {len(cookies_content)}, starts with: {cookies_content[:50]}")
        cookies_file = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
        cookies_file.write(cookies_content)
        cookies_file.close()
        ydl_opts["cookiefile"] = cookies_file.name
        print(f"[TRIBE worker] Cookies file written to: {cookies_file.name}")

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)
        meta["title"] = info.get("title", "")
        meta["duration_seconds"] = info.get("duration", 0)
    return meta


def _get_transcript(youtube_url: str) -> str:
    """Best-effort transcript via youtube-transcript-api. Returns '' on failure."""
    import re
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        match = re.search(r'(?:v=|youtu\.be/)([0-9A-Za-z_-]{11})', youtube_url)
        if not match:
            return ""
        video_id = match.group(1)
        fetched = YouTubeTranscriptApi().fetch(video_id)
        return " ".join([e.text for e in fetched])[:4000]
    except Exception:
        return ""


def _load_model():
    """Load TRIBE v2 model from persistent volume cache."""
    from tribev2.demo_utils import TribeModel
    return TribeModel.from_pretrained(
        "facebook/tribev2",
        cache_folder=WEIGHTS_PATH,
        device="auto",
    )


def _extract_transcript_from_df(df) -> str:
    """Extract transcribed speech from TRIBE's events dataframe."""
    try:
        # TRIBE v2 stores transcribed text in a 'text' column
        if "text" in df.columns:
            texts = df["text"].dropna().tolist()
            return " ".join(str(t) for t in texts if str(t).strip())[:4000]
    except Exception:
        pass
    return ""


def _run_inference(model, video_path: str) -> tuple[dict[str, int], str]:
    """
    Run TRIBE v2 on a local video file.
    Returns (Brain Trigger region scores as 0-100 integers, transcript string).
    """
    import numpy as np
    from tribev2.utils import summarize_by_roi, get_hcp_labels

    # Build events dataframe from video (extracts audio + transcribes internally)
    df = model.get_events_dataframe(video_path=video_path)

    # Extract transcript from TRIBE's internal Whisper transcription
    transcript = _extract_transcript_from_df(df)
    print(f"[TRIBE worker] Transcript length: {len(transcript)} chars")

    # Run inference — preds shape: (n_timesteps, 20484)
    preds, _ = model.predict(events=df)
    print(f"[TRIBE worker] preds shape: {preds.shape}")

    # Average across time → 1D array (20484,) — summarize_by_roi requires 1D input
    mean_preds = preds.mean(axis=0)

    # Aggregate across HCP-MMP1 parcellation → dict {label: mean_activation}
    roi_scores = summarize_by_roi(mean_preds)
    print(f"[TRIBE worker] roi_scores type: {type(roi_scores)}, sample: {list(roi_scores.items())[:5] if hasattr(roi_scores, 'items') else roi_scores[:5]}")

    # Handle both dict and array return types
    if hasattr(roi_scores, 'items'):
        # Dict: {label: value}
        all_labels = list(roi_scores.keys())
        mean_roi = [roi_scores[l] for l in all_labels]
    else:
        # Array: need labels separately
        all_labels = list(get_hcp_labels())
        mean_roi = roi_scores

    scores: dict[str, int] = {}
    raw_vals: dict[str, float] = {}

    for bt_region, hcp_labels in HCP_REGION_MAP.items():
        vals = []
        for label in hcp_labels:
            if label in all_labels:
                idx = all_labels.index(label)
                vals.append(float(mean_roi[idx]))
            else:
                print(f"[TRIBE worker] WARNING: HCP label '{label}' not found — skipping")
        if vals:
            raw_vals[bt_region] = float(np.mean(vals))

    if not raw_vals:
        raise RuntimeError("No HCP labels matched — verify HCP_REGION_MAP against get_hcp_labels() output")

    # Normalize raw activations to 0-100 using percentile rank
    # Each region's score = its percentile rank among all raw values
    all_raw = list(raw_vals.values())
    for bt_region, val in raw_vals.items():
        pct = sum(v <= val for v in all_raw) / len(all_raw)
        scores[bt_region] = max(0, min(100, round(pct * 100)))

    return scores, transcript


# ---------------------------------------------------------------------------
# Modal functions
# ---------------------------------------------------------------------------

@app.function(
    gpu="A10G",
    volumes={WEIGHTS_PATH: volume},
    secrets=[modal.Secret.from_name("huggingface"), modal.Secret.from_name("youtube-cookies")],
    timeout=1200,
    min_containers=1,
)
def analyze_video(youtube_url: str) -> dict:
    """
    Main entry point. Called from Brain Trigger's main backend.

    Returns:
        {
            "tribe_scores": {"FFA": 82, "PPA": 60, ...},
            "transcript": "...",
            "video_title": "...",
            "duration_seconds": 143
        }
    """
    import tempfile

    model = _load_model()

    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "video.mp4")

        # Download video
        print(f"[TRIBE worker] Downloading: {youtube_url}")
        meta = _download_video(youtube_url, video_path)
        print(f"[TRIBE worker] Downloaded: {meta['title']} ({meta['duration_seconds']}s)")

        # Cap length — trim long videos (TRIBE processes full length otherwise)
        if meta["duration_seconds"] > MAX_VIDEO_SECONDS:
            print(f"[TRIBE worker] Video >{MAX_VIDEO_SECONDS}s — trimming to {MAX_VIDEO_SECONDS}s")
            import subprocess
            trimmed = os.path.join(tmpdir, "trimmed.mp4")
            subprocess.run(
                ["ffmpeg", "-i", video_path, "-t", str(MAX_VIDEO_SECONDS),
                 "-c", "copy", trimmed, "-y"],
                check=True, capture_output=True,
            )
            video_path = trimmed

        # Get transcript — prefer youtube-transcript-api (cleaner), fall back to TRIBE's Whisper
        yt_transcript = _get_transcript(youtube_url)

        # Run TRIBE v2 inference
        print("[TRIBE worker] Running TRIBE v2 inference...")
        scores, tribe_transcript = _run_inference(model, video_path)
        print(f"[TRIBE worker] Scores: {scores}")

        transcript = yt_transcript or tribe_transcript

    return {
        "tribe_scores": scores,
        "transcript": transcript,
        "video_title": meta.get("title", ""),
        "duration_seconds": meta.get("duration_seconds", 0),
    }


@app.function(
    gpu="A10G",
    volumes={WEIGHTS_PATH: volume},
    secrets=[modal.Secret.from_name("huggingface"), modal.Secret.from_name("youtube-cookies")],
    timeout=120,
)
def verify_hcp_labels() -> list[str]:
    """
    Run this ONCE after first deploy to print all available HCP-MMP1 labels.
    Use the output to verify/fix HCP_REGION_MAP above.

    Usage:
        modal run tribe_worker/modal_app.py::verify_hcp_labels
    """
    from tribev2.utils import get_hcp_labels
    model = _load_model()  # ensures weights are downloaded
    labels = list(get_hcp_labels())
    print(f"\n[HCP Labels] Total: {len(labels)}\n")
    print("\n".join(sorted(labels)))
    return labels


@app.function(
    gpu="A100",
    volumes={WEIGHTS_PATH: volume},
    secrets=[modal.Secret.from_name("huggingface"), modal.Secret.from_name("youtube-cookies")],
    timeout=1200,
    min_containers=1,
)
def analyze_video_file(video_bytes: bytes, title: str = "") -> dict:
    """Internal function — called by the web endpoint."""
    import tempfile
    import subprocess
    import json as _json

    model = _load_model()

    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "video.mp4")
        with open(video_path, "wb") as f:
            f.write(video_bytes)

        # Get duration
        probe = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path],
            capture_output=True, text=True,
        )
        duration = float(_json.loads(probe.stdout).get("format", {}).get("duration", 0))

        # Trim + downsample to 4fps — reduces frames ~6x, major speedup
        processed = os.path.join(tmpdir, "processed.mp4")
        trim_args = ["-t", str(MAX_VIDEO_SECONDS)] if duration > MAX_VIDEO_SECONDS else []
        subprocess.run(
            ["ffmpeg", "-i", video_path]
            + trim_args
            + ["-vf", "fps=1", "-c:v", "libx264", "-c:a", "aac", processed, "-y"],
            check=True, capture_output=True,
        )
        video_path = processed
        print(f"[TRIBE worker] Preprocessed video: {duration:.0f}s → 4fps")

        print("[TRIBE worker] Running TRIBE v2 inference...")
        scores, transcript = _run_inference(model, video_path)
        print(f"[TRIBE worker] Scores: {scores}")

    return {"tribe_scores": scores, "transcript": transcript, "video_title": title, "duration_seconds": duration}


@app.function(
    gpu="A100",
    volumes={WEIGHTS_PATH: volume},
    secrets=[modal.Secret.from_name("huggingface"), modal.Secret.from_name("youtube-cookies")],
    timeout=1200,
    min_containers=1,
)
@modal.fastapi_endpoint(method="POST")
def analyze_video_endpoint(body: dict) -> dict:
    """
    HTTP endpoint — called directly by Railway backend via httpx.
    Accepts: {"video_b64": "<base64>", "title": "...", "api_key": "..."}
    Returns: {"tribe_scores": {...}, "video_title": "...", "transcript": ""}
    """
    import base64

    api_key = os.environ.get("TRIBE_API_KEY", "")
    if api_key and body.get("api_key") != api_key:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Invalid API key")

    video_b64 = body.get("video_b64", "")
    if not video_b64:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="video_b64 required")

    video_bytes = base64.b64decode(video_b64)
    title = body.get("title", "")

    try:
        return analyze_video_file.local(video_bytes=video_bytes, title=title)
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"[TRIBE endpoint] ERROR: {error_detail}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@app.local_entrypoint()
def main():
    """
    Local test — reads video file and passes bytes to Modal.
    Usage: modal run tribe_worker/modal_app.py
    Download video first: yt-dlp --cookies-from-browser chrome <url> -o /tmp/test_video.mp4
    """
    video_path = "/tmp/test_video.mp4"
    print(f"Reading video from: {video_path}")
    with open(video_path, "rb") as f:
        video_bytes = f.read()
    print(f"Video size: {len(video_bytes) / 1024 / 1024:.1f} MB — sending to Modal...")
    result = analyze_video_file.remote(video_bytes=video_bytes, title="Test video")
    print(f"\nResult: {result}")
