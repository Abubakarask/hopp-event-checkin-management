# Hopp Check-In System

Event check-in system with concurrent multi-station scanning, offline queue reconciliation, and a live host dashboard.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or via Docker)

### Setup

1. **Clone and install:**

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edit DATABASE_URL if needed

# Frontend
cd ../frontend
npm install
```

2. **Database:**

```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

The seed script creates an event with 335 guests (300 confirmed, 20 waitlisted, 15 cancelled) across 3 tiers, 3 check-in stations, and 50 pre-existing check-ins. Station IDs are printed to the console — use them in the station URL.

3. **Run:**

```bash
# Terminal 1: Backend
cd backend
npm run dev  # Runs on port 3001

# Terminal 2: Frontend
cd frontend
npm run dev  # Runs on port 5173, proxies API to 3001
```

4. **Open:**

- Dashboard: http://localhost:5173/dashboard
- Station A: http://localhost:5173/station/{STATION_A_ID}
- Station B: http://localhost:5173/station/{STATION_B_ID}
- VIP Station: http://localhost:5173/station/{VIP_STATION_ID}

The event ID auto-bootstraps from the database on first load.

## Architecture

### Idempotency Strategy

Check-in idempotency is enforced at the **database level**:

- The `Checkin` table has a `UNIQUE` constraint on `guestId` — PostgreSQL guarantees exactly one check-in record per guest.
- When two stations scan the same QR at the same millisecond, both attempt an INSERT. One succeeds; the other gets a unique constraint violation (Prisma error P2002).
- The application catches this violation, queries the existing check-in record, and returns a clear conflict response: "Already checked in at Station A at 14:22".
- This approach has zero race window — the database is the single source of truth, not application-level locks or checks.

### Offline Sync Design

When a check-in station loses connectivity:

1. Scans are queued in **IndexedDB** (persists across tab close/refresh) with client-side timestamps.
2. A pending badge shows the offline queue count.
3. When connectivity returns (detected via `navigator.onLine` + periodic health pings), the station auto-syncs via `POST /api/checkin/batch`.
4. The batch endpoint processes each scan independently — a conflict on one scan doesn't roll back others.
5. Each scan in the response has its own `success`/`conflict`/`error` status, shown in a sync summary modal.
6. `clientTime` is stored alongside server `checkedInAt` for audit purposes. The server timestamp is authoritative.

### Concurrency Approach

- **Database transaction**: Each check-in is a single INSERT with a UNIQUE constraint. No SELECT-then-INSERT pattern.
- **No application locks**: PostgreSQL's row-level locking during INSERT handles concurrent access.
- **Isolation level**: Default (Read Committed) is sufficient — the UNIQUE constraint is checked at commit time regardless of isolation level.
- **Conflict detection**: Prisma's `P2002` error code identifies unique violations. On conflict, a follow-up query fetches the winning check-in's station and timestamp for the error message.

### Live Dashboard

- Stats and guest list poll every 5 seconds.
- Rate calculation uses a SQL count over the last 60 seconds against an indexed column (`checkedInAt`).
- No WebSocket overhead — polling is simple, debuggable, and sufficient for dashboard update frequency.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/checkin | Single check-in scan |
| POST | /api/checkin/batch | Batch sync for offline queue |
| GET | /api/guests | Guest list with search, filter, sort, pagination |
| PATCH | /api/guests/:id/status | Change guest status |
| GET | /api/guests/export | CSV export |
| GET | /api/stats | Dashboard aggregates |
| GET | /api/stats/event | Bootstrap event ID |
| GET | /health | Health check |
