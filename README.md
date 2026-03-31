# Hopp Check-In System

Event check-in system with concurrent multi-station scanning, offline queue reconciliation, and a live host dashboard.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or via Docker)
- Redis running locally for distributed concurrency locks

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
4. **Deduplication:** The batch endpoint natively filters out duplicate QR scans within the same localized offline payload before processing.
5. **Atomicity & Retries:** Instead of wrapping the batch in a monolithic transaction (which would incorrectly roll back successful disjoint scans upon one normal conflict), the array processes sequentially. If the server or connection drops mid-batch, the frontend explicitly catches the resulting error and preserves the `IndexedDB` sync queue. It safely retries unacknowledged scans upon next connection without causing double counts (due to strict Database Idempotency protections).
6. Each scan in the response has its own `success`/`conflict`/`error` status, shown in a sync summary modal.
7. `clientTime` is stored alongside server `checkedInAt` for audit purposes. The server timestamp is authoritative.

### Concurrency Approach

- **Application-Level Locks via Redis**: Before processing a scan, a distributed lock is acquired in Redis using `SET NX EX`. If two stations scan the same guest at the same millisecond, only one lock succeeds. The other station receives an immediate "being processed" response without hitting PostgreSQL, resolving subtle race condition paths.
- **Database transaction**: Next, each check-in is a single INSERT with a UNIQUE constraint on `guestId`.
- **Conflict detection**: If a duplicate somehow bypasses Redis or if we are verifying a sequential duplicate scan, Prisma's `P2002` error code or `guest.checkin` presence identifies it.
- **Fail-Open Strategy**: If Redis is unavailable, the system safely falls back to PostgreSQL's DB constraints implicitly handling concurrency using row-level locking.

### Live Dashboard

- **Real-Time Insight Engine**: Dashboard queries fetch check-in counts dynamically split by the last 15-minute timeframe windows. This drives real-time, SVG-powered **interactive sparkline graphs**.
- **Visual Feedback & Skeleton Loading**: Upon initial load and when actively retrieving polling updates, standard unified **tailwinds animate-pulse skeleton loaders** display natively. A spinning top-nav sync icon actively highlights the 5-second polling interval ticks.
- Rate calculation uses an optimized historical timeframe check against indexed columns (`checkedInAt`).
- No WebSocket overhead — polling is simple, scales incredibly well with this use case, and provides the visual real-time feel thanks to dynamic fetch indicators.

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
