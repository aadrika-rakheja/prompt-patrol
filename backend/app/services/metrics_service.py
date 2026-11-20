"""
Metrics service: aggregates and calculates metrics from stored test results in SQLite.
Computes real statistics without fabricating data.
"""

from __future__ import annotations

from typing import Any
from app.database import get_all_results
from app.models.schemas import ComparisonData, DashboardMetrics, TestResult, VersionMetrics


async def get_dashboard_metrics() -> DashboardMetrics:
    """Compute aggregate dashboard metrics from actual saved database results."""
    raw_results = await get_all_results()
    
    total_tests = len(raw_results)
    if total_tests == 0:
        return DashboardMetrics(
            total_tests=0,
            attack_attempts=0,
            attacks_blocked=0,
            attacks_succeeded=0,
            attack_success_rate=0.0,
            policy_adherence_rate=0.0,
            benign_pass_rate=0.0,
            version_metrics={},
            recent_results=[],
        )

    attack_attempts = sum(1 for r in raw_results if r.get("is_adversarial"))
    attacks_blocked = sum(1 for r in raw_results if r.get("is_adversarial") and r.get("verdict") == "blocked")
    attacks_succeeded = sum(1 for r in raw_results if r.get("is_adversarial") and r.get("verdict") == "succeeded")

    asr = (attacks_succeeded / attack_attempts * 100.0) if attack_attempts > 0 else 0.0
    par = (attacks_blocked / attack_attempts * 100.0) if attack_attempts > 0 else 0.0

    benign_total = sum(1 for r in raw_results if not r.get("is_adversarial"))
    benign_passed = sum(1 for r in raw_results if not r.get("is_adversarial") and r.get("verdict") == "benign_pass")
    bpr = (benign_passed / benign_total * 100.0) if benign_total > 0 else 0.0

    # Per-version breakdown
    versions = sorted(list({r.get("prompt_version") for r in raw_results if r.get("prompt_version")}))
    version_metrics: dict[str, Any] = {}

    for v in versions:
        v_rows = [r for r in raw_results if r.get("prompt_version") == v]
        v_total = len(v_rows)
        v_attacks = sum(1 for r in v_rows if r.get("is_adversarial"))
        v_blocked = sum(1 for r in v_rows if r.get("is_adversarial") and r.get("verdict") == "blocked")
        v_succeeded = sum(1 for r in v_rows if r.get("is_adversarial") and r.get("verdict") == "succeeded")
        v_asr = (v_succeeded / v_attacks * 100.0) if v_attacks > 0 else 0.0
        v_par = (v_blocked / v_attacks * 100.0) if v_attacks > 0 else 0.0

        v_benign_tot = sum(1 for r in v_rows if not r.get("is_adversarial"))
        v_benign_pass = sum(1 for r in v_rows if not r.get("is_adversarial") and r.get("verdict") == "benign_pass")
        v_bpr = (v_benign_pass / v_benign_tot * 100.0) if v_benign_tot > 0 else 0.0

        version_metrics[v] = VersionMetrics(
            version=v,
            total_tests=v_total,
            attacks_blocked=v_blocked,
            attacks_succeeded=v_succeeded,
            attack_success_rate=round(v_asr, 1),
            policy_adherence_rate=round(v_par, 1),
            benign_pass_rate=round(v_bpr, 1),
        ).model_dump()

    # Recent 10 results
    recent_records = [
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
        for r in raw_results[:10]
    ]

    return DashboardMetrics(
        total_tests=total_tests,
        attack_attempts=attack_attempts,
        attacks_blocked=attacks_blocked,
        attacks_succeeded=attacks_succeeded,
        attack_success_rate=round(asr, 1),
        policy_adherence_rate=round(par, 1),
        benign_pass_rate=round(bpr, 1),
        version_metrics=version_metrics,
        recent_results=recent_records,
    )


async def get_version_comparison() -> ComparisonData:
    """Compute comparison metrics across all known versions (v1, v2, v3)."""
    raw_results = await get_all_results()
    all_versions = ["v1", "v2", "v3"]
    metrics_list: list[VersionMetrics] = []

    for v in all_versions:
        v_rows = [r for r in raw_results if r.get("prompt_version") == v]
        v_total = len(v_rows)
        v_attacks = sum(1 for r in v_rows if r.get("is_adversarial"))
        v_blocked = sum(1 for r in v_rows if r.get("is_adversarial") and r.get("verdict") == "blocked")
        v_succeeded = sum(1 for r in v_rows if r.get("is_adversarial") and r.get("verdict") == "succeeded")
        v_asr = (v_succeeded / v_attacks * 100.0) if v_attacks > 0 else 0.0
        v_par = (v_blocked / v_attacks * 100.0) if v_attacks > 0 else 0.0

        v_benign_tot = sum(1 for r in v_rows if not r.get("is_adversarial"))
        v_benign_pass = sum(1 for r in v_rows if not r.get("is_adversarial") and r.get("verdict") == "benign_pass")
        v_bpr = (v_benign_pass / v_benign_tot * 100.0) if v_benign_tot > 0 else 0.0

        metrics_list.append(
            VersionMetrics(
                version=v.upper(),
                total_tests=v_total,
                attacks_blocked=v_blocked,
                attacks_succeeded=v_succeeded,
                attack_success_rate=round(v_asr, 1),
                policy_adherence_rate=round(v_par, 1),
                benign_pass_rate=round(v_bpr, 1),
            )
        )

    return ComparisonData(versions=metrics_list)
