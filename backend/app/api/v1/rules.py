"""Safety Rule Configuration Endpoints.

Phase 6 Scope: View and create configurable threshold and multi-parameter correlation rules.
No numerical safety limits are hardcoded.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db_session
from backend.app.models.rule import MultiParameterRule, ThresholdRule
from backend.app.schemas.rule import (
    MultiParameterRuleCreate,
    MultiParameterRuleResponse,
    ThresholdRuleCreate,
    ThresholdRuleResponse,
)

router = APIRouter(prefix="/rules", tags=["Safety Rules"])


@router.get(
    "/thresholds",
    response_model=List[ThresholdRuleResponse],
    summary="List configured threshold rules",
)
async def list_threshold_rules(
    session: AsyncSession = Depends(get_db_session),
) -> List[ThresholdRuleResponse]:
    """Retrieve all configured threshold rules."""
    stmt = select(ThresholdRule)
    res = await session.execute(stmt)
    return list(res.scalars().all())


@router.post(
    "/thresholds",
    response_model=ThresholdRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a configurable threshold rule",
)
async def create_threshold_rule(
    payload: ThresholdRuleCreate,
    session: AsyncSession = Depends(get_db_session),
) -> ThresholdRuleResponse:
    """Register a new sensor threshold rule."""
    rule = ThresholdRule(
        name=payload.name,
        sensor_type=payload.sensor_type,
        operator=payload.operator,
        threshold_value=payload.threshold_value,
        severity=payload.severity,
        is_active=payload.is_active,
        description=payload.description,
    )
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.get(
    "/correlations",
    response_model=List[MultiParameterRuleResponse],
    summary="List configured multi-parameter correlation rules",
)
async def list_correlation_rules(
    session: AsyncSession = Depends(get_db_session),
) -> List[MultiParameterRuleResponse]:
    """Retrieve all configured multi-parameter correlation rules."""
    stmt = select(MultiParameterRule)
    res = await session.execute(stmt)
    return list(res.scalars().all())


@router.post(
    "/correlations",
    response_model=MultiParameterRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a multi-parameter correlation rule",
)
async def create_correlation_rule(
    payload: MultiParameterRuleCreate,
    session: AsyncSession = Depends(get_db_session),
) -> MultiParameterRuleResponse:
    """Register a new multi-parameter joint condition rule."""
    rule = MultiParameterRule(
        name=payload.name,
        conditions=[c.model_dump() for c in payload.conditions],
        severity=payload.severity,
        is_active=payload.is_active,
        description=payload.description,
    )
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule
