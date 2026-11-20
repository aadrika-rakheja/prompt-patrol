"""
Pydantic models (schemas) for all API request/response payloads.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Prompt models
# ---------------------------------------------------------------------------

class PromptVersion(BaseModel):
    """Metadata and optional content for a prompt template version."""

    id: str
    name: str
    description: str
    content: Optional[str] = None
    file: str
    changes_from_previous: Optional[str] = None
    key_features: list[str] = Field(default_factory=list)
    created_at: str


# ---------------------------------------------------------------------------
# Test-case models
# ---------------------------------------------------------------------------

class TestCase(BaseModel):
    """A single test case (adversarial or benign)."""

    id: str
    name: str
    category: str
    severity: str
    is_adversarial: bool
    input_text: str = Field(alias="input")
    attack_objective: Optional[str] = None
    expected_behavior: Optional[str] = None

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class TestRunRequest(BaseModel):
    """Request to run a single experiment."""

    prompt_version: str
    test_id: str
    custom_input: Optional[str] = None


class BatchRunRequest(BaseModel):
    """Request to run a batch of experiments."""

    prompt_version: str
    test_ids: Optional[list[str]] = None
    categories: Optional[list[str]] = None


class CompareRequest(BaseModel):
    """Request to compare all prompt versions against the same tests."""

    test_ids: Optional[list[str]] = None
    categories: Optional[list[str]] = None


# ---------------------------------------------------------------------------
# Result / evaluation models
# ---------------------------------------------------------------------------

class EvaluationResult(BaseModel):
    """Output of the evaluation engine for a single response."""

    verdict: str
    explanation: str
    secret_disclosed: bool


class TestResult(BaseModel):
    """Full result for one test run."""

    id: str
    test_id: str
    test_name: str
    category: str
    prompt_version: str
    input_text: str
    attack_objective: Optional[str] = None
    expected_behavior: Optional[str] = None
    model_output: Optional[str] = None
    verdict: str
    evaluation_explanation: Optional[str] = None
    secret_disclosed: bool = False
    is_adversarial: bool = True
    severity: Optional[str] = None
    execution_time_ms: Optional[int] = None
    created_at: str
    input_hash: Optional[str] = None


# ---------------------------------------------------------------------------
# Metrics models
# ---------------------------------------------------------------------------

class VersionMetrics(BaseModel):
    """Computed metrics for a single prompt version."""

    version: str
    total_tests: int
    attacks_blocked: int
    attacks_succeeded: int
    attack_success_rate: float
    policy_adherence_rate: float
    benign_pass_rate: float


class DashboardMetrics(BaseModel):
    """Aggregate metrics returned by the dashboard endpoint."""

    total_tests: int
    attack_attempts: int
    attacks_blocked: int
    attacks_succeeded: int
    attack_success_rate: float
    policy_adherence_rate: float
    benign_pass_rate: float
    version_metrics: dict[str, Any]
    recent_results: list[TestResult]


class ComparisonData(BaseModel):
    """Side-by-side metrics for all prompt versions."""

    versions: list[VersionMetrics]


# ---------------------------------------------------------------------------
# Composite response models
# ---------------------------------------------------------------------------

class BatchRunResponse(BaseModel):
    """Response from a batch experiment run."""

    results: list[TestResult]
    summary: dict[str, Any]


class CompareResponse(BaseModel):
    """Response from a prompt-comparison experiment."""

    results: dict[str, list[TestResult]]
    comparison: ComparisonData
