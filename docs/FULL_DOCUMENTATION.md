# LexAequitas Full Documentation

## 1. Project Summary
LexAequitas is a legal-tech platform with:
- A React frontend (`frontend/`) for case operations and UI workflows.
- A Spring Boot backend (`new_folder/backend-java/`) as API gateway and persistence layer.
- A FastAPI AI backend (`new_folder/ai-service/`) for simulation, legal analysis, and precedent retrieval.

Core capabilities:
- User authentication (register/login with JWT token issuance).
- Case management CRUD.
- Compliance/event tracking with reminders.
- Document upload and AI-assisted legal document analysis.
- AI trial simulation with prosecution/defense/judge style outputs.
- AI-backed legal precedent search from query, argument, or uploaded document.

## 2. System Architecture
1. Frontend sends REST requests to Spring backend APIs.
2. Spring backend handles auth, persistence, and orchestration.
3. For AI features, Spring calls Python FastAPI services.
4. FastAPI invokes LLM endpoint through OpenRouter and returns JSON results.
5. Spring relays those responses back to frontend.

Default local ports:
- Frontend: `3000`
- Spring backend: `10000` (configured in `application.properties`)
- FastAPI backend: `8000`

## 3. Tech Stack
- Frontend: React 18, CRACO, Tailwind, Radix UI, Axios.
- Backend: Java 17+, Spring Boot 3.2.5, Spring Data JPA, Spring Security, JWT, PostgreSQL driver, WebFlux WebClient.
- AI service: Python 3.10+, FastAPI, Uvicorn, spaCy, pdfplumber, pytesseract, OpenAI SDK for OpenRouter.
- Database: PostgreSQL (JPA-managed schema with `ddl-auto=update`).

## 4. Backend APIs (Spring)
Base URL: `/api`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Cases
- `GET /api/cases`
- `POST /api/cases`
- `PUT /api/cases/{id}`
- `DELETE /api/cases/{id}`

### Events / Compliance Alerts
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/upcoming?days={n}`
- `PUT /api/events/{id}/resolve`
- `DELETE /api/events/{id}`

### Documents
- `POST /api/documents` (multipart upload + AI analysis)
- `GET /api/documents` (currently returns empty array placeholder)
- `DELETE /api/documents/{id}` (placeholder response)

### Trial Simulation
- `POST /api/simulation/argue`
- `POST /api/simulation/case-summary`
- `GET /api/simulation/health`

### Precedents
- `POST /api/precedence/search`
- `POST /api/precedence/from-document`
- `POST /api/precedence/from-argument`
- `GET /api/precedence/health`

## 5. AI APIs (FastAPI)
- `POST /simulation/argument`
- `POST /simulation/case-summary`
- `POST /precedence/search`
- `POST /precedence/from-document`
- `POST /analyse`
- `GET /health`

## 6. Data Model Overview
Main persisted entities:
- `users`: `id`, `email`, `password`, `name`
- `cases`: `id`, `title`, `caseNumber`, `caseType`, `clientName`, `opposingParty`, `courtName`, `judgeName`, `nextHearingDate`, `description`, `status`
- `events`: `id`, `title`, `status`, `eventType`, `priority`, `date`, `location`, `caseNumber`, `clientName`, `caseId`, `notes`, `notifyEmail`, `remindDays`, `reminded`, `createdAt`

Database scripts are provided in:
- `docs/database/schema.sql`
- `docs/database/seed.sql`

## 7. Configuration and Environment Variables

### Spring backend
Primary config files:
- `new_folder/backend-java/src/main/resources/application.properties`
- `new_folder/backend-java/src/main/resources/application.yml`

Important properties:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.jpa.hibernate.ddl-auto=update`
- `server.port=10000`

### Python AI service
Expected `.env` in `new_folder/ai-service/`:
- `OPENROUTER_API_KEY=<your_key>`

## 8. Security Notes (Important)
- The repository currently contains hardcoded datasource credentials in `application.properties`. Rotate these credentials and move to environment variables or secret manager before production use.
- JWT secret is hardcoded in `JwtUtil.java`; this should be externalized.
- Some endpoints are currently broadly permitted in `SecurityConfig` (`permitAll`). Tighten route authorization in production.

## 9. Build and Run Summary
Detailed step-by-step instructions are in:
- `docs/DEPLOYMENT_INSTRUCTIONS.md`

Quick summary:
1. Start FastAPI (`uvicorn main:app --host 0.0.0.0 --port 8000`)
2. Start Spring Boot (`mvn spring-boot:run`)
3. Start frontend (`npm start`)

## 10. Actual Source Code and Static Files
Complete file inventory is available at:
- `docs/SOURCE_FILE_INDEX.txt`

High-level structure and major code paths:
- `docs/CODE_DIRECTORY_STRUCTURE.md`

