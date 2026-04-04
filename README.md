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

## Prerequisites — install these first

Before you do anything else, make sure all of the following are installed on your computer.

### 1. Git
Used to download the project.
- **Mac:** Already installed. Open Terminal and run `git --version` to confirm.
- **Windows:** Download from [git-scm.com/download/win](https://git-scm.com/download/win). Run the installer with default settings.

After installing, close and reopen your terminal, then confirm with:
```
git --version
```

### 2. Python 3.10 or higher
Used to install and run Modal.
- **Mac:** Download from [python.org/downloads](https://python.org/downloads)
- **Windows:** Download from [python.org/downloads](https://python.org/downloads). On the first screen of the installer, **check the box that says "Add Python to PATH"** — this is important.

After installing, close and reopen your terminal, then confirm with:
```
python --version
```
You should see `Python 3.10.x` or higher.

### 3. Docker Desktop
Used to run the app locally.
- Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- Install and launch it. Make sure it's running before Step 6.

---

## Accounts you need

All are free to create.

| # | Account | Where | Cost |
|---|---|---|---|
| 1 | **Modal** | [modal.com](https://modal.com) | ~$0.10–0.30 per analysis (GPU) |
| 2 | **Anthropic** | [console.anthropic.com](https://console.anthropic.com) | ~$0.01 per analysis |
| 3 | **HuggingFace** | [huggingface.co](https://huggingface.co) | Free |

---

## Setup guide

### Step 1 — Clone the repo

Open Terminal (Mac) or Command Prompt (Windows) and run:

```
git clone https://github.com/abhishekalia/brain-model.git
cd brain-model
```

> **Windows users:** If you get a `git is not recognized` error, Git is not installed. See Prerequisites above.

---

### Step 2 — Install Modal and connect your account

```
python -m pip install modal
python -m modal setup
```

> **Note:** Use `python -m pip` and `python -m modal` instead of `pip` and `modal` directly — this avoids PATH issues on Windows.

This opens a browser window. Log in or create a Modal account. Once done, your terminal will confirm you're connected.

---

### Step 3 — Create a HuggingFace secret in Modal

1. Go to [modal.com/secrets](https://modal.com/secrets)
2. Click **New Secret** → select **Custom**
3. Name it exactly: `huggingface`
4. Add one key: `HF_TOKEN`
5. For the value, go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens), click **New token**, give it a name, select **Read** permission, and copy the token
6. Paste the token as the value in Modal
7. Click **Save**

---

### Step 4 — Deploy TRIBE v2 to your Modal account

In your terminal, make sure you're inside the `brain-model` folder, then run:

```
python -m modal deploy tribe_worker/modal_app.py
```

This takes about a minute. When it finishes, Modal prints your personal endpoint URL:

```
Created web endpoint for analyze_video_endpoint =>
https://YOUR-USERNAME--brain-trigger-tribe-worker-analyze-video-endpoint.modal.run
```

**Copy that URL** — you need it in the next step.

---

### Step 5 — Set up your environment file

**Mac:**
```
cp .env.example .env
```

**Windows:**
```
copy .env.example .env
```

Then open the `.env` file in any text editor (Notepad is fine) and fill in these two lines:

```
ANTHROPIC_API_KEY=sk-ant-...
TRIBE_ENDPOINT_URL=https://YOUR-USERNAME--brain-trigger-...modal.run
```

Save the file.

---

### Step 6 — Start the app

Make sure Docker Desktop is open and running, then:

```
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

> **First analysis takes 10–15 minutes.** This is normal. TRIBE v2 needs to download its model weights (~15GB) to Modal's storage on the very first run. Every analysis after that takes 3–5 minutes. You'll see a progress indicator on screen — don't close the tab.

---

## Stopping the app

```
docker compose down
```

---

## Running without Docker

If you'd rather not use Docker, you can run each service directly.

**Backend** (in one terminal tab):
```
cd backend
python -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> **Windows:** replace `source venv/bin/activate` with `venv\Scripts\activate`

**Frontend** (in a second terminal tab):
```
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting

**`git is not recognized`**
Git is not installed. See Prerequisites — install Git and reopen your terminal.

**`python is not recognized`**
Python is not installed. See Prerequisites — install Python and reopen your terminal. On Windows, make sure you checked "Add Python to PATH" during install.

**`modal is not recognized`**
Use `python -m modal` instead of `modal` for all commands.

**"Failed to poll job status"**
Your Modal endpoint URL in `.env` is wrong or the deployment failed. Re-run `python -m modal deploy tribe_worker/modal_app.py` and copy the URL again.

**First analysis stuck for 15+ minutes**
Normal on first run — model weights are downloading (~15GB). Check your [Modal dashboard](https://modal.com) to see the job running.

**"TRIBE_ENDPOINT_URL not configured"**
Your `.env` file is missing or the `TRIBE_ENDPOINT_URL` line is empty. Make sure you created `.env` from `.env.example` and filled it in.

**Docker build fails**
Make sure Docker Desktop is open and running before you run `docker compose up`.

**Port 3000 or 8000 already in use**
Something else on your machine is using that port. Stop the other process or change the ports in `docker-compose.yml`.

---

## Project structure

```
brain-model/
├── frontend/            # Next.js app — UI, 3D brain viewer, results
├── backend/             # FastAPI — job queue, Claude enrichment
├── tribe_worker/        # Modal GPU worker — TRIBE v2 inference
│   └── modal_app.py     # Deploy this to your Modal account (Step 4)
├── docker-compose.yml   # Runs frontend + backend locally
└── .env.example         # Copy to .env and fill in your keys (Step 5)
```

---

## Cost breakdown

| Service | Cost per analysis | Notes |
|---|---|---|
| Modal (TRIBE v2) | ~$0.10–0.30 | A100 GPU, billed per second |
| Anthropic (Claude) | ~$0.01 | For plain-English explanations |

Modal gives free credits when you first sign up. Anthropic gives $5 free credit for new accounts.

---

## License

- **Brain Trigger code** — MIT
- **TRIBE v2 model** — [CC-BY-NC-4.0](https://github.com/facebookresearch/tribev2/blob/main/LICENSE) (Meta FAIR, non-commercial use only)

This project is non-commercial and open source.
