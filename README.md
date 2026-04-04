# Brain Trigger

Upload two videos. Get real fMRI brain activation scores. See which one wins.

Brain Trigger uses **TRIBE v2** — Meta FAIR's neural encoding model — to predict which brain regions your video content activates, then uses Claude to explain what that means in plain English.

---

## How it works

1. Upload two videos (A and B)
2. Videos are sent to TRIBE v2 running on a GPU via Modal
3. TRIBE v2 predicts fMRI activation across 7 brain regions
4. Claude enriches the scores with plain-English explanations
5. You see which video triggers stronger emotional and cognitive responses

**Brain regions tracked:** Visual Cortex, Auditory Cortex, Amygdala, FFA (faces), PPA (places), TPJ (social), Broca's Area (language)

---

## What you need before starting

Make sure you have these four things ready. All are free to create.

| # | Requirement | Where to get it |
|---|---|---|
| 1 | **Modal account** | [modal.com](https://modal.com) — pay-per-use GPU (~$0.10–0.30 per analysis) |
| 2 | **Anthropic API key** | [console.anthropic.com](https://console.anthropic.com) — (~$0.01 per analysis) |
| 3 | **HuggingFace account + token** | [huggingface.co](https://huggingface.co) — free, needed to download TRIBE v2 weights |
| 4 | **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) — free |

---

## Setup guide

### Step 1 — Clone the repo

Open your terminal and run:

```bash
git clone https://github.com/abhishekalia/brain-model.git
cd brain-model
```

---

### Step 2 — Install Modal and connect your account

```bash
pip install modal
modal setup
```

This opens a browser window. Log in or create a Modal account. Once done your terminal will confirm you're connected.

---

### Step 3 — Create secrets in Modal

Modal needs two secrets to run the TRIBE v2 worker. Go to [modal.com/secrets](https://modal.com/secrets) and create both:

**Secret 1 — HuggingFace token**
- Click **New Secret**
- Name it exactly: `huggingface`
- Add one key: `HF_TOKEN`
- Value: your HuggingFace token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (create a read token if you don't have one)

---

### Step 4 — Deploy TRIBE v2 to your Modal account

Back in your terminal, from the root of the project:

```bash
modal deploy tribe_worker/modal_app.py
```

This takes about a minute. When it finishes, Modal prints your personal endpoint URL:

```
Created web endpoint for analyze_video_endpoint =>
https://YOUR-USERNAME--brain-trigger-tribe-worker-analyze-video-endpoint.modal.run
```

**Copy that URL** — you need it in the next step.

> Your endpoint is private to your Modal account. Only requests with your API key can call it.

---

### Step 5 — Set up your environment file

```bash
cp .env.example .env
```

Open the `.env` file in any text editor and fill in these two lines:

```env
ANTHROPIC_API_KEY=sk-ant-...
TRIBE_ENDPOINT_URL=https://YOUR-USERNAME--brain-trigger-...modal.run
```

Save the file.

---

### Step 6 — Start the app

```bash
docker compose up
```

Docker will build the frontend and backend images. **This first build takes about 2–3 minutes.** After that, every subsequent start is instant.

Once you see both services running, open your browser and go to:

```
http://localhost:3000
```

You should see the Brain Trigger UI.

---

### Step 7 — Run your first analysis

1. Upload a video to panel A (mp4, mov, avi, mkv, or webm — max 200MB)
2. Optionally upload a second video to panel B
3. Click **ANALYSE**

> **First analysis takes 10–15 minutes.** This is normal. TRIBE v2 needs to download its model weights (~15GB) to Modal's storage on the very first run. Every analysis after that takes 3–5 minutes.

You'll see a progress indicator on screen while it runs. Don't close the tab.

---

## Running without Docker

If you'd rather not use Docker, you can run each service directly.

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env .env
uvicorn main:app --reload --port 8000
```

**Frontend** (in a new terminal tab):
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stopping the app

```bash
docker compose down
```

---

## Troubleshooting

**"Failed to poll job status"**
Your Modal endpoint URL in `.env` is wrong or the deployment failed. Re-run `modal deploy tribe_worker/modal_app.py` and copy the URL again.

**First analysis stuck for 15+ minutes**
Normal on first run — model weights are downloading (~15GB). Check your [Modal dashboard](https://modal.com) to see the job running.

**"TRIBE_ENDPOINT_URL not configured"**
Your `.env` file is missing or the `TRIBE_ENDPOINT_URL` line is empty. Make sure you created `.env` from `.env.example` and filled it in.

**Docker build fails**
Make sure Docker Desktop is running before you run `docker compose up`.

**Port 3000 or 8000 already in use**
Something else on your machine is using that port. Stop the other process or change the ports in `docker-compose.yml`.

---

## Project structure

```
brain-trigger/
├── frontend/            # Next.js app — UI, 3D brain viewer, results
├── backend/             # FastAPI — job queue, Claude enrichment
├── tribe_worker/        # Modal GPU worker — TRIBE v2 inference
│   └── modal_app.py     # Deploy this to your Modal account (Step 4)
├── docker-compose.yml   # Runs frontend + backend locally
└── .env.example         # Copy to .env and fill in your keys (Step 5)
```

---

## Cost breakdown

Each analysis uses two paid services:

| Service | Cost per analysis | Notes |
|---|---|---|
| Modal (TRIBE v2) | ~$0.10–0.30 | A100 GPU, billed per second |
| Anthropic (Claude) | ~$0.01 | For enriching scores with explanations |

Modal has a free credit tier when you first sign up. Anthropic offers $5 free credit for new accounts.

---

## License

- **Brain Trigger code** — MIT
- **TRIBE v2 model** — [CC-BY-NC-4.0](https://github.com/facebookresearch/tribev2/blob/main/LICENSE) (Meta FAIR, non-commercial use only)

This project is non-commercial and open source.
