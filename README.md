# Narayan Pharmacy — Prescription & Drug Interaction Checker

A focused feature from a pharmacy SaaS: pharmacists enter a prescription, and the app
uses Claude AI to flag dangerous drug-drug interactions before dispensing.

## Tech Stack

- **Backend:** Django + Django REST Framework + SQLite
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **AI:** Anthropic Claude API (`claude-haiku-4-5-20251001`)

## Setup (under 5 commands)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`.

## Features

- **Prescription Entry** — patient/doctor/date + multiple drug rows. On submit, calls
  Claude to check for drug-drug interactions and saves the result.
- **Prescriptions List** — table of all prescriptions with severity badges. Click a row
  to view full details including the AI interaction result.
- **Caching** — identical drug combinations are not re-sent to Claude; results are
  cached in the database.
- **Edge cases** — single-drug prescriptions skip the AI check; Claude API errors are
  caught and shown to the user without crashing the app.

## AI Workflow Documentation

See `CLAUDE.md` (project instructions for AI assistants) and `MEMORY.md` (development
notes, decisions, and course corrections) at the project root.