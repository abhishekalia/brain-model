from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, waitlist, analyze_video

app = FastAPI(title="Brain Trigger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(waitlist.router, prefix="/api")
app.include_router(analyze_video.router, prefix="/api")
