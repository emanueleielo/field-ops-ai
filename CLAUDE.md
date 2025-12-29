# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldOps AI is an SMS-based AI assistant for field technicians in Heavy Machinery & Mining. Users send SMS questions and receive AI-powered answers from their uploaded technical manuals.

This is a **monorepo** containing:
- `/api` - FastAPI backend
- `/web` - Next.js frontend
- `project.md` - Complete specifications
- `tasks.md` - Development tasks

## Key Documentation

- `project.md` - Complete technical specifications, architecture, pricing, and business rules
- `tasks.md` - Sequential development tasks with acceptance criteria

## Code Standards

**Language**: ALL code, comments, docstrings, and commit messages must be in **English**.

**Commits**:
- Format: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **NO Claude Code signatures** (no "Generated with Claude Code", no "Co-Authored-By: Claude")

**Backend (`/api`)**:
- Python 3.13, FastAPI, SQLAlchemy, uv
- Linting: Ruff
- Type checking: mypy (strict)
- Naming: snake_case

**Frontend (`/web`)**:
- Next.js 14 (App Router), TypeScript strict
- Linting: ESLint + Prettier
- Naming: camelCase (variables/functions), PascalCase (components)

## Architecture Summary

```
Frontend (Next.js) → Backend (FastAPI) → Supabase Postgres
                                       → Supabase Auth (via backend proxy)
                                       → Supabase Storage (via backend proxy)
                                       → Qdrant (vectors)
                                       → Twilio (SMS)
                                       → LangChain Agent (Claude Haiku → GPT-4o-mini → Gemini Flash)
```

**Auth**: Supabase Auth via backend proxy. Frontend calls `/api/v1/auth/*` endpoints.
No Supabase SDK in frontend. All Supabase credentials are stored only in backend `.env`.

**AI Engine**: LangChain ReAct agent with 4 tools:
- `semantic_search` - Vector search in Qdrant
- `keyword_search` - Exact/fuzzy search for codes
- `grep_documents` - Regex search in raw documents
- `get_document_section` - Read specific document sections

**Key Business Logic**:
- Token-based quota system (€15/€35/€80 per tier)
- Burst protection: max 50 queries/hour
- SMS responses forced to ASCII (GSM-7), auto-split if >160 chars
- Conversation memory: last 5 messages per phone number

## API Structure

Backend endpoints follow `/api/v1/...` versioning with RFC 7807 error responses.

Key endpoints:
- `POST /api/v1/documents/upload` - Document upload
- `POST /api/v1/chat/simulate` - Chat simulator (10 free/day)
- `POST /webhooks/twilio/sms` - SMS webhook
- `GET /api/v1/quota` - Quota status
- `GET /api/v1/analytics` - Usage analytics

## Admin Panel

Single admin account created via migration seed. Routes at `/admin/*`.

Key admin endpoints:
- `POST /api/v1/admin/login` - Admin authentication
- `GET /api/v1/admin/dashboard` - Business & technical KPIs
- `GET /api/v1/admin/users` - User management
- `POST /api/v1/admin/users/:id/impersonate` - Session takeover
- `GET /api/v1/admin/config/tiers` - Pricing configuration (editable)
- `GET /api/v1/admin/health` - Service status monitoring

**Admin Features**:
- Full user management (edit tier, quota, disable, delete)
- Session takeover (login as user)
- Pricing/tier configuration from database
- System health monitoring (Qdrant, Twilio, LLMs)
- In-app notifications (no email alerts)
