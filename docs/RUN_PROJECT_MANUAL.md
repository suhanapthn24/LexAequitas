# LexAequitas Local Run Manual

This guide starts from a fresh machine setup and ends with the React frontend, Spring Boot backend, PostgreSQL database, and FastAPI AI service running locally.

## 1. Required Software

Install these before running the project:

- Git
- Node.js 18+ and npm
- Java 17+
- Maven 3.9+
- Python 3.10+
- PostgreSQL 14+
- Tesseract OCR, required for image/PDF text extraction in the AI service

Verify the main tools:

```powershell
node --version
npm --version
java --version
mvn --version
python --version
psql --version
```

## 2. Get the Project

```powershell
git clone <repo-url>
cd lexaequitas
```

If you already have the project folder, open a terminal at the repository root:

```powershell
cd "path\to\project"
```

## 3. Set Up PostgreSQL

The current Spring Boot configuration expects:

- Host: `localhost`
- Port: `5432`
- Database: `lexaequitas`
- Username: `postgres`
- Password: `0000`

These values are configured in:

```text
new_folder/backend-java/src/main/resources/application.properties
```

### Option A: Use the Current Default Credentials

Open PostgreSQL's `psql` shell as an admin/superuser and run:

```sql
CREATE DATABASE lexaequitas;
ALTER USER postgres WITH PASSWORD '0000';
```

Then from the repository root, apply the schema:

```powershell
psql -U postgres -d lexaequitas -f docs/database/schema.sql
```

Load sample development data:

```powershell
psql -U postgres -d lexaequitas -f docs/database/seed.sql
```

### Option B: Use Your Own Database User

In `psql`, create a database and user:

```sql
CREATE DATABASE lexaequitas;
CREATE USER lexaequitas_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE lexaequitas TO lexaequitas_user;
```

Apply the database scripts:

```powershell
psql -U lexaequitas_user -d lexaequitas -f docs/database/schema.sql
psql -U lexaequitas_user -d lexaequitas -f docs/database/seed.sql
```

Then update `new_folder/backend-java/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/lexaequitas
spring.datasource.username=lexaequitas_user
spring.datasource.password=your_password_here
```

## 4. Run the AI Service

The AI service lives in:

```text
new_folder/ai-service
```

Create and activate a virtual environment:

```powershell
cd new_folder/ai-service
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create a `.env` file in `new_folder/ai-service`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Run the service:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

Expected local URL:

```text
http://localhost:8000
```

## 5. Point the Java Backend to the Local AI Service

Some backend services currently call the deployed AI service:

```text
https://mpj-backend-python.onrender.com
```

For a fully local setup, change those URLs to:

```text
http://localhost:8000
```

Check these files:

```text
new_folder/backend-java/src/main/java/com/lexaequitas/service/SimulationService.java
new_folder/backend-java/src/main/java/com/lexaequitas/service/PrecedenceService.java
new_folder/backend-java/src/main/java/com/lexaequitas/service/DocumentAnalyzerService.java
```

## 6. Run the Spring Boot Backend

Open a new terminal from the repository root:

```powershell
cd new_folder/backend-java
mvn spring-boot:run
```

Expected local URL:

```text
http://localhost:10000
```

The backend API base path is:

```text
http://localhost:10000/api
```

If the backend fails to connect to the database, confirm:

- PostgreSQL is running.
- The `lexaequitas` database exists.
- The username and password in `application.properties` match your PostgreSQL setup.
- The schema was applied using `docs/database/schema.sql`.

## 7. Point the Frontend to the Local Backend

Several frontend files currently point to the deployed backend:

```text
https://mpj-backend-java.onrender.com/api
```

For local development, update them to:

```text
http://localhost:10000/api
```

Files to check:

```text
frontend/src/config.js
frontend/src/context/AuthContext.jsx
frontend/src/pages/CaseManagementPage.jsx
frontend/src/pages/TrialSimulationPage.jsx
frontend/src/pages/ComplianceAlertsPage.jsx
frontend/src/pages/DocumentCenterPage.jsx
```

For `frontend/src/config.js`, use:

```js
const BASE_URL = "http://localhost:10000";

export default BASE_URL;
```

## 8. Run the React Frontend

Open another terminal from the repository root:

```powershell
cd frontend
npm install
npm start
```

Expected local URL:

```text
http://localhost:3000
```

## 9. Recommended Startup Order

Start the services in this order:

1. PostgreSQL
2. FastAPI AI service on `http://localhost:8000`
3. Spring Boot backend on `http://localhost:10000`
4. React frontend on `http://localhost:3000`

## 10. Quick Verification

Check the database tables:

```powershell
psql -U postgres -d lexaequitas -c "\dt"
```

Check sample data:

```powershell
psql -U postgres -d lexaequitas -c "SELECT id, email, name FROM users;"
psql -U postgres -d lexaequitas -c "SELECT id, title, status FROM cases;"
```

Check the AI service:

```powershell
curl http://localhost:8000/docs
```

Check the backend:

```powershell
curl http://localhost:10000/api/cases
```

Open the frontend:

```text
http://localhost:3000
```

## 11. Common Issues

### Database authentication fails

Update `spring.datasource.username` and `spring.datasource.password` in `application.properties`, or create the PostgreSQL user/password expected by the current config.

### Backend starts but frontend cannot call APIs

Make sure every frontend API constant points to:

```text
http://localhost:10000/api
```

Also confirm the backend is running on port `10000`.

### AI features call the deployed service instead of local service

Replace the deployed Python URL in the Java service files with:

```text
http://localhost:8000
```

Restart the Spring Boot backend after changing Java files.

### spaCy model error

Run this inside the AI service virtual environment:

```powershell
python -m spacy download en_core_web_sm
```

### Tesseract OCR error

Install Tesseract and make sure the executable is available on your system `PATH`.

### Port already in use

Stop the process using the port or change the service port:

- AI service: change the `--port` value in the `uvicorn` command.
- Backend: change `server.port` in `application.properties`.
- Frontend: Create React App will usually ask to use another port automatically.

