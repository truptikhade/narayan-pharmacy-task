# CLAUDE.md

Instructions for Claude Code / AI assistants working on this project.

## Project Overview

A Prescription Entry & Drug Interaction Checker for a pharmacy SaaS. A pharmacist enters
a prescription (patient, doctor, drugs + dosages), and the app calls the Claude API to
flag dangerous drug-drug interactions before dispensing.

## Tech Stack

- **Backend:** Django + Django REST Framework, SQLite
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **AI:** Anthropic Claude API (`claude-haiku-4-5-20251001`), via `anthropic` Python SDK

## Project Structure
backend/
├── core/                  # Django project settings, root urls
├── prescriptions/         # Main app
│   ├── models.py          # Prescription, Drug, InteractionCache
│   ├── serializers.py      # DRF serializers
│   ├── views.py             # API views (list/create/detail)
│   ├── services.py          # Claude API integration + caching
│   └── urls.py
└── manage.py
client/
├── app/
│   ├── layout.js
│   ├── page.js                    # Home
│   └── prescriptions/
│       ├── page.js                # List
│       ├── new/page.js            # Entry form
│       └── [id]/page.js           # Detail view
└── lib/api.js                     # Fetch helpers for Django API

## Running Locally

**Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

## Environment Variables

Backend `.env`:
ANTHROPIC_API_KEY=sk-ant-...

Frontend `.env.local`:
NEXT_PUBLIC_API_URL=http://localhost:8000/api

## Key Conventions

- All Claude API logic lives in `prescriptions/services.py` — never call the Anthropic
  SDK directly from views.
- Drug interaction results are cached in `InteractionCache`, keyed by a normalized,
  order-independent combination of drug name + dosage. Always check cache before
  calling Claude.
- If a prescription has fewer than 2 drugs, skip the Claude call entirely — return a
  default "no check needed" result.
- API errors from Claude must be caught and returned as `{ "error": true, "message": "..." }`
  — never let them crash the request. The frontend displays this in an error banner.
- Frontend never renders raw JSON. All Claude results are formatted into severity badges
  + bullet lists + recommendation text.

## Gotchas

- The Claude prompt requires strict JSON output (no markdown fences). `services.py`
  strips ```json fences defensively before parsing, but if Claude's response format
  changes, parsing will fail — check `build_prompt()` first.
- CORS is configured for `http://localhost:3000` only — update `CORS_ALLOWED_ORIGINS`
  in `core/settings.py` if deploying frontend elsewhere.