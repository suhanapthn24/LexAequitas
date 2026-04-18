# LexAequitas — Indian Legal Trial Simulator
## Architecture & Setup Guide

### System Architecture

```
React Frontend (port 3000)
        │
        ▼ HTTP
Spring Boot Gateway (port 8080)     ← Java — /api/simulation/*
        │
        ▼ HTTP
FastAPI AI Backend (port 8000)      ← Python — /simulation/argument
        │
        ▼ HTTPS
Anthropic Claude API                ← claude-opus-4-5 (custom LLM)
```

**Why this design?**
- Spring Boot acts as the secure gateway — auth, rate limiting, audit logging go here
- FastAPI handles all AI orchestration — prompt engineering, response parsing
- Anthropic Claude is the LLM — no open-source model, full compliance, data never leaves Anthropic's API

---

### Compliance Notes

| Concern             | How it's addressed                                              |
|---------------------|-----------------------------------------------------------------|
| Data residency      | Anthropic API — review Anthropic's DPA for your region          |
| No model weights    | We call the API — no local model, no weight storage             |
| Audit trail         | Log all arguments + responses in Spring Boot before forwarding  |
| No training on data | Anthropic does not train on API requests by default             |
| API key security    | Stored in `.env`, never committed, never exposed to frontend    |

---

### 1. Python Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Create .env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run
python main.py
# → http://localhost:8000
```

---

### 2. Spring Boot Setup (pom.xml dependencies)

Add to your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```

Run:
```bash
mvn spring-boot:run
# → http://localhost:8080
```

---

### 3. React Frontend Setup

```bash
cd frontend

npm install axios

# Copy TrialSimulationPage.jsx into your src/pages/ directory
# Add route in your App.jsx:
# <Route path="/simulation" element={<TrialSimulationPage />} />

npm run dev
# → http://localhost:3000
```

---

### 4. API Reference

#### POST /api/simulation/argue
```json
{
  "argument": "The accused is charged under Section 302 IPC...",
  "phase": "Opening",
  "case_type": "Criminal",
  "history": []
}
```

**Response:**
```json
{
  "defense": "The defense submits that...",
  "judge": "Having heard both sides...",
  "judge_ruling": "Objection overruled",
  "prosecution_confidence": 72,
  "defense_confidence": 58,
  "citations": ["State of Maharashtra v. Champalal (1981) SC — ..."],
  "ipc_sections": ["Section 302 IPC — punishment for murder"],
  "coaching_tip": "Strengthen chain of custody for the firearm...",
  "weaknesses": ["No forensic evidence linking accused to weapon"]
}
```

#### POST /api/simulation/case-summary
```json
{ "text": "raw case document text..." }
```

#### POST /analyse  (direct to Python, port 8000)
Multipart file upload — PDF, DOCX, or image.

---

### 5. Training Data Strategy (Indian Legal Corpus)

To further customize the LLM's responses for Indian law without fine-tuning:

**Option A — RAG with System Prompt Injection (Recommended)**
1. Download Indian Kanoon judgments (CC-BY licensed)
2. Chunk and embed using `text-embedding-3-large`
3. On each argument, retrieve top-5 relevant judgments
4. Inject them into the Claude system prompt as context
5. Claude will cite them accurately in responses

**Option B — Claude's Built-in Knowledge**
Claude already has strong knowledge of Indian case law up to its training cutoff.
The current system prompt instructs it to use this knowledge rigorously.

**Option C — Fine-tuning (Future)**
Anthropic offers fine-tuning for enterprise customers.
Contact Anthropic sales for a custom model trained on your legal corpus.

---

### 6. Fixes Applied to Original Code

| File | Bug | Fix |
|------|-----|-----|
| main.py | `gpt-5.2` doesn't exist | Replaced with Anthropic Claude |
| main.py | `client.responses.create` wrong API | Replaced with `anthropic.Anthropic().messages.create` |
| main.py | `from sympy import re` | Removed — use stdlib `import re` |
| main.py | `from tkinter import Image` | Fixed to `from PIL import Image` |
| main.py | `make_parser.parse()` is XML, not date | Replaced with `dateparser.parse()` |
| SimulationService.java | Returns raw String, no error handling | Returns `Map<String,Object>`, full error handling |
| SimulationController.java | No CORS, no input validation | Added `@CrossOrigin`, null checks, 503 handling |
| TrialSimulationPage.jsx | No history/context sent | Full multi-turn history with phase/case_type |
