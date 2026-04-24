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

from app.schemas import RegisterRequest, LoginRequest
from app.security import hash_password, verify_password

@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    users = mongo_db["users"]
    if users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users.insert_one({
        "name": payload.email.split("@")[0],
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "free",
        "created_at": datetime.now(timezone.utc)
    })
    
    return AuthResponse(access_token=create_access_token(payload.email))

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    users = mongo_db["users"]
    user = users.find_one({"email": payload.email})
    
    if not user or not user.get("password_hash") or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return AuthResponse(access_token=create_access_token(payload.email))

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from app.deps import auth_scheme

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials
    mongo_db["token_blacklist"].insert_one({
        "token": token,
        "revoked_at": datetime.now(timezone.utc)
    })
    return {"detail": "Successfully logged out"}