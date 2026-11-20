"""
Prompt manager service: loads prompt templates and metadata from disk.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from app.models.schemas import PromptVersion

# backend/data directory
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
PROMPTS_DIR = DATA_DIR / "prompts"

_versions_cache: Optional[list[PromptVersion]] = None


def _load_metadata() -> list[dict]:
    meta_file = PROMPTS_DIR / "metadata.json"
    with open(meta_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("versions", [])


def get_prompt_content(version_id: str) -> str:
    """Read the raw text template for the specified prompt version."""
    file_path = PROMPTS_DIR / f"{version_id}.txt"
    if not file_path.exists():
        raise FileNotFoundError(f"Prompt template file not found: {file_path}")
    return file_path.read_text(encoding="utf-8")


def get_all_versions(include_content: bool = False) -> list[PromptVersion]:
    """Return all configured prompt versions, optionally including template content."""
    global _versions_cache
    raw_versions = _load_metadata()
    versions: list[PromptVersion] = []

    for item in raw_versions:
        content = None
        if include_content:
            try:
                content = get_prompt_content(item["id"])
            except Exception:
                content = None
        pv = PromptVersion(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            content=content,
            file=item["file"],
            changes_from_previous=item.get("changes_from_previous"),
            key_features=item.get("key_features", []),
            created_at=item["created_at"],
        )
        versions.append(pv)
    return versions


def get_version(version_id: str, include_content: bool = True) -> Optional[PromptVersion]:
    """Get metadata and content for a single version by ID."""
    versions = get_all_versions(include_content=include_content)
    for v in versions:
        if v.id.lower() == version_id.lower():
            if include_content and not v.content:
                v.content = get_prompt_content(v.id)
            return v
    return None
