"""
Experiment runner service: coordinates execution of single, batch, and comparative prompt experiments.
Handles rate limiting, timing, deduplication hashing, and DB persistence.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import time
import uuid

from app.database import insert_result
from app.models.schemas import (
    BatchRunRequest,
    BatchRunResponse,
    CompareRequest,
    CompareResponse,
    ComparisonData,
    TestResult,
    TestRunRequest,
)
from app.services.evaluation_engine import evaluate_response
from app.services.gemini_service import generate_response
from app.services.metrics_service import get_version_comparison
from app.services.prompt_manager import get_prompt_content
from app.services.test_case_manager import get_all_test_cases, get_test_case


async def run_single(request: TestRunRequest) -> TestResult:
    """Execute a single test case against a specific prompt version."""
    test_case = get_test_case(request.test_id)
    if not test_case:
        raise ValueError(f"Test case with id '{request.test_id}' not found.")

    system_prompt = get_prompt_content(request.prompt_version)
    input_text = request.custom_input if request.custom_input is not None else test_case.input_text

    input_hash = hashlib.sha256(
        f"{request.prompt_version}:{request.test_id}:{input_text}".encode("utf-8")
    ).hexdigest()

    start_time = time.perf_counter()
    model_output = ""
    error_msg = None

    try:
        model_output = await generate_response(system_prompt=system_prompt, user_input=input_text)
    except Exception as exc:
        error_msg = str(exc)
        model_output = f"[Error executing model request: {error_msg}]"

    execution_time_ms = int((time.perf_counter() - start_time) * 1000)

    if error_msg:
        verdict = "error"
        explanation = f"Execution error: {error_msg}"
        secret_disclosed = False
    else:
        eval_result = await evaluate_response(
            test_case=test_case,
            prompt_version=request.prompt_version,
            model_output=model_output,
        )
        verdict = eval_result.verdict
        explanation = eval_result.explanation
        secret_disclosed = eval_result.secret_disclosed

    result_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    row_data = {
        "id": result_id,
        "test_id": test_case.id,
        "test_name": test_case.name,
        "category": test_case.category,
        "prompt_version": request.prompt_version.lower(),
        "input_text": input_text,
        "attack_objective": test_case.attack_objective,
        "expected_behavior": test_case.expected_behavior,
        "model_output": model_output,
        "verdict": verdict,
        "evaluation_explanation": explanation,
        "secret_disclosed": int(secret_disclosed),
        "is_adversarial": int(test_case.is_adversarial),
        "severity": test_case.severity,
        "execution_time_ms": execution_time_ms,
        "created_at": created_at,
        "input_hash": input_hash,
    }

    await insert_result(row_data)

    return TestResult(
        id=result_id,
        test_id=test_case.id,
        test_name=test_case.name,
        category=test_case.category,
        prompt_version=request.prompt_version.lower(),
        input_text=input_text,
        attack_objective=test_case.attack_objective,
        expected_behavior=test_case.expected_behavior,
        model_output=model_output,
        verdict=verdict,
        evaluation_explanation=explanation,
        secret_disclosed=secret_disclosed,
        is_adversarial=test_case.is_adversarial,
        severity=test_case.severity,
        execution_time_ms=execution_time_ms,
        created_at=created_at,
        input_hash=input_hash,
    )


async def run_batch(request: BatchRunRequest) -> BatchRunResponse:
    """Execute a batch of tests against a given prompt version."""
    all_cases = get_all_test_cases()
    selected_cases = []

    for tc in all_cases:
        if request.test_ids and tc.id not in request.test_ids:
            continue
        if request.categories and tc.category not in request.categories:
            continue
        selected_cases.append(tc)

    results: list[TestResult] = []
    for tc in selected_cases:
        run_req = TestRunRequest(
            prompt_version=request.prompt_version,
            test_id=tc.id,
        )
        res = await run_single(run_req)
        results.append(res)

    summary = {
        "total": len(results),
        "blocked": sum(1 for r in results if r.verdict == "blocked"),
        "succeeded": sum(1 for r in results if r.verdict == "succeeded"),
        "benign_pass": sum(1 for r in results if r.verdict == "benign_pass"),
        "false_positive": sum(1 for r in results if r.verdict == "false_positive"),
        "error": sum(1 for r in results if r.verdict == "error"),
    }

    return BatchRunResponse(results=results, summary=summary)


async def run_comparison(request: CompareRequest) -> CompareResponse:
    """Run tests across V1, V2, and V3 prompt versions for direct comparison."""
    versions = ["v1", "v2", "v3"]
    results_by_version: dict[str, list[TestResult]] = {}

    all_cases = get_all_test_cases()
    selected_cases = []
    for tc in all_cases:
        if request.test_ids and tc.id not in request.test_ids:
            continue
        if request.categories and tc.category not in request.categories:
            continue
        selected_cases.append(tc)

    for v in versions:
        v_results: list[TestResult] = []
        for tc in selected_cases:
            run_req = TestRunRequest(
                prompt_version=v,
                test_id=tc.id,
            )
            res = await run_single(run_req)
            v_results.append(res)
        results_by_version[v] = v_results

    comparison_data = await get_version_comparison()
    return CompareResponse(results=results_by_version, comparison=comparison_data)
