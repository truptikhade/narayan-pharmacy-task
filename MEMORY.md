# MEMORY.md

Notes on how this project was built, decisions made, and why.

## Initial Approach

Started by reading the task spec carefully — two screens only (entry form + list/detail),
Django + Next.js, Claude API mandatory. Decided to build backend-first since the frontend
depends on the API contract being stable.

## Architectural Decisions

### 1. Separate `services.py` for Claude logic
Considered putting the Claude call directly inside the view function, but split it out
into `prescriptions/services.py` instead. Reasoning: keeps the view focused on
request/response handling, makes the AI logic independently testable, and if we ever
swap models or providers, only one file changes.

### 2. Caching via a dedicated `InteractionCache` table
The task requires "do not re-call the API for the same drug combination." Options
considered:
- Cache on the `Prescription` model itself — rejected, because different prescriptions
  with the same drug combo would still trigger separate API calls.
- Separate `InteractionCache` table keyed by a normalized combination string (drugs
  sorted alphabetically, name+dosage joined) — chosen, because it works across
  *all* prescriptions, not just one.

### 3. Storing `interaction_result` denormalized on `Prescription`
The result is saved both in `InteractionCache` AND copied onto the `Prescription` row
(`interaction_result`, `severity`). This is denormalized data, but it means the detail
view is a single query — no joins needed to show the AI result for a specific
prescription.

### 4. Edge case: 1-drug prescriptions
Per the spec, if only one drug is entered, skip the API call entirely. Implemented as
an early return in `check_interactions()` — returns a default "no check needed" object
with `severity: "None"`.

## Course Corrections

- **Mock mode added during development.** While building, the dev Anthropic account had
  no API credits, so a `USE_MOCK_AI` env flag was added to `services.py` to test the full
  UI flow (form → save → display severity/interactions) without real API calls. The real
  Claude code path is untouched — mock mode is a guarded branch that's off by default
  and only used for local development. `USE_MOCK_AI` is intentionally NOT in
  `.env.example` so the evaluator's setup always uses the real Claude API.

- **Dosage validation added late.** Initially the form only checked that drug name +
  dosage fields were non-empty, which allowed garbage input like "asdfg" as a dosage.
  Added a regex check requiring a number + unit (e.g. `500mg`, `10ml`) before submission.

- **Layout standardization.** Each page initially had its own `max-w-*` / padding
  classes, leading to inconsistent widths across routes. Moved the container styling
  into `app/layout.js` so every page shares the same width and spacing.

## Prompt Design for Claude

The prompt frames Claude explicitly as a "clinical pharmacist assistant" reviewing a
prescription before dispensing, lists the exact drugs and dosages, and requires a
strict JSON response (`has_interaction`, `severity`, `interactions[]`,
`recommendation`). This was chosen over a generic "check these drugs for interactions"
prompt to (a) ground the response in a pharmacy context and (b) get a structured,
parseable output instead of free text.

## What I'd Do With More Time

- Add unit tests for `check_interactions()` covering: single drug, cached combo, API
  error, malformed JSON response.
- Add a loading skeleton for the prescriptions list/detail pages instead of a plain
  "Loading..." text.
- Deploy to Render (backend) + Vercel (frontend) for a live demo link.