# Frontend (React)

Prepared feature-first structure under `src/features/`:

- `auth`
- `catalogue`
- `bookings`
- `tickets`
- `notifications`

Shared layers are prepared in:

- `src/api`
- `src/components`
- `src/routes`
- `src/context`
- `src/styles`
- `src/pages`

Test folders are prepared in `tests/unit`, `tests/integration`, and `tests/e2e`.

## Authentication UI

Frontend reads current session from `GET /api/v1/auth/me` and uses route guards.

Environment variables:

- `VITE_API_BASE_URL` (default: `/api/v1`)
- `VITE_AUTH_BASE_URL` (default: `http://localhost:8080`)
- `VITE_OAUTH2_REGISTRATION_ID` (default: `google`)

Route protection:

- All app routes require authenticated session when OAuth2 is enabled.
- `/catalogue` requires `ADMIN` role.
- Booking admin queue/actions are shown only for `ADMIN`.
- Ticket assign/status/reject actions are shown only for `ADMIN` or `TECHNICIAN`.

