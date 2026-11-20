"""
Application configuration loaded from environment variables and .env files.
Uses pydantic-settings and explicit absolute path resolution to guarantee
loading regardless of current working directory.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine absolute directory paths
_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

# Possible .env locations in priority order
_ENV_FILES = [
    str(_PROJECT_ROOT / ".env"),
    str(_BACKEND_DIR / ".env"),
    str(_APP_DIR / ".env"),
    ".env",
    "../.env",
]


class Settings(BaseSettings):
    """Application settings sourced from environment variables and .env files."""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    DATABASE_URL: str = "sqlite:///./promptpatrol.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    LOG_LEVEL: str = "info"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Global settings singleton
settings = Settings()
