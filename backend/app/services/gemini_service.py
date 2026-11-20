"""
Gemini API client integration using the official google-genai SDK.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[genai.Client] = None


def get_client() -> genai.Client:
    """Return a singleton genai.Client instance."""
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set it in your environment or .env file."
            )
        _client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(api_version="v1beta"),
        )
    return _client


def _sync_generate(system_prompt: str, user_input: str) -> str:
    """Synchronous call to generate content using the Gemini client."""
    client = get_client()
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_input,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
        ),
    )
    return response.text or ""


async def generate_response(system_prompt: str, user_input: str) -> str:
    """
    Generate a response from the Gemini model asynchronously.
    Runs the synchronous SDK call in an executor thread.
    """
    try:
        return await asyncio.to_thread(_sync_generate, system_prompt, user_input)
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise
