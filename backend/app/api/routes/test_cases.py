"""Test cases endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import TestCase
from app.services.test_case_manager import get_all_test_cases, get_by_category, get_categories, get_test_case

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])


@router.get("", response_model=list[TestCase])
async def list_test_cases(category: Optional[str] = Query(None, description="Filter by category")):
    """List test cases, optionally filtered by category."""
    if category:
        return get_by_category(category)
    return get_all_test_cases()


@router.get("/categories", response_model=list[str])
async def list_categories():
    """List distinct test categories."""
    return get_categories()


@router.get("/{test_id}", response_model=TestCase)
async def get_single_test_case(test_id: str):
    """Retrieve details for a single test case."""
    test_case = get_test_case(test_id)
    if not test_case:
        raise HTTPException(status_code=404, detail=f"Test case '{test_id}' not found.")
    return test_case
