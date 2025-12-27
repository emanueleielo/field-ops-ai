# FieldOps AI - Backend API

FastAPI backend for FieldOps AI SMS assistant.

## Tech Stack

- Python 3.13 with uv
- FastAPI + Pydantic v2
- SQLAlchemy + Alembic
- Supabase Postgres
- Qdrant Cloud (vector store)
- LangChain with create_agent

## Setup

```bash
cd api

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# Run development server
uv run fastapi dev src/main.py
```

## Project Structure

```
src/
├── api/           # FastAPI routes
├── core/          # Config, security, dependencies
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas
├── services/      # Business logic
├── agent/         # LangChain agent & tools
└── main.py        # Application entry point
```

## Documentation

See `../project.md` for complete specifications.
