"""Results and history query endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.database import get_result_by_id, get_results
from app.models.schemas import TestResult

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("", response_model=list[TestResult])
async def list_results(
    prompt_version: Optional[str] = Query(None, description="Filter by prompt version"),
    category: Optional[str] = Query(None, description="Filter by attack category"),
    verdict: Optional[str] = Query(None, description="Filter by evaluation verdict"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Retrieve filtered, paginated test history results from the database."""
    raw_results = await get_results(
        prompt_version=prompt_version,
        category=category,
        verdict=verdict,
        limit=limit,
        offset=offset,
    )
    return [
        TestResult(
            id=r["id"],
            test_id=r["test_id"],
            test_name=r["test_name"],
            category=r["category"],
            prompt_version=r["prompt_version"],
            input_text=r["input_text"],
            attack_objective=r.get("attack_objective"),
            expected_behavior=r.get("expected_behavior"),
            model_output=r.get("model_output"),
            verdict=r["verdict"],
            evaluation_explanation=r.get("evaluation_explanation"),
            secret_disclosed=bool(r.get("secret_disclosed")),
            is_adversarial=bool(r.get("is_adversarial")),
            severity=r.get("severity"),
            execution_time_ms=r.get("execution_time_ms"),
            created_at=r["created_at"],
            input_hash=r.get("input_hash"),
        )
        for r in raw_results
    ]


@router.get("/{result_id}", response_model=TestResult)
async def get_result(result_id: str):
    """Retrieve detailed execution information for a single experiment result."""
    r = await get_result_by_id(result_id)
    if not r:
        raise HTTPException(status_code=404, detail=f"Result with id '{result_id}' not found.")
    return TestResult(
        id=r["id"],
        test_id=r["test_id"],
        test_name=r["test_name"],
        category=r["category"],
        prompt_version=r["prompt_version"],
        input_text=r["input_text"],
        attack_objective=r.get("attack_objective"),
        expected_behavior=r.get("expected_behavior"),
        model_output=r.get("model_output"),
        verdict=r["verdict"],
        evaluation_explanation=r.get("evaluation_explanation"),
        secret_disclosed=bool(r.get("secret_disclosed")),
        is_adversarial=bool(r.get("is_adversarial")),
        severity=r.get("severity"),
        execution_time_ms=r.get("execution_time_ms"),
        created_at=r["created_at"],
        input_hash=r.get("input_hash"),
    )
