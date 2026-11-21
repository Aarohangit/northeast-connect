# Flood Response

Offline-first flood emergency reporting and rescue coordination for Assam.

Citizens raise an SOS from a lightweight PWA that keeps working on 2G or with no
network at all. Requests queue on the device and sync when a connection returns.
District control rooms verify, prioritise and dispatch rescue teams from a
separate admin console.

## Layout

```
flood-response/
├── citizen-app/          React PWA for the public (SOS, safety info, alerts)
├── admin-console/        React control-room dashboard for officials
├── services/
│   ├── api-gateway/      Single entry point, routing, auth check   :8090
│   ├── sos-service/      SOS intake, idempotency, delivery status  :8081
│   ├── rescue-service/   Verification, teams, assignments          :8082
│   └── ai-service/       Report triage and categorisation          :8083
└── infra/mysql/          Database bootstrap (one schema per service)
```

## Quick start (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1   # everything, one command
powershell -ExecutionPolicy Bypass -File scripts\reset-demo.ps1  # clean demo scenario
powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
```

Citizen app on http://localhost:5173, control room on http://localhost:5174.
See [DEMO.md](DEMO.md) for the 2-minute walkthrough.

## Local setup

Requirements: Java 21+, Node 20+, MySQL 8.

```bash
mysql -u root -p < infra/mysql/init.sql
cp .env.example .env
```

This creates databases `sos_db` and `rescue_db` and a `flood` user on `localhost:3306`.

### Running the services

```bash
# Java services (one terminal each)
cd services/sos-service    && ./mvnw spring-boot:run
cd services/rescue-service && ./mvnw spring-boot:run
cd services/api-gateway    && ./mvnw spring-boot:run

# AI service
cd services/ai-service
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --port 8083 --http h11
```

On networks that intercept HTTPS, set
`MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=Windows-ROOT` before running Maven.

Both apps talk only to the gateway at `http://localhost:8090`. The services
themselves are not meant to be exposed.

### Access

Citizens never log in. They can submit an SOS, update its location, and check
its status by reference; none of those responses contain personal data.

Control-room staff log in at `POST /api/auth/login` and send the returned JWT
as `Authorization: Bearer <token>`. Demo accounts, all with password
`Flood@2026` (override with `STAFF_PASSWORD`):

| Username | Role |
|---|---|
| `admin` | State control room (super admin) |
| `dc.kamrup` | District admin, Kamrup Metro |
| `dc.barpeta` | District admin, Barpeta |
| `coordinator` | Rescue coordination desk |

New SOS submissions are limited per network to 10 a minute (`SOS_RATE_LIMIT`).

### Citizen app

```bash
cd citizen-app
npm install
npm run dev                          # day-to-day development
npm run build && npm run preview     # full offline behaviour (service worker)
```

Open `http://localhost:5173`. The service worker only runs in the built app, so
test offline behaviour with `build` + `preview`.

How a request survives a bad network:

1. Pressing **Send SOS** writes the request to IndexedDB on the phone before any
   network call, so it cannot be lost.
2. The app tries to send it straight away, then retries with exponential backoff
   (2 s up to 60 s), and immediately when the browser reports a connection.
3. It also registers a Background Sync, so on Android Chrome the service worker
   sends it even after the app is closed.
4. Each request carries a client-generated ID; the server stores it once no
   matter how many retries arrive, and marks late arrivals as `QUEUED_SYNC`.

The waiting screen only ever claims what is true: saved on the phone, received
by the control room system, checked by an officer, and so on. It never says
help is coming before an officer has acted.

The UI is in Assamese, Hindi and English. Safety guidance, helplines and the
shelter list are bundled into the app and work offline; previously viewed map
tiles are cached.

### Admin console

```bash
cd admin-console
npm install
npm run dev        # http://localhost:5174
```

Sign in with one of the staff accounts below. The **Command** view has the
live SOS queue (sorted by AI-suggested severity), an operations map of
Assam with severity-coloured SOS pins, rescue team positions and hotspot
clusters, and a detail panel where an officer verifies, rejects or merges a
report, dispatches the nearest available team, and closes the operation.
**Teams & operations** lists every team's status and the full operations log.
All figures refresh every 8 seconds and are counted from live records.

### Demo data

With all services running:

```bash
python infra/seed/seed_demo.py
```

Loads 26 realistic SOS reports across flood-hit districts (Assamese, Bengali,
Hindi, English), including a hotspot cluster, a duplicate pair, delayed offline
deliveries, and requests at every stage from review to rescued.

### AI triage

`ai-service` turns free-text SOS reports in Assamese, Bengali, Hindi or English
into a structured triage suggestion: category, severity, needs, vulnerable
people, water level and location hints. It uses Claude when `ANTHROPIC_API_KEY`
is set, and falls back to a built-in multilingual rule engine when it isn't
or when the API can't be reached, so triage never goes down. Every suggestion
is advisory; a duty officer makes the final call.

Duplicate detection and hotspot clustering are deterministic, so an officer
can always see why two reports were linked.

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/triage` | Severity and category suggestion for one report |
| `POST /api/ai/duplicates` | Likely duplicates of a report among recent ones |
| `POST /api/ai/hotspots` | Clusters of nearby reports, ranked by severity |
