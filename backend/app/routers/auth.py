# backend/app/routers/auth.py
import httpx # Required: pip install httpx

@router.post("/google-login", response_model=AuthResponse)
async def google_login(payload: dict) -> AuthResponse:
    token = payload.get("token")
    async with httpx.AsyncClient() as client:
        # Verify the token directly with Google
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Google token invalid")
        
        google_user = resp.json()
        email = google_user["email"]

    # Sync user with your MongoDB
    users = mongo_db["users"]
    user = users.find_one({"email": email})
    if not user:
        users.insert_one({
            "name": google_user.get("name", email.split("@")[0]),
            "email": email,
            "password_hash": None, # Google users don't have local passwords
            "role": "free",
            "created_at": datetime.now(timezone.utc)
        })
    
    return AuthResponse(access_token=create_access_token(email))