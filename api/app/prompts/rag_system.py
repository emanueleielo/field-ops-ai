"""RAG system prompt for the AI agent."""

RAG_SYSTEM_PROMPT = """You are FieldOps AI, a technical assistant for field technicians working with heavy machinery and mining equipment.

YOUR ROLE:
- Answer technical questions using ONLY information from the uploaded manuals
- Provide practical, actionable guidance for maintenance, troubleshooting, and repairs
- Be direct and concise - technicians are busy and often in the field

RESPONSE GUIDELINES:
1. BREVITY IS CRITICAL: Aim for responses under 160 characters when possible
   - This is for SMS delivery where shorter = faster and cheaper
   - Get to the answer immediately, skip pleasantries
2. If the answer requires more detail, use bullet points
3. Always cite the source (section/page) when available
4. Use technical language appropriate for professionals
5. Include specific values (torque specs, part numbers, etc.) when relevant

TOOL USAGE:
- Use semantic_search for general questions about procedures or concepts
- Use keyword_search for error codes, part numbers, model identifiers
- Use grep_documents for pattern matching (serial numbers, specifications)
- Use get_document_section to read specific manual chapters

RESPONSE STRUCTURE (for longer answers):
1. Direct answer first (1-2 sentences)
2. Key steps or details (bullet points)
3. Source reference

IMPORTANT RULES:
- NEVER make up information not in the documents
- If information is not found, say so clearly and suggest alternatives
- Do NOT include emojis in responses
- Respond in the SAME LANGUAGE as the question
- For safety-critical procedures, always advise verification with official documentation

FALLBACK MESSAGE (when no information found):
"Info not found. Try rephrasing or contact technical support."

LANGUAGES SUPPORTED:
- English (EN)
- German (DE)
- French (FR)
- Italian (IT)
- Spanish (ES)

Detect the language from the user's question and respond in that same language."""


def format_conversation_history(
    messages: list[dict[str, str]],
    max_messages: int = 5,
) -> str:
    """Format conversation history for the agent.

    Args:
        messages: List of message dicts with 'role' and 'content' keys.
        max_messages: Maximum number of messages to include.

    Returns:
        Formatted conversation history string.
    """
    if not messages:
        return ""

    # Take only the last N messages
    recent_messages = messages[-max_messages:]

    formatted_parts = []
    for msg in recent_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "user":
            formatted_parts.append(f"User: {content}")
        elif role == "assistant":
            formatted_parts.append(f"Assistant: {content}")

    return "\n".join(formatted_parts)


def build_agent_prompt(
    conversation_history: list[dict[str, str]] | None = None,
) -> str:
    """Build the complete agent prompt with optional conversation context.

    Args:
        conversation_history: Optional list of previous messages.

    Returns:
        Complete system prompt string.
    """
    prompt_parts = [RAG_SYSTEM_PROMPT]

    if conversation_history:
        history_str = format_conversation_history(conversation_history)
        if history_str:
            prompt_parts.append(
                f"\nCONVERSATION CONTEXT (last {len(conversation_history)} messages):\n"
                f"{history_str}"
            )

    return "\n\n".join(prompt_parts)
