from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import mongo_db
from app.deps import get_current_user_email
from app.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.security import create_access_token, hash_password, verify_password

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    users = mongo_db["users"]
    if users.find_one({"email": payload.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    users.insert_one(
        {
            "name": payload.email.split("@")[0],
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": "free",
            "created_at": datetime.now(timezone.utc),
        }
    )
    token = create_access_token(payload.email)
    return AuthResponse(access_token=token)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = mongo_db["users"].find_one({"email": payload.email})
    if not user:
        # Demo-friendly flow: allow direct login by auto-creating user
        # if account does not exist yet.
        mongo_db["users"].insert_one(
            {
                "name": payload.email.split("@")[0],
                "email": payload.email,
                "password_hash": hash_password(payload.password),
                "role": "free",
                "created_at": datetime.now(timezone.utc),
            }
        )
        user = mongo_db["users"].find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(payload.email)
    return AuthResponse(access_token=token)


@router.get("/me")
def me(email: str = Depends(get_current_user_email)) -> dict:
    user = mongo_db["users"].find_one({"email": email}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return user

