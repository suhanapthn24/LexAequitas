from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from flask import json
from openai import AsyncOpenAI
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'default_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="LexAequitas Legal Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    firm_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    firm_name: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Case Models
class CaseCreate(BaseModel):
    title: str
    case_number: str
    case_type: str  # civil, criminal, corporate, family
    client_name: str
    opposing_party: str
    court_name: str
    judge_name: Optional[str] = None
    next_hearing_date: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    case_type: Optional[str] = None
    client_name: Optional[str] = None
    opposing_party: Optional[str] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None
    next_hearing_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    title: str
    case_number: str
    case_type: str
    client_name: str
    opposing_party: str
    court_name: str
    judge_name: Optional[str] = None
    next_hearing_date: Optional[str] = None
    description: Optional[str] = None
    status: str
    user_id: str
    created_at: str
    updated_at: str

# Document Models
class DocumentCreate(BaseModel):
    title: str
    document_type: str  # contract, brief, motion, evidence, correspondence
    case_id: Optional[str] = None
    description: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    title: str
    document_type: str
    case_id: Optional[str] = None
    description: Optional[str] = None
    file_name: str
    file_size: int
    user_id: str
    created_at: str

# Compliance Alert Models
class ComplianceAlertCreate(BaseModel):
    title: str
    alert_type: str  # deadline, risk, procedural
    case_id: Optional[str] = None
    due_date: Optional[str] = None
    description: str
    priority: str = "medium"  # low, medium, high, critical

class ComplianceAlertResponse(BaseModel):
    id: str
    title: str
    alert_type: str
    case_id: Optional[str] = None
    due_date: Optional[str] = None
    description: str
    priority: str
    status: str
    user_id: str
    created_at: str

# Trial Simulation Models
class SimulationStart(BaseModel):
    case_type: str  # civil, criminal, corporate
    case_title: str
    case_description: str
    user_role: str = "plaintiff_attorney"  # plaintiff_attorney, defense_attorney

class ArgumentSubmit(BaseModel):
    session_id: str
    argument_text: str
    argument_type: str = "statement"  # statement, objection, evidence, cross_examination

class SimulationResponse(BaseModel):
    session_id: str
    case_type: str
    case_title: str
    status: str
    created_at: str

class ArgumentResponse(BaseModel):
    id: str
    session_id: str
    speaker: str
    content: str
    argument_type: str
    audio_base64: Optional[str] = None
    timestamp: str

class SimulationFeedback(BaseModel):
    session_id: str
    overall_score: int
    strengths: List[str]
    weaknesses: List[str]
    missed_objections: List[str]
    suggested_precedents: List[str]
    improvement_tips: List[str]

# ===================== HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "firm_name": user_data.firm_name,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            firm_name=user_data.firm_name,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            firm_name=user.get("firm_name"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        firm_name=current_user.get("firm_name"),
        created_at=current_user["created_at"]
    )

# ===================== CASE ROUTES =====================

