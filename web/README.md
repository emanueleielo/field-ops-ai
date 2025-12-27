# FieldOps AI - Web Dashboard

Next.js 14 frontend for FieldOps AI management dashboard.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Radix UI + Tailwind CSS
- React Query (TanStack Query)
- React Hook Form + Zod
- Supabase Auth

## Setup

```bash
cd web

# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx          # Dashboard overview
│   ├── documents/
│   ├── analytics/
│   ├── simulator/
│   ├── billing/
│   ├── settings/
│   └── activity/
├── layout.tsx
├── page.tsx              # Landing page
└── globals.css
components/
├── ui/                   # Radix UI components
└── features/             # Feature-specific components
lib/
├── supabase/             # Supabase client
├── api/                  # API client
└── utils.ts
hooks/                    # Custom React hooks
types/                    # TypeScript types
```

## Documentation

See `../project.md` for complete specifications.
See `../tasks.md` for implementation tasks (start with TASK-08).
