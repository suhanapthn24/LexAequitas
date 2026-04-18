"""
LexAequitas — Indian Legal Trial Simulator
Backend: FastAPI + OpenRouter (via OpenAI-compatible client)
New: /precedence/search — pull Indian case law by prompt or document
"""

import os
import re
import json
import tempfile
import logging
from pathlib import Path
from typing import Optional

import uvicorn
import pdfplumber
import dateparser
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from docx import Document as DocxDocument
from PIL import Image
import pytesseract
import spacy
from openai import OpenAI

# ─── Setup ────────────────────────────────────────────────────────────────────

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lexaequitas")

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)
MODEL = "openrouter/auto"

app = FastAPI(title="LexAequitas API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError("Run: python -m spacy download en_core_web_sm")


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ArgumentRequest(BaseModel):
    argument: str
    phase: Optional[str] = "Opening"
    case_type: Optional[str] = "Criminal"
    history: Optional[list] = []
    judge_name: Optional[str] = "Justice Sharma"
    defense_name: Optional[str] = "Adv. Mehta"
    prosecution_name: Optional[str] = "APP Singh"

class SimulationResponse(BaseModel):
    defense: str
    judge: str
    judge_ruling: str
    prosecution_confidence: int
    defense_confidence: int
    citations: list[str]
    ipc_sections: list[str]
    coaching_tip: str
    weaknesses: list[str]

class PrecedenceRequest(BaseModel):
    query: str                           # free-text prompt or extracted document text
    case_type: Optional[str] = "Criminal"
    ipc_sections: Optional[list[str]] = []
    max_results: Optional[int] = 5

class CaseSummaryRequest(BaseModel):
    text: str


# ─── Helper: LLM call ─────────────────────────────────────────────────────────

def llm(system: str, user: str, temperature: float = 0.75) -> str:
    """Single-call helper that returns raw text from the model."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=temperature,
    )
    return response.choices[0].message.content.strip()


def llm_json(system: str, user: str) -> dict:
    """LLM call that strips markdown fences and parses JSON."""
    raw = llm(system, user, temperature=0.4)
    raw = re.sub(r"^```json\s*|^```\s*|```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


# ─── Simulation Prompt ────────────────────────────────────────────────────────

def build_simulation_system(judge_name: str, defense_name: str, prosecution_name: str, phase: str, case_type: str) -> str:
    return f"""You are simulating a live {case_type} trial in an Indian Sessions Court.

The three participants are:
- PROSECUTION: {prosecution_name} — the lawyer arguing for the State
- DEFENSE: {defense_name} — the defense advocate representing the accused  
- JUDGE: {judge_name} — presiding Sessions Court / High Court judge

Current trial phase: {phase}

TONE AND STYLE RULES — this is critical:
- Write the defense and judge responses as if they are ACTUALLY SPEAKING in court right now
- Defense should sound like a sharp, experienced Indian advocate — assertive, tactical, occasionally sarcastic
- The judge should sound authoritative but fair — uses phrases like "Mr. {prosecution_name.split()[-1]}, the court notes...", "Counsel, this bench is not satisfied...", "Proceed, but mark my observation..."
- Do NOT write in third person — write what they actually SAY
- Defense may refer to the prosecution by name: "{prosecution_name.split()[-1]}"
- Both may address the court naturally: "My Lord", "Your Honour", "This court", "Learned counsel"
- The exchange should feel like a real courtroom transcript, not a summary

RESPONSE FORMAT — return ONLY valid JSON:
{{
  "defense": "<what {defense_name} actually says in court — 90-130 words — must cite at least 1 real SC/HC case by name>",
  "judge": "<what {judge_name} actually says — 50-80 words — gives ruling and observation>",
  "judge_ruling": "<one of: Objection sustained | Objection overruled | Reserved for orders | Noted on record | Proceed | This court directs>",
  "prosecution_confidence": <integer 0-100 reflecting strength of prosecution argument>,
  "defense_confidence": <integer 0-100>,
  "citations": [
    "<Full case citation: Party v. Party (Year) AIR/SCC — legal principle established>"
  ],
  "ipc_sections": [
    "<Section number and Act — what it covers in this context>"
  ],
  "coaching_tip": "<specific actionable tip for {prosecution_name} — what they should have done differently or should do next>",
  "weaknesses": [
    "<specific gap or vulnerability in the prosecution argument just made>"
  ]
}}

RULES:
- Only real Indian case law — Supreme Court, High Courts — cite AIR/SCC references where possible
- Confidence scores must be honest — a weak argument should score 35-50, not 70
- Defense ALWAYS counter-argues vigorously — that is their job
- Never fabricate citations — omit rather than invent
- Return ONLY the JSON object"""


def build_simulation_user(argument: str, history: list) -> str:
    history_block = ""
    if history:
        history_block = "\n\nPRIOR COURT EXCHANGE:\n"
        for h in history[-6:]:
            role = h.get("role", "").upper()
            content = h.get("content", "")
            history_block += f"[{role}]: {content}\n"

    return f"""{history_block}
{argument}

Now respond as all three participants. Return only JSON."""


# ─── Core Simulation Endpoint ─────────────────────────────────────────────────

@app.post("/simulation/argument", response_model=SimulationResponse)
async def simulate_argument(data: ArgumentRequest):
    if not data.argument.strip():
        raise HTTPException(400, "Argument cannot be empty")

    system = build_simulation_system(
        data.judge_name, data.defense_name, data.prosecution_name,
        data.phase, data.case_type
    )
    user = build_simulation_user(data.argument, data.history)

    try:
        parsed = llm_json(system, user)
        return SimulationResponse(
            defense=parsed.get("defense", ""),
            judge=parsed.get("judge", ""),
            judge_ruling=parsed.get("judge_ruling", "Noted on record"),
            prosecution_confidence=int(parsed.get("prosecution_confidence", 50)),
            defense_confidence=int(parsed.get("defense_confidence", 50)),
            citations=parsed.get("citations", []),
            ipc_sections=parsed.get("ipc_sections", []),
            coaching_tip=parsed.get("coaching_tip", ""),
            weaknesses=parsed.get("weaknesses", []),
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(500, "Model returned malformed response. Retry.")
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(500, str(e))


# ─── Precedence Search Service ────────────────────────────────────────────────

PRECEDENCE_SYSTEM = """You are an expert Indian legal research assistant with deep knowledge of:
- Supreme Court of India judgments (AIR, SCC, SCR series)
- High Court judgments across all Indian states
- Indian Penal Code, CrPC, Evidence Act, Constitution
- POCSO, NDPS, Prevention of Corruption Act, NI Act, Companies Act

Given a legal query or document extract, identify and return the most relevant Indian precedents.

Return ONLY valid JSON in this exact format:
{
  "precedents": [
    {
      "case_name": "Full case title (Petitioner v. Respondent)",
      "citation": "AIR YYYY SC/HC XXXX or (YYYY) X SCC XXX",
      "court": "Supreme Court of India / High Court name",
      "year": YYYY,
      "bench": "e.g. 3-Judge Bench / Constitution Bench",
      "key_principle": "The precise legal principle established — 2-3 sentences",
      "relevance": "Why this case directly applies to the query — 1-2 sentences",
      "favours": "Prosecution / Defense / Neutral",
      "ratio_decidendi": "The core ratio in plain language — 1 sentence",
      "judge_quote": "A memorable line from the judgment if you know it — or leave empty string"
    }
  ],
  "applicable_statutes": [
    {
      "section": "Section X of Act Y",
      "text_summary": "What this section says in plain language",
      "relevance": "How it applies here"
    }
  ],
  "legal_landscape": "A 3-4 sentence paragraph summarising the current state of Indian law on this issue",
  "strongest_precedent_for_prosecution": "Case name and why",
  "strongest_precedent_for_defense": "Case name and why"
}

STRICT RULES:
- Only cite cases you are certain exist — omit rather than fabricate
- Include constitutional bench decisions where applicable
- Note if a case has been overruled or distinguished
- Prefer recent judgments (post-2000) unless the older one is the landmark
- Return ONLY the JSON"""


@app.post("/precedence/search")
async def search_precedence(data: PrecedenceRequest):
    """
    Pull relevant Indian case law based on a text query or document extract.
    Accepts: free-text description, extracted document text, IPC sections.
    """
    sections_note = ""
    if data.ipc_sections:
        sections_note = f"\nIPC/statute sections in play: {', '.join(data.ipc_sections)}"

    user_prompt = f"""Find the most relevant Indian legal precedents for this {data.case_type} matter.

QUERY / DOCUMENT EXTRACT:
{data.query[:4000]}
{sections_note}

Return the top {data.max_results} most relevant precedents with full citation details."""

    try:
        parsed = llm_json(PRECEDENCE_SYSTEM, user_prompt)
        return parsed
    except json.JSONDecodeError:
        raise HTTPException(500, "Model returned malformed precedence data. Retry.")
    except Exception as e:
        logger.error(f"Precedence search error: {e}")
        raise HTTPException(500, str(e))


@app.post("/precedence/from-document")
async def precedence_from_document(file: UploadFile = File(...)):
    """
    Upload a FIR, chargesheet, judgment, or contract.
    Extracts text, identifies legal issues, and pulls relevant precedents.
    """
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        text = extract_text_from_file(tmp_path, file.filename)
        if not text.strip():
            raise HTTPException(400, "Could not extract text from document")

        # Step 1: identify legal issues in the document
        issues_prompt = f"""Read this Indian legal document and extract:
1. The core legal charges/issues
2. The IPC/CrPC sections mentioned or implied
3. The type of dispute

Document (first 2500 chars):
{text[:2500]}

Return a single JSON: {{"charges": [], "sections": [], "case_type": "", "summary": ""}}"""

        issues = llm_json("You are an Indian legal analyst. Return only valid JSON.", issues_prompt)

        # Step 2: search precedents based on extracted issues
        query = f"{issues.get('summary', text[:500])}\nCharges: {', '.join(issues.get('charges', []))}"
        prec_request = PrecedenceRequest(
            query=query,
            case_type=issues.get("case_type", "Criminal"),
            ipc_sections=issues.get("sections", []),
            max_results=6,
        )
        precedents = await search_precedence(prec_request)

        return {
            "filename": file.filename,
            "document_analysis": issues,
            "precedents": precedents,
        }
    finally:
        os.unlink(tmp_path)


# ─── Case Summary Endpoint ────────────────────────────────────────────────────

@app.post("/simulation/case-summary")
async def generate_case_summary(data: CaseSummaryRequest):
    system = "You are an Indian legal expert. Return only valid JSON with no markdown fences."
    user = f"""Analyse this case and return:
{{
  "charges": ["charge with IPC section"],
  "key_facts": ["important facts"],
  "applicable_law": ["IPC/CrPC/Act sections"],
  "landmark_precedents": ["Case name (Year) — principle"],
  "prosecution_strategy": "recommended approach",
  "defense_vulnerabilities": ["likely defense attacks"],
  "bail_likelihood": "High/Medium/Low — reasoning",
  "conviction_likelihood": "High/Medium/Low — reasoning"
}}

Case text:
{data.text}"""

    try:
        return llm_json(system, user)
    except Exception as e:
        raise HTTPException(500, str(e))


# ─── Document Analysis Endpoint ───────────────────────────────────────────────

def extract_text_from_file(tmp_path: str, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        return text.strip()
    elif ext in [".docx", ".doc"]:
        doc = DocxDocument(tmp_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
        return pytesseract.image_to_string(Image.open(tmp_path))
    else:
        raise HTTPException(400, f"Unsupported file type: {ext}")


def extract_parties(text: str) -> list:
    doc = nlp(text)
    parties, seen = [], set()
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG"] and ent.text.strip() not in seen and len(ent.text.strip()) > 2:
            seen.add(ent.text.strip())
            parties.append({"name": ent.text.strip(), "type": ent.label_})
    return parties[:20]


def extract_dates(text: str) -> list:
    doc = nlp(text)
    dates, seen = [], set()
    for ent in doc.ents:
        if ent.label_ == "DATE":
            raw = ent.text.strip()
            if raw.lower() in ["today", "tomorrow", "yesterday", "now"] or raw in seen:
                continue
            seen.add(raw)
            parsed_date = None
            try:
                p = dateparser.parse(raw)
                if p and p.year > 1900:
                    parsed_date = p.strftime("%Y-%m-%d")
            except Exception:
                pass
            dates.append({"raw": raw, "parsed": parsed_date, "context": ent.sent.text.strip()[:200]})
    return dates


def extract_clauses(text: str) -> dict:
    def find(patterns):
        results = []
        for pattern in patterns:
            for match in re.findall(pattern, text, re.IGNORECASE):
                clean = " ".join(match.split())[:150].strip()
                if clean and clean not in results:
                    results.append(clean)
        return results

    return {
        "obligations": find([r"shall\s[\w\s,]{10,80}", r"must\s[\w\s,]{10,80}", r"agrees to\s[\w\s,]{10,80}"]),
        "penalties": find([r"penalty of\s[\w\s,\$£₹\d]+", r"liable for\s[\w\s,\$£₹\d]+", r"fine of\s[\w\s,\$£₹\d]+"]),
        "jurisdiction": find([r"governed by the laws of\s[\w\s,]{5,60}", r"courts of\s[\w\s,]{5,60}"]),
        "termination": find([r"terminat\w+\s+on\s[\w\s,]{5,60}", r"expir\w+\s+on\s[\w\s,]{5,60}"]),
    }


@app.post("/analyse")
async def analyse_document(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        text = extract_text_from_file(tmp_path, file.filename)
        if not text.strip():
            raise HTTPException(400, "Could not extract text from document")

        system = "You are an Indian legal document analyst. Return only valid JSON."
        user = f"""Analyse this legal document:
{{
  "document_type": "FIR/Chargesheet/Judgment/Contract/Petition/etc",
  "ipc_sections_mentioned": [],
  "key_legal_issues": [],
  "strengths_for_prosecution": [],
  "strengths_for_defense": [],
  "recommended_arguments": []
}}

Document (first 3000 chars):
{text[:3000]}"""

        ai_analysis = llm_json(system, user)

        return {
            "filename": file.filename,
            "parties": extract_parties(text),
            "dates": extract_dates(text),
            "clauses": extract_clauses(text),
            "ai_legal_analysis": ai_analysis,
        }
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        os.unlink(tmp_path)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL, "service": "LexAequitas v2"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)