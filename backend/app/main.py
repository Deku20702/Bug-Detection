# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, projects, scans # cite: 36

app = FastAPI(title="Structural Bug Detection API") # cite: 36

# This must be present for your React app to reach the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the auth router is included
app.include_router(auth.router, prefix="/auth", tags=["Auth"]) # cite: 36
# ... other routers ...