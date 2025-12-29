"""Admin dashboard endpoints."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin.auth import get_current_admin
from app.api.v1.schemas.admin.dashboard import (
    BusinessKPIs,
    DashboardResponse,
    SubscriptionsByTier,
    TechnicalKPIs,
)
from app.db.session import get_db
from app.models.admin import Admin
from app.services.admin.kpi_service import KPIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin-dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> DashboardResponse:
    """Get admin dashboard KPIs.

    Returns business metrics (MRR, ARR, users, subscriptions) and
    technical metrics (queries, SMS, LLM costs, storage, response times).

    Requires admin authentication.
    """
    kpi_service = KPIService()
    kpis = await kpi_service.get_dashboard_kpis(db)

    # Transform the response to match schema
    business_data = kpis["business"]
    technical_data = kpis["technical"]

    return DashboardResponse(
        business=BusinessKPIs(
            mrr=business_data["mrr"],
            arr=business_data["arr"],
            arpu=business_data["arpu"],
            total_users=business_data["total_users"],
            new_users_month=business_data["new_users_month"],
            new_users_week=business_data["new_users_week"],
            subscriptions_by_tier=SubscriptionsByTier(
                **business_data["subscriptions_by_tier"]
            ),
        ),
        technical=TechnicalKPIs(
            queries_today=technical_data["queries_today"],
            sms_sent_today=technical_data["sms_sent_today"],
            queries_month=technical_data["queries_month"],
            llm_costs_today=technical_data["llm_costs_today"],
            llm_costs_month=technical_data["llm_costs_month"],
            avg_response_time_ms=technical_data["avg_response_time_ms"],
            total_storage_mb=technical_data["total_storage_mb"],
            total_documents=technical_data["total_documents"],
        ),
        generated_at=kpis["generated_at"],
    )
