from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import httpx
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class WaitlistRequest(BaseModel):
    email: str

@router.post("/waitlist")
async def join_waitlist(request: WaitlistRequest):
    token = os.getenv("AIRTABLE_TOKEN")
    base_id = os.getenv("AIRTABLE_BASE_ID")
    table_name = os.getenv("AIRTABLE_TABLE_NAME")

    if not all([token, base_id, table_name]):
        raise HTTPException(status_code=500, detail="Airtable not configured")

    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "records": [
            {
                "fields": {
                    "Email": request.email,
                    "Join Date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                }
            }
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to save email")

    return {"success": True}
