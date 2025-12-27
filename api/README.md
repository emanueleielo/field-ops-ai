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
uv run uvicorn app.main:app --reload
```

## Project Structure

```
app/
├── __init__.py
├── main.py              # Application entry point
├── config.py            # Settings (pydantic-settings)
├── api/
│   ├── v1/
│   │   ├── router.py
│   │   ├── endpoints/   # FastAPI routes
│   │   └── schemas/     # Pydantic schemas
│   └── webhooks/        # Twilio, Stripe webhooks
├── core/
│   ├── security.py
│   └── exceptions.py
├── db/
│   ├── base.py
│   └── session.py
├── models/              # SQLAlchemy models
├── services/            # Business logic
│   └── tools/           # LangChain agent tools
└── utils/
```

## Documentation

See `../project.md` for complete specifications.
See `../tasks.md` for implementation tasks (start with TASK-01).
