"""RAG Agent service for answering technical questions."""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.prompts.rag_system import RAG_SYSTEM_PROMPT
from app.services.llm import LLMModel, LLMService, calculate_cost_euro
from app.services.tools import (
    GetDocumentSectionTool,
    GrepDocumentsTool,
    KeywordSearchTool,
    SemanticSearchTool,
)

logger = logging.getLogger(__name__)

# Agent timeout in seconds (6 minutes as per spec)
AGENT_TIMEOUT_SECONDS = 360

# Fallback message when no information is found
FALLBACK_MESSAGE = "Info not found. Try rephrasing or contact technical support."


@dataclass
class AgentResponse:
    """Response from the RAG agent."""

    answer: str
    model_used: str
    tokens_input: int
    tokens_output: int
    cost_euro: float
    tools_used: list[str]
    success: bool
    fallback_used: bool
    error: str | None = None


class RAGAgentError(Exception):
    """Exception raised for RAG agent errors."""


class RAGAgent:
    """ReAct agent for answering technical questions using RAG tools."""

    def __init__(self, org_id: UUID) -> None:
        """Initialize the RAG agent for an organization.

        Args:
            org_id: The organization ID to scope tools to.
        """
        self.org_id = org_id
        self._llm_service = LLMService()
        self._executor: AgentExecutor | None = None
        self._current_model: LLMModel | None = None

    def _create_tools(self) -> list[Any]:
        """Create the RAG tools for this agent.

        Returns:
            List of LangChain tools.
        """
        return [
            SemanticSearchTool(org_id=self.org_id),
            KeywordSearchTool(org_id=self.org_id),
            GrepDocumentsTool(org_id=self.org_id),
            GetDocumentSectionTool(org_id=self.org_id),
        ]

    def _create_prompt(self) -> ChatPromptTemplate:
        """Create the agent prompt template.

        Returns:
            ChatPromptTemplate for the agent.
        """
        return ChatPromptTemplate.from_messages([
            ("system", RAG_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

    def create_agent(self) -> AgentExecutor:
        """Create the agent executor with tools.

        Returns:
            Configured AgentExecutor instance.
        """
        # Get LLM with fallback chain
        llm_result = self._llm_service.get_llm()
        self._current_model = llm_result.model

        logger.info(
            "Creating agent with LLM: %s (fallback: %s)",
            llm_result.model.display_name,
            llm_result.fallback_used,
        )

        # Create tools
        tools = self._create_tools()

        # Create prompt
        prompt = self._create_prompt()

        # Create the agent
        agent = create_tool_calling_agent(
            llm=llm_result.llm,
            tools=tools,
            prompt=prompt,
        )

        # Create executor with timeout handling
        self._executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=10,
            handle_parsing_errors=True,
            return_intermediate_steps=True,
        )

        return self._executor

    def _format_chat_history(
        self,
        conversation_history: list[dict[str, str]],
    ) -> list[HumanMessage | AIMessage]:
        """Format conversation history for the agent.

        Args:
            conversation_history: List of message dicts with 'role' and 'content'.

        Returns:
            List of LangChain message objects.
        """
        messages: list[HumanMessage | AIMessage] = []

        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        return messages

    def _extract_tools_used(
        self,
        intermediate_steps: list[tuple[Any, str]],
    ) -> list[str]:
        """Extract tool names from intermediate steps.

        Args:
            intermediate_steps: List of (action, output) tuples.

        Returns:
            List of unique tool names used.
        """
        tools_used = set()

        for action, _ in intermediate_steps:
            if hasattr(action, "tool"):
                tools_used.add(action.tool)

        return list(tools_used)

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text (rough approximation).

        Args:
            text: The text to estimate tokens for.

        Returns:
            Estimated token count.
        """
        # Rough estimate: ~4 characters per token for English
        return len(text) // 4

    async def invoke(
        self,
        query: str,
        conversation_history: list[dict[str, str]] | None = None,
    ) -> AgentResponse:
        """Execute a query using the RAG agent.

        Args:
            query: The user's question.
            conversation_history: Optional list of previous messages.

        Returns:
            AgentResponse with the answer and metadata.
        """
        logger.info("Processing query for org=%s: %s", self.org_id, query[:100])

        # Ensure agent is created
        if self._executor is None:
            self.create_agent()

        if self._executor is None or self._current_model is None:
            return AgentResponse(
                answer=FALLBACK_MESSAGE,
                model_used="none",
                tokens_input=0,
                tokens_output=0,
                cost_euro=0.0,
                tools_used=[],
                success=False,
                fallback_used=False,
                error="Agent not initialized",
            )

        # Format conversation history
        chat_history = []
        if conversation_history:
            chat_history = self._format_chat_history(conversation_history)

        try:
            # Run agent with timeout
            result = await asyncio.wait_for(
                self._executor.ainvoke({
                    "input": query,
                    "chat_history": chat_history,
                }),
                timeout=AGENT_TIMEOUT_SECONDS,
            )

            # Extract answer
            answer = result.get("output", FALLBACK_MESSAGE)
            intermediate_steps = result.get("intermediate_steps", [])
            tools_used = self._extract_tools_used(intermediate_steps)

            # Estimate tokens
            tokens_input = self._estimate_tokens(query)
            if conversation_history:
                for msg in conversation_history:
                    tokens_input += self._estimate_tokens(msg.get("content", ""))
            tokens_output = self._estimate_tokens(answer)

            # Calculate cost
            cost_euro = calculate_cost_euro(
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                model=self._current_model,
            )

            # Determine if this was a fallback response
            is_fallback = (
                answer == FALLBACK_MESSAGE
                or "not found" in answer.lower()
                or "no information" in answer.lower()
            )

            logger.info(
                "Query completed: model=%s, tools=%s, success=%s, cost=%.4f EUR",
                self._current_model.display_name,
                tools_used,
                not is_fallback,
                cost_euro,
            )

            return AgentResponse(
                answer=answer,
                model_used=self._current_model.display_name,
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                cost_euro=cost_euro,
                tools_used=tools_used,
                success=not is_fallback,
                fallback_used=is_fallback,
            )

        except TimeoutError:
            logger.warning("Agent timed out after %d seconds", AGENT_TIMEOUT_SECONDS)
            return AgentResponse(
                answer="Timeout. Try again in a few minutes.",
                model_used=self._current_model.display_name,
                tokens_input=self._estimate_tokens(query),
                tokens_output=0,
                cost_euro=0.0,
                tools_used=[],
                success=False,
                fallback_used=True,
                error="Timeout",
            )

        except Exception as e:
            logger.exception("Agent error: %s", e)
            return AgentResponse(
                answer=FALLBACK_MESSAGE,
                model_used=self._current_model.display_name if self._current_model else "none",
                tokens_input=self._estimate_tokens(query),
                tokens_output=0,
                cost_euro=0.0,
                tools_used=[],
                success=False,
                fallback_used=True,
                error=str(e),
            )


async def create_and_invoke_agent(
    org_id: UUID,
    query: str,
    conversation_history: list[dict[str, str]] | None = None,
) -> AgentResponse:
    """Convenience function to create an agent and invoke a query.

    Args:
        org_id: The organization ID.
        query: The user's question.
        conversation_history: Optional conversation history.

    Returns:
        AgentResponse with the answer and metadata.
    """
    agent = RAGAgent(org_id=org_id)
    return await agent.invoke(query, conversation_history)
