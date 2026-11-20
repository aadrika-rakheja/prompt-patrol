"""
Test case manager service: loads test cases and categories from test_cases.json.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from app.models.schemas import TestCase

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TEST_CASES_FILE = DATA_DIR / "test_cases.json"

_test_cases_cache: Optional[list[TestCase]] = None


def _load_data() -> dict:
    if not TEST_CASES_FILE.exists():
        raise FileNotFoundError(f"Test cases file not found at {TEST_CASES_FILE}")
    with open(TEST_CASES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_test_cases() -> list[TestCase]:
    """Retrieve all test cases."""
    global _test_cases_cache
    if _test_cases_cache is None:
        data = _load_data()
        _test_cases_cache = [TestCase.model_validate(tc) for tc in data.get("test_cases", [])]
    return _test_cases_cache


def get_test_case(test_id: str) -> Optional[TestCase]:
    """Retrieve a single test case by its ID."""
    cases = get_all_test_cases()
    for tc in cases:
        if tc.id.lower() == test_id.lower():
            return tc
    return None


def get_by_category(category: str) -> list[TestCase]:
    """Retrieve test cases filtered by category."""
    cases = get_all_test_cases()
    return [tc for tc in cases if tc.category.lower() == category.lower()]


def get_categories() -> list[str]:
    """Retrieve list of distinct test case categories."""
    cases = get_all_test_cases()
    return sorted(list({tc.category for tc in cases}))
