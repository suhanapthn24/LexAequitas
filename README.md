LexAequitas

Architecture:
- `frontend` (React)
- `new_folder/backend-java` (Spring Boot)
- `new_folder/ai-service` (Python FastAPI)

## Documentation Pack
- `docs/FULL_DOCUMENTATION.md`
- `docs/USER_MANUAL.md`
- `docs/DEPLOYMENT_INSTRUCTIONS.md`
- `docs/CODE_DIRECTORY_STRUCTURE.md`
- `docs/ACTUAL_CODE_AND_ASSETS.md`
- `docs/SOURCE_FILE_INDEX.txt`
- `docs/database/schema.sql`
- `docs/database/seed.sql`

## Quick Start
Run AI service:
```bash
cd new_folder/ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --host 0.0.0.0 --port 8000
```

Run Java backend:
```bash
cd new_folder/backend-java
mvn spring-boot:run
```

Run frontend:
```bash
cd frontend
npm install
npm start
```
