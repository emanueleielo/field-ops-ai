"""Scheduled task for daily quota reset.

This task should be run daily at midnight via a cron job or scheduler.
It resets quotas for organizations whose billing_day matches today.
"""

import logging

from app.db.session import get_async_session_factory
from app.services.quota import QuotaService

logger = logging.getLogger(__name__)


async def reset_quotas_for_today() -> int:
    """Reset quotas for all organizations whose billing day is today.

    This function:
    1. Finds all organizations where billing_day = today's day of month
    2. Resets quota_used_euro to 0 for each organization
    3. Clears quota_notifications for each organization

    Returns:
        Number of organizations whose quotas were reset.
    """
    session_factory = get_async_session_factory()

    async with session_factory() as session:
        try:
            quota_service = QuotaService(session)

            # Get organizations that need reset today
            org_ids = await quota_service.get_organizations_for_reset()

            if not org_ids:
                logger.info("No organizations need quota reset today")
                return 0

            logger.info(
                "Found %d organizations needing quota reset today",
                len(org_ids),
            )

            # Reset quota for each organization
            reset_count = 0
            for org_id in org_ids:
                try:
                    await quota_service.reset_quota(org_id)
                    reset_count += 1
                except Exception as e:
                    logger.exception(
                        "Failed to reset quota for org=%s: %s",
                        org_id,
                        e,
                    )

            await session.commit()

            logger.info(
                "Successfully reset quotas for %d/%d organizations",
                reset_count,
                len(org_ids),
            )

            return reset_count

        except Exception as e:
            await session.rollback()
            logger.exception("Failed to run quota reset task: %s", e)
            raise


async def run_quota_reset_job() -> None:
    """Entry point for running the quota reset job.

    This function can be called by a scheduler like APScheduler or a cron job.
    """
    logger.info("Starting daily quota reset job")

    try:
        reset_count = await reset_quotas_for_today()
        logger.info(
            "Quota reset job completed: %d organizations reset",
            reset_count,
        )
    except Exception:
        logger.exception("Quota reset job failed")
        raise
