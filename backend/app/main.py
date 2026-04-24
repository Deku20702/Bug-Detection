from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health, projects, scans

app = FastAPI(title="Structural Bug Detection API")

# This block allows your React app (port 5173) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(scans.router, prefix="/scans", tags=["Scans"])