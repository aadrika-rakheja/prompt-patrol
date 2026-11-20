"""Prompt versions endpoints."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import PromptVersion
from app.services.prompt_manager import get_all_versions, get_version

router = APIRouter(prefix="/prompts", tags=["Prompts"])


@router.get("", response_model=list[PromptVersion])
async def list_prompts():
    """List all available prompt versions without full template bodies."""
    return get_all_versions(include_content=False)


@router.get("/{version_id}", response_model=PromptVersion)
async def get_prompt(version_id: str):
    """Retrieve full prompt template text and metadata for a specific version."""
    version = get_version(version_id, include_content=True)
    if not version:
        raise HTTPException(status_code=404, detail=f"Prompt version '{version_id}' not found.")
    return version
