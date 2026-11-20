"""Metrics and dashboard statistical endpoints."""

from fastapi import APIRouter
from app.models.schemas import ComparisonData, DashboardMetrics
from app.services.metrics_service import get_dashboard_metrics, get_version_comparison

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/dashboard", response_model=DashboardMetrics)
async def dashboard_metrics():
    """Retrieve aggregate security testing metrics calculated from actual test runs."""
    return await get_dashboard_metrics()


@router.get("/comparison", response_model=ComparisonData)
async def comparison_metrics():
    """Retrieve comparative metrics across V1, V2, and V3."""
    return await get_version_comparison()
