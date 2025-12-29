"""Conversation memory service for managing SMS conversation history."""

import contextlib
import logging
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import ConversationState

logger = logging.getLogger(__name__)

# Maximum number of messages to keep in conversation history
MAX_CONVERSATION_MESSAGES = 5


class ConversationMessage:
    """A single message in a conversation."""

    def __init__(
        self,
        role: str,
        content: str,
        timestamp: datetime | None = None,
    ) -> None:
        """Initialize a conversation message.

        Args:
            role: The role of the message sender ('user' or 'assistant').
            content: The message content.
            timestamp: Optional timestamp for the message.
        """
        self.role = role
        self.content = content
        self.timestamp = timestamp or datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """Convert message to dictionary for storage."""
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConversationMessage":
        """Create message from dictionary.

        Args:
            data: Dictionary with role, content, and optional timestamp.

        Returns:
            ConversationMessage instance.
        """
        timestamp = None
        if data.get("timestamp"):
            with contextlib.suppress(ValueError, TypeError):
                timestamp = datetime.fromisoformat(data["timestamp"])

        return cls(
            role=data.get("role", "user"),
            content=data.get("content", ""),
            timestamp=timestamp,
        )


class ConversationService:
    """Service for managing conversation memory."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the conversation service.

        Args:
            db: The database session.
        """
        self.db = db

    async def get_history(
        self,
        phone_number: str,
        limit: int = MAX_CONVERSATION_MESSAGES,
    ) -> list[dict[str, str]]:
        """Get conversation history for a phone number.

        Args:
            phone_number: The phone number to get history for.
            limit: Maximum number of messages to return.

        Returns:
            List of message dictionaries with 'role' and 'content' keys.
        """
        try:
            result = await self.db.execute(
                select(ConversationState).where(
                    ConversationState.phone_number == phone_number
                )
            )
            state = result.scalar_one_or_none()

            if not state or not state.messages_json:
                return []

            # Get the last N messages
            messages = state.messages_json[-limit:]

            # Return simplified format for agent
            return [
                {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                for msg in messages
            ]

        except Exception as e:
            logger.exception("Failed to get conversation history: %s", e)
            return []

    async def add_message(
        self,
        phone_number: str,
        organization_id: UUID,
        role: str,
        content: str,
    ) -> None:
        """Add a message to the conversation history.

        Args:
            phone_number: The phone number for this conversation.
            organization_id: The organization ID.
            role: The message role ('user' or 'assistant').
            content: The message content.
        """
        try:
            result = await self.db.execute(
                select(ConversationState).where(
                    ConversationState.phone_number == phone_number
                )
            )
            state = result.scalar_one_or_none()

            new_message = ConversationMessage(role=role, content=content)
            message_dict = new_message.to_dict()

            if state:
                # Update existing conversation
                messages = list(state.messages_json) if state.messages_json else []
                messages.append(message_dict)

                # Keep only the last N messages
                if len(messages) > MAX_CONVERSATION_MESSAGES:
                    messages = messages[-MAX_CONVERSATION_MESSAGES:]

                state.messages_json = messages
                state.organization_id = organization_id

            else:
                # Create new conversation state
                state = ConversationState(
                    id=uuid4(),
                    phone_number=phone_number,
                    organization_id=organization_id,
                    messages_json=[message_dict],
                )
                self.db.add(state)

            await self.db.flush()

        except Exception as e:
            logger.exception("Failed to add message to conversation: %s", e)
            raise

    async def add_exchange(
        self,
        phone_number: str,
        organization_id: UUID,
        user_message: str,
        assistant_message: str,
    ) -> None:
        """Add a user-assistant message exchange to history.

        This is a convenience method to add both messages at once.

        Args:
            phone_number: The phone number for this conversation.
            organization_id: The organization ID.
            user_message: The user's message.
            assistant_message: The assistant's response.
        """
        await self.add_message(phone_number, organization_id, "user", user_message)
        await self.add_message(
            phone_number, organization_id, "assistant", assistant_message
        )

    async def clear_history(self, phone_number: str) -> None:
        """Clear conversation history for a phone number.

        Args:
            phone_number: The phone number to clear history for.
        """
        try:
            result = await self.db.execute(
                select(ConversationState).where(
                    ConversationState.phone_number == phone_number
                )
            )
            state = result.scalar_one_or_none()

            if state:
                state.messages_json = []
                await self.db.flush()

        except Exception as e:
            logger.exception("Failed to clear conversation history: %s", e)
            raise

    async def delete_conversation(self, phone_number: str) -> bool:
        """Delete a conversation state entirely.

        Args:
            phone_number: The phone number to delete conversation for.

        Returns:
            True if deleted, False if not found.
        """
        try:
            result = await self.db.execute(
                select(ConversationState).where(
                    ConversationState.phone_number == phone_number
                )
            )
            state = result.scalar_one_or_none()

            if state:
                await self.db.delete(state)
                await self.db.flush()
                return True

            return False

        except Exception as e:
            logger.exception("Failed to delete conversation: %s", e)
            raise

    async def get_or_create_state(
        self,
        phone_number: str,
        organization_id: UUID,
    ) -> ConversationState:
        """Get existing conversation state or create a new one.

        Args:
            phone_number: The phone number for this conversation.
            organization_id: The organization ID.

        Returns:
            The ConversationState instance.
        """
        result = await self.db.execute(
            select(ConversationState).where(
                ConversationState.phone_number == phone_number
            )
        )
        state = result.scalar_one_or_none()

        if not state:
            state = ConversationState(
                id=uuid4(),
                phone_number=phone_number,
                organization_id=organization_id,
                messages_json=[],
            )
            self.db.add(state)
            await self.db.flush()

        return state

    async def clear_old_messages(self) -> int:
        """Trim all conversation histories to keep only the last N messages.

        This method iterates through all conversation states and trims
        messages that exceed MAX_CONVERSATION_MESSAGES.

        Returns:
            Number of conversation states that were trimmed.
        """
        try:
            result = await self.db.execute(select(ConversationState))
            states = result.scalars().all()

            trimmed_count = 0

            for state in states:
                messages = state.messages_json
                if messages and len(messages) > MAX_CONVERSATION_MESSAGES:
                    state.messages_json = messages[-MAX_CONVERSATION_MESSAGES:]
                    trimmed_count += 1

            if trimmed_count > 0:
                await self.db.flush()
                logger.info(
                    "Trimmed %d conversation states to %d messages each",
                    trimmed_count,
                    MAX_CONVERSATION_MESSAGES,
                )

            return trimmed_count

        except Exception as e:
            logger.exception("Failed to clear old messages: %s", e)
            raise
