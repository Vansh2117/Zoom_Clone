# Zoom Clone: Video Conferencing Platform

A full-stack clone of the Zoom web app. You can start an instant meeting, schedule one for later, join by meeting ID or invite link, and meet over real audio and video with chat, screen sharing and host controls.

The interface follows Zoom's web portal (home dashboard, Meetings, Schedule Meeting, Join) and Zoom's in-meeting experience (pre-join preview, gallery view, bottom toolbar, leave/end confirmation).

## Contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Database design](#database-design)
- [API](#api)
- [Running locally](#running-locally)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Assumptions and scope decisions](#assumptions-and-scope-decisions)
- [Environment variables](#environment-variables)
- [Deployment notes](#deployment-notes)

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, client-side navigation), React 19, TypeScript, Tailwind CSS v4, TanStack Query, Radix UI (accessible dialogs and menus), lucide-react icons |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0 (typed ORM), Pydantic v2 |
| **Database** | SQLite, with a schema designed for this project (see [Database design](#database-design)) |
| **Real-time video** | [LiveKit](https://livekit.io) Cloud (a WebRTC media server) through `livekit-api` on the server and `@livekit/components-react` in the browser |
| **Tests** | pytest (backend), Vitest + Testing Library (frontend), Playwright (end-to-end) |

## Features

### Core requirements

| Requirement | What is implemented |
|---|---|
| **Landing dashboard** | Zoom-style top bar, navigation bar, sidebar and profile card. Quick actions for **New Meeting**, **Join** and **Schedule**, the Personal Meeting ID with a copy button, an **Upcoming meetings** card and a **Recent activity** list. Every card has loading, empty and error states. |
| **Instant meeting** | **New Meeting** creates a meeting with a unique 10-digit ID and a shareable invite link (`/j/{id}`), then takes the host to the pre-join screen and into the room. |
| **Join meeting** | Join by meeting ID (`827 291 4420`, `827-291-4420` and `8272914420` all work) or by pasting the full invite link. The format is checked in the browser, and the meeting's existence and status are checked against the API. A display name is required before joining. |
| **Schedule meeting** | Zoom's form: Topic, optional Description, Date, Time (30-minute slots with AM/PM), Duration and Time Zone. The meeting link is generated automatically, the meeting is stored in SQLite, and it appears in Upcoming and on its own details page with **Copy Invitation**. |

### Meeting room

- **Pre-join screen** with a live camera preview, a microphone level meter, mic and camera toggles, and the name field.
- **Gallery view** with active-speaker highlight, mirrored self-view and muted indicators.
- **Controls**: mute/unmute and start/stop video (also **Alt+A** / **Alt+V**), a participants panel, in-meeting **chat**, and **screen share** (a shared screen takes over the main stage).
- **Leave confirmation** as in Zoom: guests get *Leave / Cancel*; the host gets *End Meeting for All / Leave Meeting / Cancel*.
- **Waiting for host**: a guest who arrives before the host sees a waiting screen and joins automatically once the host starts the meeting.
- **Reconnection**: a banner on network drops, and a page refresh rejoins silently as the same participant.
- **Clear end screens**: "ended by the host", "removed by the host", "joined from another window" and "disconnected" (with a Rejoin button).

### Bonus features

- **Host controls**: **Mute All** and **Remove participant**. Both are enforced on the server; the browser's video token carries no admin rights.
- **Responsive design** from mobile to desktop, including a slide-out navigation menu on small screens.
- **Meetings page** with Upcoming and Previous tabs, a **meeting details** page (invite link, start, delete), and an **attendance table** for meetings that have taken place.
- **Profile page** (`/profile`), opened from the avatar menu, showing the logged-in user's name, email and Personal Meeting ID.

Login/signup is intentionally not implemented; see [Assumptions](#assumptions-and-scope-decisions).

### Quality

- **Consistent errors**: every API failure uses one JSON envelope with a stable error code, which the UI maps to a friendly message.
- **Validation on both sides**: Pydantic on the server and the same rules in the browser, including rejection of HTML in titles, descriptions and names.
- **Accessibility**: semantic buttons, labelled inputs, focus-trapped dialogs, keyboard-navigable tabs and menus, and a skip link.
- **Secrets stay on the server**: the browser only ever receives a short-lived token scoped to one meeting room.

## Architecture

```text
Browser (Next.js)                      FastAPI backend                     External
-----------------                      ---------------                     --------
pages -> components -> hooks  --REST-> routes -> services -> models  --->  SQLite
                                                    |
                                                    +-> VideoService --->  LiveKit Cloud
meeting room  ---------------- WebRTC media and presence --------------->  LiveKit Cloud
```

- **Backend layers.** `api/routes` handles HTTP only, `services` holds the business logic and transactions, `domain` holds pure rules with no framework imports (meeting codes, the lifecycle state machine, text validation), and `models` defines the tables. Services receive the database session and the video provider through their constructors, so the tests replace LiveKit with a fake without patching anything.
- **Frontend layers.** Routes in `app/` render feature components, which use hooks, which use one typed API client. Components never call `fetch` directly.
- **Data ownership.** SQLite owns meeting details, the lifecycle (scheduled → active → ended) and attendance history. LiveKit owns what changes every second: who is connected right now, and the state of their microphone and camera.
- **Meeting lifecycle.** There is no generic "set status" endpoint. Only three intents change a meeting's state: the host joining starts it, **End Meeting for All** ends it, and deleting removes a meeting that has not started. Invalid transitions cannot be expressed.

The full design rationale, with diagrams, is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Database design

Three tables:

| Table | Purpose | Key columns |
|---|---|---|
| `users` | The meeting host. One default user is seeded. | `email` (unique), `personal_meeting_id` (unique) |
| `meetings` | One row per instant or scheduled meeting. | `meeting_code` (unique, public 10-digit ID), `host_id` → `users`, `scheduled_at`, `duration_minutes`, `status`, `started_at`, `ended_at` |
| `participants` | Attendance: who joined a meeting, in what role, and when they left. | `meeting_id` → `meetings`, `user_id` → `users` (null for guests), `identity`, `display_name`, `role`, `joined_at`, `left_at` |

Design decisions:

- **Public code, private key.** The integer primary key stays internal. The random `meeting_code` is the only identifier used in URLs, and it is generated with Python's `secrets` module because knowing the code is enough to join.
- **The invite link is derived, not stored.** It is built from `PUBLIC_APP_URL` and the meeting code, so changing the domain needs no data migration.
- **Integrity is enforced by the database**, not only by code: foreign keys (switched on per connection, since SQLite ignores them by default), `CHECK` constraints on status, role and duration, unique constraints, and a deterministic constraint naming convention.
- **One attendance row per browser tab per meeting** (`UNIQUE(meeting_id, identity)`). Rejoining after a refresh reopens the same row instead of creating a duplicate.
- **Cascades.** Deleting a meeting deletes its attendance rows. Deleting a user keeps the attendance history and clears the link (`ON DELETE SET NULL`).
- **UTC everywhere.** A custom column type rejects datetimes without a time zone on write and tags values as UTC on read. The API returns `...Z` timestamps and the browser converts them to local time.
- **An index on `(host_id, status, scheduled_at)`** matches the dashboard's queries.

The database is created and **seeded automatically** on first start with the default user and a set of upcoming, ended (with attendance) and missed meetings.

## API

All endpoints are under `/api`. Interactive documentation is served at `/docs` when the backend is running.

| Method and path | Purpose |
|---|---|
| `GET /health` | Liveness check, and whether video is configured |
| `GET /me` | The default (logged-in) user |
| `POST /meetings/instant` | New Meeting |
| `POST /meetings` | Schedule a meeting |
| `GET /meetings/upcoming` | Live and future meetings, soonest first |
| `GET /meetings/recent` | Ended and missed meetings, newest first |
| `GET /meetings/{code}` | Meeting details; used to validate a meeting ID |
| `POST /meetings/{code}/join` | Record attendance and return a video token |
| `POST /meetings/{code}/participants/{identity}/leave` | Mark a participant as having left |
| `GET /meetings/{code}/participants` | Attendance history (host) |
| `POST /meetings/{code}/end` | End Meeting for All (host) |
| `DELETE /meetings/{code}` | Delete a meeting that has not started (host) |
| `POST /meetings/{code}/host/mute-all` | Mute everyone except the host |
| `POST /meetings/{code}/host/remove` | Remove a participant |

Errors always have the same shape:

```json
{ "error": { "code": "MEETING_ENDED", "message": "This meeting has ended.", "details": [] } }
```

## Running locally

### Prerequisites

- **Python 3.11+** and **Node.js 20+** (with npm)
- A free **LiveKit Cloud** project. It is only needed for the audio/video room; the dashboard, scheduling and join validation work without it.

### 1. Get LiveKit keys

1. Sign up at <https://cloud.livekit.io> and create a project.
2. Open **Settings → API Keys** and create a key.
3. Note the **WebSocket URL** (`wss://<project>.livekit.cloud`), the **API Key** and the **API Secret**.

### 2. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements-dev.txt
cp .env.example .env            # Windows: copy .env.example .env
# edit .env and fill in LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET

uvicorn app.main:app --reload --port 8000
```

- Health check: <http://localhost:8000/api/health>
- API documentation: <http://localhost:8000/docs>

The SQLite file (`backend/zoom_clone.db`) is created and seeded on first start. Delete it to reset the data.

### 3. Frontend (terminal 2)

```bash
cd frontend
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

### 4. Try a two-person meeting on one computer

1. On the dashboard click **New Meeting**, then **Join as Host** on the preview screen.
2. In the meeting, click the **(i)** icon (top-left) or **Participants → Invite** to copy the invite link.
3. Open the link in **another tab or an incognito window**, enter a name and click **Join**. Each tab is a separate participant.
4. As the host, try **Mute All** and **Remove** (hover a participant), then **End → End Meeting for All**.

## Tests

| Suite | Command | Count | What it covers |
| --- | --- | --- | --- |
| Backend | `cd backend && pytest` | 153 | Business rules, every endpoint, and the schema's guarantees |
| Frontend | `cd frontend && npm test` | 87 | Validation, date handling, the API client, and components |
| End-to-end | `cd frontend && npm run test:e2e` | 8 | Real browser flows against the running app |

### Backend (pytest)

- `tests/unit`: pure rules such as meeting-code generation, the lifecycle state machine, upcoming/recent classification, text validation and request schemas.
- `tests/api`: every endpoint through FastAPI's `TestClient`, with an in-memory database and a fake video service, so no network or LiveKit account is needed. Covers creation, listing and sorting, the join rules (404, 409, 410, 403, 503), rejoining, leaving, ending, deleting, host controls, CORS and the error envelope.
- `tests/db`: foreign keys, unique and check constraints, cascades, the UTC round trip and idempotent seeding.

### Frontend (Vitest + Testing Library)

Covers meeting-ID parsing and validation, date/time conversion, the API client and error mapping, join-session storage, and components: the Join form, the Schedule form (including UTC conversion and server-side field errors), the Copy button (with its fallback when the Clipboard API is unavailable), the Leave dialog (host and guest variants), the dashboard cards (empty, error and list states, plus the double-click guard on New Meeting), the profile page and status badges.

### End-to-end (Playwright)

Start the backend first, then:

```bash
cd frontend
npx playwright install chromium   # first time only
npm run test:e2e                   # dashboard, schedule, join and pre-join flows
E2E_LIVEKIT=1 npm run test:e2e     # also runs a real two-browser meeting (needs LiveKit keys)
```

The two-browser test has a host start a meeting, a guest join through the invite link, and the host end it for everyone. It uses Chrome's fake camera and microphone, so it runs without hardware.

### Lint and type-check

```bash
cd backend && ruff check . && ruff format --check .
cd frontend && npm run lint && npm run typecheck
```

## Project structure

```text
backend/
  app/
    main.py              app factory: CORS, error handlers, routers, startup (create tables + seed)
    core/                settings (.env), error types, error handlers, UTC clock
    domain/              pure business rules: meeting codes, lifecycle state machine, text validation
    db/                  engine and session, UTC datetime column type, idempotent seed
    models/              SQLAlchemy models: User, Meeting, Participant
    schemas/             Pydantic request and response contracts
    services/            business logic: meetings, participants, host controls
      video/             VideoService interface + LiveKit implementation
    api/                 thin HTTP layer: dependencies (auth seam, services) and routes
  tests/                 unit/, api/, db/ (plus fakes and helpers)

frontend/
  src/
    app/                 routes: / (dashboard), /meetings, /meetings/schedule, /meetings/[code],
                         /profile, /join, /j/[code] (invite link + pre-join), /meeting/[code] (room)
    components/
      ui/                reusable primitives: Button, Dialog, FormField, CopyButton, ...
      layout/            top bar, navigation, sidebar, page shells
      dashboard/ meetings/ profile/ join/ prejoin/ media/ room/    feature components
    hooks/               data hooks (TanStack Query), media preview, meeting connection
    lib/                 API client, error messages, validation, date/time, storage helpers
    types/               API types mirroring the backend schemas
    test/                test setup and utilities
  e2e/                   Playwright specs

docs/ARCHITECTURE.md     design decisions, diagrams and the edge-case table
```

## Assumptions and scope decisions

- **Authentication is out of scope**, as the assignment allows. One default user is seeded (name and email come from `DEFAULT_USER_NAME` and `DEFAULT_USER_EMAIL`) and treated as logged in. All "who is the user?" logic goes through a single FastAPI dependency, `get_current_user` in `backend/app/api/deps.py`. Replacing that one function with real token verification would turn on proper authorization everywhere, because the services already check `meeting.host_id == user.id`.
- **Host and guest without login.** The host enters through dashboard actions (New Meeting, Start, Host), which open `/j/{id}?role=host`. Anyone opening the plain invite link `/j/{id}` joins as a guest. Because every browser is the default user, both roles can be tested on one machine; with real login a guest could not claim the host role.
- **The host leaving does not end the meeting.** As in Zoom, only *End Meeting for All* ends it. If the host leaves, refreshes or loses their connection, the meeting continues and they can rejoin from the dashboard.
- **Guests wait for the host.** Joining a scheduled meeting that has not been started shows a waiting screen, which is Zoom's default without "join before host".
- **Time zones.** The API stores and returns UTC. The browser converts to and from the user's local time zone, which the Schedule page displays.
- **Durations** are limited to 15, 30, 45, 60, 90 or 120 minutes. Scheduling in the past, or more than a year ahead, is rejected.
- **Upcoming and Recent are computed when read.** Upcoming is live meetings plus scheduled ones whose time slot has not ended. Recent is ended meetings plus scheduled ones whose slot passed without being started (shown as *Not started*). No background job is needed.
- **Chat is not stored.** Messages travel over LiveKit's data channel, like a Zoom meeting without saved chat.
- **Placeholders.** Portal items outside the assignment (Recordings, Whiteboards, Settings, Search and similar) are shown for visual fidelity and display a "not available in this clone" notice.
- **No Zoom assets.** Zoom's logo, photos and product imagery are not reproduced; the brand mark is plain text.

## Environment variables

| File | Variable | Purpose |
|---|---|---|
| `backend/.env` | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | LiveKit credentials (**secret, server only**) |
| | `CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API |
| | `PUBLIC_APP_URL` | Frontend base URL, used to build invite links |
| | `DATABASE_URL` | SQLAlchemy URL (default `sqlite:///./zoom_clone.db`) |
| | `DEFAULT_USER_NAME`, `DEFAULT_USER_EMAIL`, `SEED_SAMPLE_DATA` | The seeded user and sample data |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Backend base URL (the only value exposed to the browser) |

Real `.env` files are git-ignored; the `.env.example` files document every variable.

## Deployment notes

- **Frontend**: set `NEXT_PUBLIC_API_URL` to the deployed backend's URL. It is read at build time, so rebuild after changing it.
- **Backend**: set `CORS_ORIGINS` and `PUBLIC_APP_URL` to the deployed frontend's URL, plus the three `LIVEKIT_*` values. Start it from the `backend/` directory with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **SQLite on free hosting** usually lives on a disk that is reset on each redeploy. The app recreates and reseeds the database on startup, so the dashboard is never empty, but meetings created earlier are lost. A persistent disk or Postgres would remove that limitation.
- **Camera and microphone** need a secure context: HTTPS, or `http://localhost` during development. Use Chrome, Edge or Firefox. Screen sharing is hidden on browsers that do not support it, which includes most mobile browsers.
