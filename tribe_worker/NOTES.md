# TRIBE v2 Worker — Dev Notes

## First-time setup

### 1. Install Modal CLI
```bash
pip install modal
modal setup   # authenticates with your Modal account
```

### 2. Deploy the worker
```bash
cd brain-model
modal deploy tribe_worker/modal_app.py
```

First deploy will:
- Build the Docker image (~5 min)
- Download TRIBE v2 + LLaMA 3.2-3B + V-JEPA2 + Wav2Vec-BERT weights (~15GB) into the `tribe-v2-weights` volume
- This only happens once — subsequent deploys reuse cached weights

### 3. Verify HCP labels (CRITICAL — do this before anything else)
```bash
modal run tribe_worker/modal_app.py::verify_hcp_labels
```

This prints every available HCP-MMP1 label string. Cross-check against `HCP_REGION_MAP` in `modal_app.py` and fix any mismatches. The map is best-guess from documentation — real label strings may differ slightly (e.g. `"FFC"` vs `"p9-46v"`, `"TPOJ1"` vs `"STV"` etc.)

### 4. Quick test
```bash
modal run tribe_worker/modal_app.py
```
Runs `main()` with a test YouTube URL and prints scores.

---

## Environment variables

Set in Modal dashboard or via `modal secret`:
- `TRIBE_API_KEY` — not needed for Modal functions (auth handled by Modal itself)

In main backend `.env`:
```
TRIBE_WORKER_URL=   # not needed — we call analyze_video.remote() directly via Modal client
TRIBE_API_KEY=      # not needed for Modal
```

> Note: With Modal, the main backend calls the function directly via the Modal Python client
> (`analyze_video.remote()`), no HTTP endpoint needed. This is simpler and more secure
> than a RunPod HTTP endpoint.

---

## Calling from main backend

Install Modal client in main backend:
```bash
pip install modal
```

```python
import modal
analyze_video = modal.Function.lookup("brain-trigger-tribe-worker", "analyze_video")
result = analyze_video.remote(youtube_url="https://youtube.com/watch?v=...")
```

---

## Costs (Modal A10G)

- Rate: ~$0.000222/sec = ~$0.013/min
- Per analysis (60s video): ~$0.013
- Keep-warm (1 container): ~$0.013/min when idle
- Turn off keep_warm=1 after beta to save money if traffic is low

---

## Known limitations

- **Amygdala excluded** — subcortical, not in TRIBE v2's cortical output. Handled by Claude in main backend.
- **Max video length**: 300s (5 min) — longer videos are trimmed. Adjust `MAX_VIDEO_SECONDS` if needed.
- **CC-BY-NC-4.0 license** — non-commercial use only. Arrange with Meta for commercial deployment.
- **HCP label strings** — MUST be verified with `verify_hcp_labels.remote()` before trusting scores.
