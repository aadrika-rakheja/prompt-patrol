"""Experiment execution endpoints."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    BatchRunRequest,
    BatchRunResponse,
    CompareRequest,
    CompareResponse,
    TestResult,
    TestRunRequest,
)
from app.services.experiment_runner import run_batch, run_comparison, run_single

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.post("/run", response_model=TestResult)
async def run_experiment(request: TestRunRequest):
    """Execute a single test case against a selected prompt version."""
    try:
        return await run_single(request)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to execute experiment: {str(exc)}")


@router.post("/batch", response_model=BatchRunResponse)
async def run_batch_experiments(request: BatchRunRequest):
    """Run a batch of test cases against a selected prompt version."""
    try:
        return await run_batch(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Batch execution failed: {str(exc)}")


@router.post("/compare", response_model=CompareResponse)
async def compare_experiments(request: CompareRequest):
    """Run test cases simultaneously across V1, V2, and V3 prompt versions."""
    try:
        return await run_comparison(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Comparison execution failed: {str(exc)}")
