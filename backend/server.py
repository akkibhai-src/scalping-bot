from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

from lib.auth import ensure_admin_user, validate_admin_login


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db
from lib.market_store import store
from lib.bot_engine import engine
from lib import credentials as creds
from lib import wsutil
from routers.market import router as market_router
from routers.bot import router as bot_router


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)
    try:
        await ensure_admin_user()
    except Exception as exc:
        logger.warning("admin bootstrap failed: %s", exc)

    try:
        await creds.load()
    except Exception as exc:
        logger.warning("credential bootstrap failed: %s", exc)

    try:
        store.start()
    except Exception as exc:
        logger.warning("market store startup failed: %s", exc)

    try:
        await engine.load()
    except Exception as exc:
        logger.warning("engine bootstrap failed: %s", exc)

    yield

    try:
        await wsutil.close_all()   # release parked WebSocket handlers so shutdown/reload completes
    except Exception as exc:
        logger.warning("WebSocket cleanup failed: %s", exc)

    try:
        await engine.stop()
    except Exception as exc:
        logger.warning("engine shutdown failed: %s", exc)

    try:
        await store.stop()
    except Exception as exc:
        logger.warning("market store shutdown failed: %s", exc)

    try:
        client.close()
    except Exception as exc:
        logger.warning("Mongo shutdown failed: %s", exc)


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    email: str
    role: str = "admin"
    authenticated: bool = True


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
    is_valid = await validate_admin_login(payload.email, payload.password)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    await ensure_admin_user()
    return AdminLoginResponse(email="admin", role="admin", authenticated=True)

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
api_router.include_router(market_router)
api_router.include_router(bot_router)
app.include_router(api_router)

# Render serves the Vite build from this same process so /api and WebSockets stay
# same-origin in production. In local development this directory does not exist.
FRONTEND_DIR = ROOT_DIR / "frontend_dist"
if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{path:path}")
    async def frontend_app(path: str) -> FileResponse:
        return FileResponse(FRONTEND_DIR / "index.html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
