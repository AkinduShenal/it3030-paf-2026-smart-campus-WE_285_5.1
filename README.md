# Smart Campus Operations Hub

Monorepo scaffold for IT3030 coursework.

## Project Structure

```text
.
|-- .github/workflows/       # CI workflows
|-- backend/                 # Spring Boot REST API
|-- frontend/                # React web application
|-- docs/                    # Requirements, diagrams, testing evidence
|-- infra/                   # Docker/K8s and deployment support
|-- postman/                 # API collections and environment files
`-- scripts/                 # Utility scripts
```

## Assignment Modules Mapped

- Module A: Facilities and Assets Catalogue
- Module B: Booking Management
- Module C: Maintenance and Incident Ticketing
- Module D: Notifications
- Module E: Authentication and Authorization

## Solo Work Allocation Strategy (GitHub Visible)

This repository uses four workstreams to match the assignment's member split, even when implemented by one developer.

- WS1: Facilities and Assets Catalogue (Module A)
- WS2: Booking Workflow and Conflict Rules (Module B)
- WS3: Tickets, Attachments, Technician Updates (Module C)
- WS4: Notifications, Roles, OAuth2 (Modules D and E)

To keep contributions clearly visible:

1. Create feature branches per workstream.
	- `feat/ws1-...`
	- `feat/ws2-...`
	- `feat/ws3-...`
	- `feat/ws4-...`
2. Use commit prefixes with the same workstream code.
	- `WS1: add resource create endpoint`
	- `WS2: add booking overlap validation`
3. Open PRs using the project PR template and complete the endpoint/UI ownership sections.
4. Record merged work in documentation:
	- `docs/requirements/work-allocation-plan.md`
	- `docs/api/endpoint-ownership-matrix.md`
	- `docs/evidence/contribution-log-template.md`

## Next Step

Generate the backend and frontend starter apps inside the existing structure and then wire auth, database, and CI checks.

## Run Locally

Prerequisites:

- Java 17+
- Maven 3.9+
- Node.js 20+

Backend:

1. `cd backend`
2. `mvn spring-boot:run`
3. Health check: `http://localhost:8080/api/v1/health`

Frontend:

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:5173`

## Shared Team Database Setup (Recommended)

Use this mode when all team members must see the same data.

1. Provision one shared PostgreSQL instance (cloud or centrally hosted).
2. Copy `backend/.env.shared.example` to `backend/.env.shared`.
3. Fill `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` with the same values for all team members.
4. Start backend with:
	- `./scripts/run_backend_shared.sh`
5. Start frontend with:
	- `cd frontend && npm run dev -- --host`

Notes:

- `dev` profile uses H2 in-memory and is not shared.
- `dev,persist` profile is local-file persistence on one machine only.
- `prod` profile + same PostgreSQL credentials is the team-shared mode.
