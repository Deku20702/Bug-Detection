import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.database import mongo_db
from app.schemas import AuthResponse
from app.security import create_access_token

router = APIRouter()

@router.post("/google-login", response_model=AuthResponse)
async def google_login(payload: dict):
    token = payload.get("token")
    async with httpx.AsyncClient() as client:
        # Verify the token with Google
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        google_user = resp.json()

    email = google_user["email"]
    users = mongo_db["users"]

    # Ensure user exists in MongoDB
    user = users.find_one({"email": email})
    if not user:
        users.insert_one({
            "name": google_user.get("name", email.split("@")[0]),
            "email": email,
            "password_hash": None, 
            "role": "free",
            "created_at": datetime.now(timezone.utc)
        })

    return AuthResponse(access_token=create_access_token(email))