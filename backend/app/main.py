"""
PromptPatrol FastAPI Application Entry Point.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import experiments, health, metrics, prompts, results, test_cases
from app.config import settings
from app.database import close_db, init_db

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("promptpatrol")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and teardown."""
    logger.info("Initializing database...")
    await init_db()
    yield
    logger.info("Shutting down database...")
    await close_db()


app = FastAPI(
    title="PromptPatrol API",
    version="1.0.0",
    description="LLM Prompt Security Testing & Evaluation Framework Backend",
    lifespan=lifespan,
)

# CORS middleware
# Allow credentials with specific origins or allow all when wildcard/empty
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if not origins or "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*",
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(prompts.router, prefix="/api")
app.include_router(test_cases.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": "PromptPatrol API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
    }