@api_router.post("/cases", response_model=CaseResponse)
async def create_case(case_data: CaseCreate, current_user: dict = Depends(get_current_user)):
    case_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    case_doc = {
        "id": case_id,
        "user_id": current_user["id"],
        **case_data.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.cases.insert_one(case_doc)
    return CaseResponse(**{k: v for k, v in case_doc.items() if k != "_id"})

@api_router.get("/cases", response_model=List[CaseResponse])
async def get_cases(current_user: dict = Depends(get_current_user)):
    cases = await db.cases.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return [CaseResponse(**c) for c in cases]

@api_router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, current_user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": case_id, "user_id": current_user["id"]}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseResponse(**case)

@api_router.put("/cases/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, case_data: CaseUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in case_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cases.find_one_and_update(
        {"id": case_id, "user_id": current_user["id"]},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Case not found")
    
    result.pop("_id", None)
    return CaseResponse(**result)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cases.delete_one({"id": case_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Case deleted successfully"}

# ===================== DOCUMENT ROUTES =====================

@api_router.post("/documents", response_model=DocumentResponse)
async def upload_document(
    title: str,
    document_type: str,
    file: UploadFile = File(...),
    case_id: Optional[str] = None,
    description: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    doc = {
        "id": doc_id,
        "title": title,
        "document_type": document_type,
        "case_id": case_id,
        "description": description,
        "file_name": file.filename,
        "file_size": file_size,
        "file_content": base64.b64encode(content).decode('utf-8'),
        "content_type": file.content_type,
        "user_id": current_user["id"],
        "created_at": now
    }
    
    await db.documents.insert_one(doc)
    
    return DocumentResponse(
        id=doc_id,
        title=title,
        document_type=document_type,
        case_id=case_id,
        description=description,
        file_name=file.filename,
        file_size=file_size,
        user_id=current_user["id"],
        created_at=now
    )

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(case_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if case_id:
        query["case_id"] = case_id
    
    docs = await db.documents.find(query, {"_id": 0, "file_content": 0}).to_list(100)
    return [DocumentResponse(**d) for d in docs]

@api_router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    content = base64.b64decode(doc["file_content"])
    return StreamingResponse(
        io.BytesIO(content),
        media_type=doc.get("content_type", "application/octet-stream"),
        headers={"Content-Disposition": f"attachment; filename={doc['file_name']}"}
    )

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.documents.delete_one({"id": doc_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

# ===================== COMPLIANCE ALERT ROUTES =====================

@api_router.post("/alerts", response_model=ComplianceAlertResponse)
async def create_alert(alert_data: ComplianceAlertCreate, current_user: dict = Depends(get_current_user)):
    alert_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    alert_doc = {
        "id": alert_id,
        "user_id": current_user["id"],
        **alert_data.model_dump(),
        "status": "active",
        "created_at": now
    }
    
    await db.alerts.insert_one(alert_doc)
    return ComplianceAlertResponse(**{k: v for k, v in alert_doc.items() if k != "_id"})

@api_router.get("/alerts", response_model=List[ComplianceAlertResponse])
async def get_alerts(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if status:
        query["status"] = status
    
    alerts = await db.alerts.find(query, {"_id": 0}).to_list(100)
    return [ComplianceAlertResponse(**a) for a in alerts]

@api_router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.alerts.update_one(
        {"id": alert_id, "user_id": current_user["id"]},
        {"$set": {"status": "resolved"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved"}

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.alerts.delete_one({"id": alert_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}

# ===================== TRIAL SIMULATION ROUTES =====================

@api_router.post("/simulation/start", response_model=SimulationResponse)
async def start_simulation(sim_data: SimulationStart, current_user: dict = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "id": session_id,
        "user_id": current_user["id"],
        "case_type": sim_data.case_type,
        "case_title": sim_data.case_title,
        "case_description": sim_data.case_description,
        "user_role": sim_data.user_role,
        "status": "active",
        "arguments": [],
        "created_at": now
    }
    
    await db.simulations.insert_one(session_doc)
    
    return SimulationResponse(
        session_id=session_id,
        case_type=sim_data.case_type,
        case_title=sim_data.case_title,
        status="active",
        created_at=now
    )

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

@api_router.post("/simulation/argument", response_model=List[ArgumentResponse])
async def submit_argument(arg_data: ArgumentSubmit, current_user: dict = Depends(get_current_user)):

    session = await db.simulations.find_one(
        {"id": arg_data.session_id, "user_id": current_user["id"]},
        {"_id": 0}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Simulation session not found")

    responses = []
    now = datetime.now(timezone.utc).isoformat()

    # USER ARGUMENT
    user_arg = {
        "id": str(uuid.uuid4()),
        "session_id": arg_data.session_id,
        "speaker": "lawyer",
        "content": arg_data.argument_text,
        "argument_type": arg_data.argument_type,
        "timestamp": now
    }

    responses.append(ArgumentResponse(**user_arg, audio_base64=None))

    prev_args = session.get("arguments", [])[-10:]
    context = "\n".join([f"{a['speaker']}: {a['content']}" for a in prev_args])

    # DEFENSE RESPONSE
    defense_prompt = f"""
Previous arguments:
{context}

Opposing counsel: "{arg_data.argument_text}"

Respond as a Defense Attorney in a courtroom trial.
Be concise (2-4 sentences).
"""

    defense_completion = await openai_client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {"role": "system", "content": "You are a skilled defense attorney in a courtroom trial."},
            {"role": "user", "content": defense_prompt}
        ]
    )

    defense_response = defense_completion.choices[0].message.content.strip()

    defense_arg = {
        "id": str(uuid.uuid4()),
        "session_id": arg_data.session_id,
        "speaker": "defense",
        "content": defense_response,
        "argument_type": "response",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # DEFENSE AUDIO
    try:
        speech = await openai_client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="onyx",
            input=defense_response
        )
        defense_arg["audio_base64"] = speech.data
    except:
        defense_arg["audio_base64"] = None

    responses.append(ArgumentResponse(**defense_arg))

    # JUDGE RESPONSE
    judge_prompt = f"""
Previous arguments:
{context}

Lawyer: {arg_data.argument_text}
Defense: {defense_response}

As the Judge, give a short ruling or observation.
"""

    judge_completion = await openai_client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {"role": "system", "content": "You are an impartial judge presiding over a courtroom."},
            {"role": "user", "content": judge_prompt}
        ]
    )

    judge_response = judge_completion.choices[0].message.content.strip()

    judge_arg = {
        "id": str(uuid.uuid4()),
        "session_id": arg_data.session_id,
        "speaker": "judge",
        "content": judge_response,
        "argument_type": "ruling",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # JUDGE AUDIO
    try:
        speech = await openai_client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="sage",
            input=judge_response
        )
        judge_arg["audio_base64"] = speech.data
    except:
        judge_arg["audio_base64"] = None

    responses.append(ArgumentResponse(**judge_arg))

    # SAVE ARGUMENTS
    await db.simulations.update_one(
        {"id": arg_data.session_id},
        {"$push": {"arguments": {"$each": [user_arg, defense_arg, judge_arg]}}}
    )

    return responses

@api_router.post("/simulation/{session_id}/end", response_model=SimulationFeedback)
async def end_simulation(session_id: str, current_user: dict = Depends(get_current_user)):

    session = await db.simulations.find_one(
        {"id": session_id, "user_id": current_user["id"]},
        {"_id": 0}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Simulation session not found")

    arguments = session.get("arguments", [])
    lawyer_args = [a for a in arguments if a["speaker"] == "lawyer"]

    args_text = "\n".join([f"- {a['content']}" for a in lawyer_args])
    transcript = "\n".join([f"{a['speaker'].upper()}: {a['content']}" for a in arguments])

    feedback_prompt = f"""
Analyze this courtroom performance.

Lawyer arguments:
{args_text}

Full transcript:
{transcript}

Return JSON:

{{
 "overall_score": 1-100,
 "strengths": [],
 "weaknesses": [],
 "missed_objections": [],
 "suggested_precedents": [],
 "improvement_tips": []
}}
"""

    completion = await openai_client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {"role": "system", "content": "You are a legal trial performance coach."},
            {"role": "user", "content": feedback_prompt}
        ]
    )

    response_text = completion.choices[0].message.content

    try:
        feedback = json.loads(response_text)
    except:
        feedback = {
            "overall_score": 70,
            "strengths": ["Clear arguments"],
            "weaknesses": ["More evidence needed"],
            "missed_objections": [],
            "suggested_precedents": [],
            "improvement_tips": ["Strengthen legal citations"]
        }

    await db.simulations.update_one(
        {"id": session_id},
        {"$set": {"status": "completed", "feedback": feedback}}
    )

    return SimulationFeedback(session_id=session_id, **feedback)


@api_router.get("/simulation/history", response_model=List[SimulationResponse])
async def get_simulation_history(current_user: dict = Depends(get_current_user)):
    sessions = await db.simulations.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "id": 1, "case_type": 1, "case_title": 1, "status": 1, "created_at": 1}
    ).to_list(50)
    
    return [SimulationResponse(
        session_id=s["id"],
        case_type=s["case_type"],
        case_title=s["case_title"],
        status=s["status"],
        created_at=s["created_at"]
    ) for s in sessions]

@api_router.get("/simulation/{session_id}", response_model=dict)
async def get_simulation(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await db.simulations.find_one(
        {"id": session_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Simulation session not found")
    
    return session

# ===================== DASHBOARD STATS =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Count cases by status
    total_cases = await db.cases.count_documents({"user_id": user_id})
    active_cases = await db.cases.count_documents({"user_id": user_id, "status": "active"})
    
    # Count documents
    total_documents = await db.documents.count_documents({"user_id": user_id})
    
    # Count alerts
    active_alerts = await db.alerts.count_documents({"user_id": user_id, "status": "active"})
    critical_alerts = await db.alerts.count_documents({"user_id": user_id, "status": "active", "priority": "critical"})
    
    # Count simulations
    total_simulations = await db.simulations.count_documents({"user_id": user_id})
    
    # Get upcoming deadlines
    upcoming_cases = await db.cases.find(
        {"user_id": user_id, "next_hearing_date": {"$ne": None}},
        {"_id": 0, "title": 1, "next_hearing_date": 1, "case_number": 1}
    ).sort("next_hearing_date", 1).limit(5).to_list(5)
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "total_documents": total_documents,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "total_simulations": total_simulations,
        "upcoming_hearings": upcoming_cases
    }

# ===================== ROOT =====================

@api_router.get("/")
async def root():
    return {"message": "LexAequitas Legal Platform API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
