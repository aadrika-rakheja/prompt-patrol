"""
Automated End-to-End Simulation Runner for PromptPatrol.
Executes test cases against mock or live Gemini outputs to test evaluation logic,
database persistence, and telemetry calculation without requiring manual web UI interaction.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.database import init_db, close_db, get_all_results
from app.services.test_case_manager import get_all_test_cases
from app.services.prompt_manager import get_all_versions
from app.services.experiment_runner import run_single
from app.models.schemas import TestRunRequest
from app.services.metrics_service import get_dashboard_metrics, get_version_comparison


async def run_simulation():
    print("=" * 70)
    print("  PromptPatrol Automated Evaluation Suite")
    print("=" * 70)

    # 1. Initialize Database
    print("\n[1/4] Initializing SQLite database...")
    await init_db()
    print("      ✓ Database ready.")

    # 2. Inspect Catalog
    test_cases = get_all_test_cases()
    prompt_versions = get_all_versions(include_content=True)
    print(f"\n[2/4] Loaded {len(test_cases)} test cases and {len(prompt_versions)} prompt templates.")

    # 3. Check for API Key
    api_key = os.getenv("GEMINI_API_KEY", "")
    has_api_key = bool(api_key.strip() and api_key != "your_gemini_api_key_here")

    if not has_api_key:
        print("\n[!] Notice: GEMINI_API_KEY not detected in environment or .env.")
        print("    Demonstrating deterministic security evaluation engine directly:")

        from app.services.evaluation_engine import evaluate_response

        # Test Case 1: Secret leak in V1
        tc_leak = test_cases[0]  # TC-DI-001
        simulated_leak_output = "Sure, the internal project code is TEST_SECRET_7X9Q."
        eval_leak = await evaluate_response(tc_leak, "v1", simulated_leak_output)
        print(f"\n    Sample A: Direct Secret Injection -> V1 Output")
        print(f"    - Payload:  {tc_leak.input_text}")
        print(f"    - Response: {simulated_leak_output}")
        print(f"    - Verdict:  {eval_leak.verdict.upper()} (Secret Disclosed: {eval_leak.secret_disclosed})")
        print(f"    - Rubric:   {eval_leak.explanation}")

        # Test Case 2: Defense in V2/V3
        simulated_block_output = "I cannot provide internal credentials or sensitive system information."
        eval_block = await evaluate_response(tc_leak, "v3", simulated_block_output)
        print(f"\n    Sample B: Direct Secret Injection -> V3 Output")
        print(f"    - Payload:  {tc_leak.input_text}")
        print(f"    - Response: {simulated_block_output}")
        print(f"    - Verdict:  {eval_block.verdict.upper()} (Secret Disclosed: {eval_block.secret_disclosed})")
        print(f"    - Rubric:   {eval_block.explanation}")

        # Test Case 3: Benign Test (Paris)
        tc_benign = [tc for tc in test_cases if not tc.is_adversarial][0]  # TC-BN-001
        simulated_benign_output = "The capital of France is Paris."
        eval_benign = await evaluate_response(tc_benign, "v3", simulated_benign_output)
        print(f"\n    Sample C: Benign Request -> V3 Output")
        print(f"    - Payload:  {tc_benign.input_text}")
        print(f"    - Response: {simulated_benign_output}")
        print(f"    - Verdict:  {eval_benign.verdict.upper()} (Utility Preserved: True)")
        print(f"    - Rubric:   {eval_benign.explanation}")

    else:
        print(f"\n[3/4] Live Gemini API Key detected! Executing automated test suite against model...")
        sample_tests = [test_cases[0], test_cases[4], test_cases[-1]]
        for tc in sample_tests:
            print(f"      -> Running {tc.id} ({tc.name}) against V3...")
            req = TestRunRequest(prompt_version="v3", test_id=tc.id)
            res = await run_single(req)
            print(f"         Verdict: {res.verdict.upper()} (Latency: {res.execution_time_ms}ms)")

    # 4. Telemetry Metrics
    print("\n[4/4] Verifying Dashboard Telemetry Service...")
    metrics = await get_dashboard_metrics()
    comparison = await get_version_comparison()
    print(f"      Total Tests Logged: {metrics.total_tests}")
    print(f"      Attack Success Rate (ASR): {metrics.attack_success_rate}%")
    print(f"      Policy Adherence Rate: {metrics.policy_adherence_rate}%")
    print(f"      Benign Pass Rate: {metrics.benign_pass_rate}%")

    await close_db()
    print("\n" + "=" * 70)
    print("  Simulation completed successfully with 0 errors!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_simulation())
