import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import mongo_db
from app.deps import get_current_user_email
from app.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.security import create_access_token, hash_password, verify_password

from google.oauth2 import id_token
from google.auth.transport import requests

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# -----------------------------
# SCHEMA
# -----------------------------
class RepoRequest(BaseModel):
    repo_url: str


# -----------------------------
# REGISTER
# -----------------------------
@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    users = mongo_db["users"]

    if users.find_one({"email": payload.email}):
        raise HTTPException(status_code=409, detail="Email already exists")

    users.insert_one({
        "name": payload.email.split("@")[0],
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "free",
        "created_at": datetime.now(timezone.utc),
        "recent_repos": []
    })

    token = create_access_token(payload.email)
    return AuthResponse(access_token=token)


# -----------------------------
# LOGIN
# -----------------------------
@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    users = mongo_db["users"]
    user = users.find_one({"email": payload.email})

    # Auto-create user (demo mode)
    if not user:
        users.insert_one({
            "name": payload.email.split("@")[0],
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": "free",
            "created_at": datetime.now(timezone.utc),
            "recent_repos": []
        })
        user = users.find_one({"email": payload.email})

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(payload.email)
    return AuthResponse(access_token=token)


# -----------------------------
# GET RECENT REPOS
# -----------------------------
@router.get("/recent-repos")
def get_recent_repos(email: str = Depends(get_current_user_email)):
    user = mongo_db["users"].find_one({"email": email})
    return user.get("recent_repos", []) if user else []


# -----------------------------
# SAVE RECENT REPO
# -----------------------------
@router.post("/recent-repos")
def save_recent_repo(payload: RepoRequest, email: str = Depends(get_current_user_email)):
    users = mongo_db["users"]

    user = users.find_one({"email": email}) or {}
    repos = list(user.get("recent_repos", []))

    repo_url = payload.repo_url

    # Remove duplicate
    if repo_url in repos:
        repos.remove(repo_url)

    # Add newest on top
    repos.insert(0, repo_url)

    # Limit to 5
    repos = repos[:5]

    users.update_one(
        {"email": email},
        {"$set": {"recent_repos": repos}},
        upsert=True
    )

    return {"message": "saved"}


# -----------------------------
# CURRENT USER
# -----------------------------
@router.get("/me")
def me(email: str = Depends(get_current_user_email)) -> dict:
    user = mongo_db["users"].find_one({"email": email}, {"password_hash": 0})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["id"] = str(user.pop("_id"))
    return user


# -----------------------------
# GOOGLE LOGIN
# -----------------------------
@router.post("/google", response_model=AuthResponse)
def google_auth(payload: dict) -> AuthResponse:
    token = payload.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="Token missing")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        users = mongo_db["users"]

        user = users.find_one({"email": email})

        if not user:
            users.insert_one({
                "name": email.split("@")[0],
                "email": email,
                "password_hash": None,
                "role": "free",
                "created_at": datetime.now(timezone.utc),
                "recent_repos": []
            })

        access_token = create_access_token(email)
        return AuthResponse(access_token=access_token)

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")