# Backend (Spring Boot)

Layered package structure is prepared under:

`src/main/java/com/smartcampus/operationshub/`

- `controller`
- `service`
- `repository`
- `entity`
- `dto`
- `mapper`
- `exception`
- `validation`
- `security`
- `config`

Testing folders are prepared under `src/test/java/com/smartcampus/operationshub/`.

## Profiles

- `dev` -> H2 in-memory (data resets when backend process stops)
- `dev,persist` -> H2 file-based on local machine only
- `prod` -> PostgreSQL via environment variables

## Baseline Run

1. `mvn test`
2. `SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run`

## Team-Shared Data Run (Recommended)

Use one shared PostgreSQL database and the same credentials for all members.

1. Copy `backend/.env.shared.example` to `backend/.env.shared`
2. Fill values for:
	- `DB_URL`
	- `DB_USERNAME`
	- `DB_PASSWORD`
3. Run from repository root:
	- `./scripts/run_backend_shared.sh`

Health endpoint:

- `GET /api/v1/health`

## Module E - Authentication and Authorization

OAuth2 login and RBAC can be enabled with environment variables.

Required when OAuth2 is enabled:

- `SECURITY_OAUTH2_ENABLED=true`
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=<google-client-id>`
- `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=<google-client-secret>`

Optional role mapping and redirect settings:

- `SECURITY_ADMIN_EMAILS=admin1@domain.com,admin2@domain.com`
- `SECURITY_TECHNICIAN_EMAILS=tech1@domain.com,tech2@domain.com`
- `BACKEND_BASE_URL=http://localhost:8080`
- `FRONTEND_SUCCESS_URL=http://localhost:5173/`

RBAC behavior (when OAuth2 is enabled):

- `ADMIN`: resource create/update/delete, booking approve/reject
- `ADMIN` or `TECHNICIAN`: ticket assign/status/reject
- `USER`: authenticated baseline role for all signed-in users
