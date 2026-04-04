# Brain Trigger

Upload two videos. Get real fMRI brain activation scores. See which one wins.

Brain Trigger uses **TRIBE v2** — Meta FAIR's neural encoding model — to predict which brain regions your video content activates, then uses Claude to explain what that means in plain English.

![Brain Trigger UI](https://i.imgur.com/placeholder.png)

---

## How it works

1. Upload two videos (A and B)
2. Videos are sent to TRIBE v2 running on a GPU via Modal
3. TRIBE v2 predicts fMRI activation across 7 brain regions
4. Claude enriches the scores with plain-English explanations
5. You see which video triggers stronger emotional and cognitive responses

**Brain regions tracked:** Visual Cortex, Auditory Cortex, Amygdala, FFA (faces), PPA (places), TPJ (social), Broca's Area (language)

---

## Self-hosting

### What you need

| Requirement | Cost | Notes |
|---|---|---|
| [Modal account](https://modal.com) | Pay-per-use | ~$0.10–0.30 per analysis on A100 |
| [Anthropic API key](https://console.anthropic.com) | Pay-per-use | ~$0.01 per analysis |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Free | For running locally |
| [HuggingFace account](https://huggingface.co) | Free | For downloading TRIBE v2 weights |

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/abhishekalia/brain-trigger
cd brain-trigger
```

---

### Step 2 — Deploy TRIBE v2 to your Modal account

This is a one-time setup. TRIBE v2 weights (~15GB) download automatically on first run.

```bash
# Install Modal
pip install modal

# Connect to your Modal account (opens browser)
modal setup

# Create a HuggingFace secret in Modal
# Go to https://modal.com/secrets → New Secret → name it "huggingface"
# Add key: HF_TOKEN  value: your HuggingFace token (from https://huggingface.co/settings/tokens)

# Create a dummy youtube-cookies secret (required by the worker)
# Go to https://modal.com/secrets → New Secret → name it "youtube-cookies"
# Add key: COOKIES  value: (leave empty)

# Deploy the TRIBE v2 worker
modal deploy tribe_worker/modal_app.py
```

After deploying, Modal will print your endpoint URL:
```
Created web endpoint for analyze_video_endpoint =>
https://YOUR-USERNAME--brain-trigger-tribe-worker-analyze-video-endpoint.modal.run
```

Copy that URL — you'll need it in the next step.

---

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
ANTHROPIC_API_KEY=sk-ant-...          # from console.anthropic.com
TRIBE_ENDPOINT_URL=https://YOUR-USERNAME--brain-trigger-...modal.run
```

---

### Step 4 — Run with Docker

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000). That's it.

> First startup takes ~2 minutes to build the Docker images. Subsequent starts are instant.

---

### Running without Docker

If you prefer to run services directly:

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # fill in your keys
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

---

## Project structure

```
brain-trigger/
├── frontend/          # Next.js app (React, Three.js brain viewer)
├── backend/           # FastAPI server (job queue, Claude enrichment)
├── tribe_worker/      # Modal GPU worker (TRIBE v2 inference)
│   └── modal_app.py   # Deploy this to your Modal account
├── docker-compose.yml # Run everything locally
└── .env.example       # Copy to .env and fill in your keys
```

---

## License

- **Brain Trigger code** — MIT
- **TRIBE v2 model** — [CC-BY-NC-4.0](https://github.com/facebookresearch/tribev2/blob/main/LICENSE) (Meta FAIR, non-commercial use only)

This project is non-commercial and open source.
