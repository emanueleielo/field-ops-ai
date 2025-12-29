"""Enum definitions for database models."""

from enum import Enum


class TierEnum(str, Enum):
    """Organization subscription tiers."""

    basic = "basic"
    professional = "professional"
    enterprise = "enterprise"


class DocumentStatusEnum(str, Enum):
    """Document processing status."""

    uploading = "uploading"
    processing = "processing"
    indexed = "indexed"
    failed = "failed"


class MessageDirectionEnum(str, Enum):
    """Message direction (inbound/outbound)."""

    inbound = "inbound"
    outbound = "outbound"
