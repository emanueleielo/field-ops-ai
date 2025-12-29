"""Admin configuration management endpoints."""

import logging
from decimal import Decimal
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.admin.auth import get_current_admin
from app.api.v1.schemas.admin.config import (
    SystemSettingsResponse,
    SystemSettingsUpdate,
    TierConfigListResponse,
    TierConfigResponse,
    TierConfigUpdate,
)
from app.db.session import get_db
from app.models.admin import Admin
from app.models.enums import TierEnum
from app.models.system_settings import SystemSettings
from app.models.tier_config import TierConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/config", tags=["admin-config"])

# Default system settings
DEFAULT_SETTINGS: dict[str, Any] = {
    "burst_limit": 50,
    "sms_templates": {
        "welcome_en": "Welcome to FieldOps AI! Send any question about your technical manuals.",
        "welcome_it": "Benvenuto in FieldOps AI! Invia qualsiasi domanda sui tuoi manuali tecnici.",
        "quota_warning_90": "Warning: You have used 90% of your monthly quota.",
        "quota_warning_100": "Warning: You have reached your monthly quota limit.",
        "quota_blocked": "Your quota has been exceeded. Please upgrade your plan.",
    },
    "welcome_sms_enabled": True,
    "default_language": "en",
    "max_conversation_history": 5,
    "llm_timeout_seconds": 360,
    "rate_limit_enabled": True,
}


@router.get("/tiers", response_model=TierConfigListResponse)
async def get_tier_configs(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> TierConfigListResponse:
    """Get all tier configurations.

    Returns the current configuration for all tiers including pricing and limits.
    Requires admin authentication.
    """
    result = await db.execute(select(TierConfig).order_by(TierConfig.tier))
    configs = list(result.scalars().all())

    # If no configs exist, create default ones
    if not configs:
        configs = await _create_default_tier_configs(db)

    tier_responses = [
        TierConfigResponse(
            tier=config.tier,
            name=config.name,
            monthly_price=float(config.monthly_price),
            yearly_price=float(config.yearly_price),
            quota_limit_euro=float(config.quota_limit_euro),
            storage_limit_mb=config.storage_limit_mb,
            max_phone_numbers=config.max_phone_numbers,
            max_file_size_mb=config.max_file_size_mb,
            max_pdf_pages=config.max_pdf_pages,
            is_active=config.is_active,
        )
        for config in configs
    ]

    return TierConfigListResponse(tiers=tier_responses)


@router.put("/tiers/{tier}", response_model=TierConfigResponse)
async def update_tier_config(
    tier: TierEnum,
    update: TierConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> TierConfigResponse:
    """Update a tier configuration.

    Updates pricing and/or limits for a specific tier.
    Changes affect new subscriptions; existing ones retain original terms until renewal.
    Requires admin authentication.
    """
    result = await db.execute(
        select(TierConfig).where(TierConfig.tier == tier)
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tier configuration not found for: {tier.value}",
        )

    # Update only provided fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(config, field, value)

    await db.commit()
    await db.refresh(config)

    logger.info(f"Admin updated tier config: {tier.value} with {update_data}")

    return TierConfigResponse(
        tier=config.tier,
        name=config.name,
        monthly_price=float(config.monthly_price),
        yearly_price=float(config.yearly_price),
        quota_limit_euro=float(config.quota_limit_euro),
        storage_limit_mb=config.storage_limit_mb,
        max_phone_numbers=config.max_phone_numbers,
        max_file_size_mb=config.max_file_size_mb,
        max_pdf_pages=config.max_pdf_pages,
        is_active=config.is_active,
    )


@router.get("/settings", response_model=SystemSettingsResponse)
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> SystemSettingsResponse:
    """Get system settings.

    Returns current system settings including burst limits, SMS templates, etc.
    Requires admin authentication.
    """
    settings_dict = await _get_all_settings(db)

    return SystemSettingsResponse(
        burst_limit=settings_dict.get("burst_limit", DEFAULT_SETTINGS["burst_limit"]),
        sms_templates=settings_dict.get(
            "sms_templates", DEFAULT_SETTINGS["sms_templates"]
        ),
        welcome_sms_enabled=settings_dict.get(
            "welcome_sms_enabled", DEFAULT_SETTINGS["welcome_sms_enabled"]
        ),
        default_language=settings_dict.get(
            "default_language", DEFAULT_SETTINGS["default_language"]
        ),
        max_conversation_history=settings_dict.get(
            "max_conversation_history", DEFAULT_SETTINGS["max_conversation_history"]
        ),
        llm_timeout_seconds=settings_dict.get(
            "llm_timeout_seconds", DEFAULT_SETTINGS["llm_timeout_seconds"]
        ),
        rate_limit_enabled=settings_dict.get(
            "rate_limit_enabled", DEFAULT_SETTINGS["rate_limit_enabled"]
        ),
    )


@router.put("/settings", response_model=SystemSettingsResponse)
async def update_system_settings(
    update: SystemSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> SystemSettingsResponse:
    """Update system settings.

    Updates system configuration including burst limits, SMS templates, etc.
    Requires admin authentication.
    """
    update_data = update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            await _set_setting(db, key, value)

    logger.info(f"Admin updated system settings: {list(update_data.keys())}")

    # Return updated settings
    return await get_system_settings(db=db, _admin=_admin)


async def _get_all_settings(db: AsyncSession) -> dict[str, Any]:
    """Get all system settings as a dictionary.

    Args:
        db: Database session.

    Returns:
        Dictionary of all settings.
    """
    result = await db.execute(select(SystemSettings))
    settings = result.scalars().all()

    return {s.key: s.value for s in settings}


async def _get_setting(db: AsyncSession, key: str) -> Any:
    """Get a single system setting.

    Args:
        db: Database session.
        key: Setting key.

    Returns:
        Setting value or None if not found.
    """
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.key == key)
    )
    setting = result.scalar_one_or_none()

    if setting:
        return setting.value

    return DEFAULT_SETTINGS.get(key)


async def _set_setting(db: AsyncSession, key: str, value: Any) -> SystemSettings:
    """Set a system setting.

    Args:
        db: Database session.
        key: Setting key.
        value: Setting value.

    Returns:
        Updated or created setting.
    """
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.key == key)
    )
    setting = result.scalar_one_or_none()

    if setting:
        setting.value = value
    else:
        setting = SystemSettings(
            id=uuid4(),
            key=key,
            value=value,
            description=f"System setting: {key}",
        )
        db.add(setting)

    await db.commit()
    await db.refresh(setting)

    return setting


async def _create_default_tier_configs(db: AsyncSession) -> list[TierConfig]:
    """Create default tier configurations.

    Args:
        db: Database session.

    Returns:
        List of created tier configs.
    """
    default_configs = [
        TierConfig(
            id=uuid4(),
            tier=TierEnum.basic,
            name="Basic",
            monthly_price=Decimal("79.00"),
            yearly_price=Decimal("790.00"),
            quota_limit_euro=Decimal("15.00"),
            storage_limit_mb=50,
            max_phone_numbers=1,
            max_file_size_mb=10,
            max_pdf_pages=100,
            is_active=True,
        ),
        TierConfig(
            id=uuid4(),
            tier=TierEnum.professional,
            name="Professional",
            monthly_price=Decimal("149.00"),
            yearly_price=Decimal("1490.00"),
            quota_limit_euro=Decimal("35.00"),
            storage_limit_mb=200,
            max_phone_numbers=3,
            max_file_size_mb=25,
            max_pdf_pages=500,
            is_active=True,
        ),
        TierConfig(
            id=uuid4(),
            tier=TierEnum.enterprise,
            name="Enterprise",
            monthly_price=Decimal("399.00"),
            yearly_price=Decimal("3990.00"),
            quota_limit_euro=Decimal("80.00"),
            storage_limit_mb=None,  # Unlimited
            max_phone_numbers=10,
            max_file_size_mb=50,
            max_pdf_pages=1000,
            is_active=True,
        ),
    ]

    for config in default_configs:
        db.add(config)

    await db.commit()

    # Refresh all configs
    for config in default_configs:
        await db.refresh(config)

    logger.info("Created default tier configurations")

    return default_configs
