# backend/app/routers/auth.py
import httpx
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from app.database import mongo_db
from app.schemas import AuthResponse
from app.security import create_access_token

# ... existing code ...

@router.post("/google-login", response_model=AuthResponse)
async def google_login(payload: dict) -> AuthResponse:
    # 1. Get the token from the frontend payload
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is missing")

    # 2. Verify the access token with Google's userinfo endpoint
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid Google token"
            )
        
        google_user = resp.json()

    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    # 3. Check if user exists in MongoDB; create them if they don't
    users = mongo_db["users"]
    user = users.find_one({"email": email})
    
    if not user:
        users.insert_one({
            "name": google_user.get("name", email.split("@")[0]),
            "email": email,
            "password_hash": None,  # No local password for OAuth users
            "role": "free",
            "created_at": datetime.now(timezone.utc),
            "auth_provider": "google"
        })
    
    # 4. Generate your application's internal JWT token
    access_token = create_access_token(email)
    return AuthResponse(access_token=access_token)