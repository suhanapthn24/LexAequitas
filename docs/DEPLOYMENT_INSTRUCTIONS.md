# LexAequitas Deployment Instructions

## 1. Prerequisites
- Node.js 18+ and npm
- Java 17+ and Maven
- Python 3.10+
- PostgreSQL 14+
- Tesseract OCR installed (for image text extraction in AI service)

## 2. Clone and Prepare
```bash
git clone <repo-url>
cd lexaequitas
```

## 3. Database Setup
1. Create database and user in PostgreSQL.
2. Apply schema script:
```bash
psql -U <db_user> -d <db_name> -f docs/database/schema.sql
```
3. Optional seed:
```bash
psql -U <db_user> -d <db_name> -f docs/database/seed.sql
```

## 4. Configure Spring Backend
File: `new_folder/backend-java/src/main/resources/application.properties`

Set:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `server.port` (default currently `10000`)

Recommended production changes:
- move credentials to env vars
- set strict CORS origins
- externalize JWT secret

## 5. Configure AI Service
Path: `new_folder/ai-service/`

1. Create virtual env and install requirements:
```bash
cd new_folder/ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

2. Create `.env`:
```env
OPENROUTER_API_KEY=your_openrouter_key
```

3. Run:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 6. Configure Spring to Reach AI Service
Current Java service classes point to deployed AI URL (`https://mpj-backend-python.onrender.com`).

For local full-stack testing, update these files to local URL (`http://localhost:8000`) if needed:
- `new_folder/backend-java/src/main/java/com/lexaequitas/service/SimulationService.java`
- `new_folder/backend-java/src/main/java/com/lexaequitas/service/PrecedenceService.java`
- `new_folder/backend-java/src/main/java/com/lexaequitas/service/DocumentAnalyzerService.java`

## 7. Run Spring Backend
```bash
cd new_folder/backend-java
mvn spring-boot:run
```

## 8. Run Frontend
```bash
cd frontend
npm install
npm start
```

## 9. Frontend API Base URL
Current frontend config points to deployed backend URL.

If running backend locally, update:
- `frontend/src/config.js`
- hardcoded API constants in pages/context (`frontend/src/context/AuthContext.jsx`, several `frontend/src/pages/*.jsx`)

Use:
```js
const API = "http://localhost:10000/api";
```

## 10. Production Deployment Checklist
1. Store secrets in environment/secret manager.
2. Remove hardcoded DB and JWT secrets from source.
3. Restrict CORS to trusted domains only.
4. Enforce authentication on non-public endpoints.
5. Use HTTPS for all services.
6. Add centralized logging and health checks.
7. Add DB migration tooling (Flyway/Liquibase).
8. Configure backup and retention policies.

