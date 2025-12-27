# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldOps AI is an SMS-based AI assistant for field technicians in Heavy Machinery & Mining. Users send SMS questions and receive AI-powered answers from their uploaded technical manuals.

This repository contains **project specifications and task definitions**. The actual code lives in two separate repositories:
- `field-ops-api` - FastAPI backend
- `field-ops-web` - Next.js frontend

## Key Documentation

- `project.md` - Complete technical specifications, architecture, pricing, and business rules
- `tasks.md` - Sequential development tasks with acceptance criteria

## Code Standards

**Language**: ALL code, comments, docstrings, and commit messages must be in **English**.

**Commits**:
- Format: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **NO Claude Code signatures** (no "Generated with Claude Code", no "Co-Authored-By: Claude")

**Backend (field-ops-api)**:
- Python 3.13, FastAPI, SQLAlchemy, uv
- Linting: Ruff
- Type checking: mypy (strict)
- Naming: snake_case

**Frontend (field-ops-web)**:
- Next.js 14 (App Router), TypeScript strict
- Linting: ESLint + Prettier
- Naming: camelCase (variables/functions), PascalCase (components)

## Architecture Summary

```
Frontend (Next.js) → Backend (FastAPI) → Supabase Postgres
                                       → Qdrant (vectors)
                                       → Twilio (SMS)
                                       → LangChain Agent (Claude Haiku → GPT-4o-mini → Gemini Flash)
```

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
