import os
import requests
import jwt
import datetime
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from typing import Optional
from dotenv import load_dotenv

# =====================================================
# INITIAL CONFIGURATION
# =====================================================

# Load .env file first (no-op if already set via OS environment)
load_dotenv()

# Fail fast: GROQ_API_KEY is mandatory.
_groq_api_key = os.environ.get("GROQ_API_KEY")
if not _groq_api_key:
    raise RuntimeError(
        "GROQ_API_KEY environment variable is not set. "
        "Add it to chatbot-backend/.env or export it before starting the server."
    )

# Spring Boot backend base URL.
# Set BACKEND_BASE_URL in .env for production; defaults to localhost for local dev only.
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:5000")

client = Groq(api_key=_groq_api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# DTO / REQUEST SCHEMAS
# =====================================================

class ChatRequest(BaseModel):
    message: str
    email: str
    sessionId: Optional[int] = None


# =====================================================
# IN-MEMORY SESSION STATE MANAGEMENT
# =====================================================

chat_memory = {}


def get_session_memory(session_id):
    if not session_id:
        return []

    if session_id not in chat_memory:
        chat_memory[session_id] = []

    return chat_memory[session_id]


def update_memory(session_id, user_msg, bot_msg):
    if not session_id:
        return

    memory = get_session_memory(session_id)
    memory.append({"role": "user", "content": user_msg})
    memory.append({"role": "assistant", "content": bot_msg})

    # Restrict sliding window memory to last 10 contextual messages
    chat_memory[session_id] = memory[-10:]


# =====================================================
# EXTERNAL SPRING BOOT SERVICE GATEWAY
# =====================================================

def create_chat_session(email, title):
    try:
        response = requests.post(
            f"{BACKEND_BASE_URL}/api/chat-session/create",
            json={"email": email, "title": title},
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print("SESSION CREATE ERROR:", e)
        return None


def save_session_message(session_id, sender, message):
    if not session_id:
        return
    try:
        requests.post(
            f"{BACKEND_BASE_URL}/api/chat-session/message",
            json={
                "sessionId": session_id,
                "sender": sender,
                "message": message,
                "allProjects": message,
            },
        )
    except Exception as e:
        print("SESSION MESSAGE ERROR:", e)


def save_chat_history(email, user_msg, bot_msg):
    try:
        requests.post(
            f"{BACKEND_BASE_URL}/api/chat-history/save",
            json={
                "email": email,
                "chatTitle": user_msg[:40],
                "userMessage": user_msg,
                "botMessage": bot_msg,
            },
        )
    except Exception as e:
        print("CHAT HISTORY ERROR:", e)


def save_and_return(email, user_msg, reply):
    save_chat_history(email, user_msg, reply)
    return {"reply": reply}


# =====================================================
# DETERMINISTIC RULE ENGINE FOR STATIC INPUTS
# =====================================================

def get_rule_based_answer(msg):
    msg = msg.lower().strip()

    if msg in ["hi", "hello", "hey"]:
        return "👋 Hey! I'm ArchiAI.\n\nHow can I help you today with your architecture projects or queries?"

    if "how are you" in msg:
        return "😄 I'm doing great and ready to manage your architectural workspace."

    return None


# =====================================================
# QUERY INTENT CLASSIFIER
# =====================================================

def detect_intent(message):
    msg = message.lower().strip()

    # Route navigation or standard documentation queries directly to LLM execution flow
    if "how to" in msg or "how do i" in msg or "steps to" in msg:
        return "general"

    # Route analytical, comparison or open-ended advice inquiries to LLM pipeline
    if any(x in msg for x in ["why", "why is it", "tell me more", "explain", "what should", "give solution", "how can i", "more details", "what happen", "what happened", "reason", "issue", "compare", "difference", "versus", "vs", "help", "complete"]):
        return "general"

    if any(x in msg for x in ["delayed", "delay", "late", "overdue"]):
        return "delayed"

    if any(x in msg for x in ["completed", "finished", "done"]):
        return "completed"

    if any(x in msg for x in ["pending", "waiting"]):
        return "pending"

    if any(x in msg for x in ["active", "running", "in progress"]):
        return "active"

    if any(x in msg for x in ["risk", "risky"]):
        return "risk"

    if any(x in msg for x in ["insight", "summary", "overview", "stats"]):
        return "insight"

    if any(x in msg for x in ["health", "score", "portfolio health"]):
        return "health"

    if any(x in msg for x in ["important", "priority project", "most important"]):
        return "important"

    if any(x in msg for x in ["nearest deadline", "closest deadline", "upcoming deadline"]):
        return "deadline"

    if any(x in msg for x in ["future risk", "future risky", "next month"]):
        return "future_risk"

    if any(x in msg for x in ["all projects", "show projects", "project list", "list projects"]):
        return "list"

    return "general"


# =====================================================
# JWT DECODING UTILS
# =====================================================

def extract_role(token):
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get("role")
    except:
        return None


# =====================================================
# PERSISTENCE DATA LAYER CONNECTORS
# =====================================================

def get_projects(email, token):
    headers = {"Authorization": f"Bearer {token}"}
    role = extract_role(token)

    url = (
        f"{BACKEND_BASE_URL}/api/projects/all"
        if role == "ADMIN"
        else f"{BACKEND_BASE_URL}/api/projects/{email}"
    )

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print("PROJECT FETCH ERROR:", e)
        return []


# =====================================================
# CORE ANALYTICAL PROCESSING ALGORITHMS
# =====================================================

def find_project(projects, message):
    message = message.lower()
    for project in projects:
        project_name = project.get("name", "").lower()
        if project_name and project_name in message:
            return project
    return None


def analyze_projects(projects):
    today = datetime.date.today()

    delayed = []
    risky = []
    completed = []
    pending = []
    inprogress = []

    for p in projects:
        name = p.get("name", "Unnamed")
        status = p.get("status", "")
        deadline = p.get("deadline", "")

        if status == "Completed":
            completed.append(name)
        elif status == "Pending":
            pending.append(name)
        elif status == "In Progress":
            inprogress.append(name)
        elif status == "Delayed":
            delayed.append(name)

        try:
            d = datetime.datetime.strptime(deadline, "%Y-%m-%d").date()
            if d < today and status != "Completed":
                risky.append(name)
        except:
            pass

    return delayed, risky, completed, pending, inprogress


def get_health_score(projects, delayed, completed):
    total = len(projects)
    if total == 0:
        return 100

    score = 100
    score -= len(delayed) * 15
    score += len(completed) * 5
    score = max(0, min(score, 100))
    return score


def get_most_important_project(projects):
    delayed = [p for p in projects if p.get("status") == "Delayed"]
    if delayed:
        return delayed[0]

    active = [p for p in projects if p.get("status") == "In Progress"]
    if active:
        return active[0]

    pending = [p for p in projects if p.get("status") == "Pending"]
    if pending:
        return pending[0]

    return None


def get_nearest_deadline(projects):
    valid = []
    for p in projects:
        try:
            deadline = datetime.datetime.strptime(p.get("deadline"), "%Y-%m-%d")
            valid.append((deadline, p))
        except:
            pass

    if not valid:
        return None

    valid.sort(key=lambda x: x[0])
    return valid[0][1]


def predict_future_risk(projects):
    today = datetime.date.today()
    risky = []

    for p in projects:
        try:
            deadline = datetime.datetime.strptime(p.get("deadline"), "%Y-%m-%d").date()
            days_left = (deadline - today).days
            if days_left <= 30 and p.get("status") != "Completed":
                risky.append(p.get("name"))
        except:
            pass

    return risky


def build_project_context(projects):
    if not projects:
        return "No projects found in user database."
    context = ""
    for p in projects:
        context += f"- Project Name: {p.get('name','N/A')}\n"
        context += f"  Status: {p.get('status','N/A')}\n"
        context += f"  Deadline: {p.get('deadline','N/A')}\n"
        context += f"  Budget: {p.get('budget','N/A')}\n"
        context += f"  Description: {p.get('description','N/A')}\n\n"
    return context


# =====================================================
# GROQ CONTEXT-AWARE GENERATION PIPELINE
# =====================================================

def get_ai_response(user_msg, email, projects=None, session_id=None):
    try:
        if user_msg.lower().strip() == "tell me more":
            user_msg = "Give only 3 additional descriptive points. Maximum 50 words. Do not repeat previous answer."

        memory = get_session_memory(session_id) if session_id else []
        project_context = build_project_context(projects) if projects else "No dynamic project data injected."
        today_str = datetime.date.today().strftime("%Y-%m-%d")

        system_prompt = f"""
        You are "ArchiAI", an advanced, intelligent AI Project Management Assistant specialized strictly for Architecture Projects workspace.
        Current System Date: {today_str}
        
        CRITICAL OPERATIONAL DIRECTIVES (STRICT ANTI-HALLUCINATION & GROUNDING):
        1. LIVE DATABASE STRICT GROUNDING (PROJECT ANALYTICS):
           - Rely ONLY on the provided [MySQL Live Database Data]. Do NOT invent, assume, or guess data records or status states.
           - NEVER ASSUME or state phrases like: "project is on track", "progress is being made", "progressing well", or "project will finish successfully" unless explicitly mentioned in the project description or context text. 
           - If a project status is "In Progress", state ONLY that it is "In Progress". Do not add speculative narratives about its internal pacing or current momentum.
           
        2. SYSTEM DOCUMENTATION & USER GUIDE MODE (APPLICATION FEATURES):
           - If a user asks questions about navigating or using the platform (e.g., how to add, edit, or delete projects, tasks, budgets, or manage profile settings), act as the official System Guide.
           - Provide crisp, clear, step-by-step instructions using bullet points or numbered lists based strictly on the [Application Feature Navigation Flows] provided below.
           - Do NOT refer to database limitations or dynamic data context when answering application feature guidance questions. Stick completely to the guide flows.

        3. NO SELF-GENERATED DATE LABELS:
           - Do NOT prefix or include phrases like "As of current date {today_str}" or "Based on the date {today_str}" in your conversational output text unless the user explicitly asks for today's date. Keep your responses seamless without repeating the system date label awkwardly.
           
        4. ADVANCED REASONING & ADVICE:
           - If the user asks for actions/advice (e.g., "What should I do to complete..."), read the baseline fields factually. If it is delayed or active, stick strictly to standard contextual project workflow suggestions (e.g., reassess timeline, review missing criteria) without pretending you have an internal checklist or tasks array tracker if it is not provided in the data.
           
        5. STRUCTURED COMPARISONS:
           - When comparing multiple projects, use clean Markdown tables with headers (Project Name | Status | Deadline | Budget/Description) to deliver crisp, professional visual analytics.

        [Application Feature Navigation Flows]
        • How to Add a Project:
          1. Go to the Sidebar / Navigation Menu and click on "Add Project".
          2. Fill in the required details: Project Name, Description, Deadline, and initial Estimated Budget.
          3. Click the "Save Project" or "Submit" button to save it to your workspace dashboard.

        • How to Edit a Project:
          1. Locate the specific Project Card on your main dashboard layout.
          2. Click on the Blue "Edit Icon" (pencil marker symbol) situated at the corner of that project card.
          3. Modify the desired fields (e.g., Name, Status, Description, or Target Date) and click "Update".

        • How to Delete a Project:
          1. Find the target Project Card on your workspace dashboard screen.
          2. Click on the Red "Delete Icon" (trash bin icon symbol) displayed on that card.
          3. Confirm the deletion action in the system pop-up confirmation modal to permanently erase the record.

        • How to Add a Task:
          1. Open the specific project's detailed view panel page.
          2. Navigate to the "Task Board" or "Tasks" sub-section and click the "Add New Task" trigger button.
          3. Enter the Task Name, assign a Priority Level, set deadlines if applicable, and hit "Save".

        • How to Edit/Update a Task:
          1. Go to the active project's Workspace view and locate the individual Task Board.
          2. Click the individual task card item or its specific configuration cogwheel/marker icon.
          3. Adjust the necessary status fields, check progress boxes, or use dropdown parameters to modify data.

        • How to Delete a Task:
          1. Under the project's task registry / board management layout, locate the specific task line item.
          2. Click the corresponding cross or remove/delete action trigger beside it.
          3. Confirm erasure inside the prompt dialog box.

        • Budget Management (Add / Update / Track Expenses):
          1. Open the specific Project Workspace panel or navigate directly to the Budget Tracking Dashboard view.
          2. To log costs or set budget targets, locate the "Expense / Budget Matrix Form".
          3. Insert the baseline amount, select the corresponding allocation category, and update to instantly review dynamic budget consumption status charts.

        • Profile Management (Update Profile / Settings):
          1. Click on the User Profile Area / User Avatar badge located at the top-right header corner (right next to the "Welcome Bunny" greeting).
          2. Select "Profile Settings" from the dropdown to update your profile details like Name, Email, or trigger a Secure Password Change.

        [MySQL Live Database Data]
        {project_context}
        """

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(memory)
        messages.append({"role": "user", "content": user_msg})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1,
            max_tokens=600,
        )

        reply = response.choices[0].message.content

        if session_id:
            update_memory(session_id, user_msg, reply)
            save_session_message(session_id, "user", user_msg)
            save_session_message(session_id, "bot", reply)

        return reply

    except Exception as e:
        print("AI ERROR:", e)
        return "⚠️ ArchiAI encountered an error processing your request. Please try again."


# =====================================================
# CONTROLLER ENDPOINT
# =====================================================

@app.post("/chat")
def chat(req: ChatRequest, authorization: str = Header(None)):
    if not authorization:
        return {"reply": "Unauthorized ❌"}

    token = authorization.replace("Bearer ", "")
    email = req.email
    msg = req.message.strip()
    session_id = req.sessionId

    # 1. Early return on static deterministic triggers
    rule = get_rule_based_answer(msg)
    if rule:
        if session_id:
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", rule)
        return {"reply": rule}

    # 2. Extract current datasets via context bindings
    projects = get_projects(email, token)
    if not projects:
        return {"reply": "No projects found ❌"}

    project = find_project(projects, msg)
    is_reasoning_or_special_query = any(
        x in msg.lower()
        for x in ["why", "explain", "compare", "what should", "how", "help", "complete", "reason", "issue", "status", "vs", "versus", "difference", "attention", "track", "progress"]
    )

    if project and not is_reasoning_or_special_query:
        reply = f"📁 *Project Details*\n\n*Name:* {project.get('name','N/A')}\n*Status:* {project.get('status','N/A')}\n*Deadline:* {project.get('deadline','N/A')}\n*Description:* {project.get('description','N/A')}"
        if session_id:
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    # 3. Quick-reply pipeline for structured card components
    delayed, risky, completed, pending, inprogress = analyze_projects(projects)
    intent = detect_intent(msg)

    if intent == "health":
        score = get_health_score(projects, delayed, completed)
        reply = f"📊 *Portfolio Health*\n\n*Score:* {score}/100\n\n✅ Completed: {len(completed)}\n🟡 Pending: {len(pending)}\n🔵 Active: {len(inprogress)}\n🔴 Delayed: {len(delayed)}"
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "insight":
        reply = f"📊 *Project Insights*\n\n*Total Projects:* {len(projects)}\n\n✅ Completed: {len(completed)}\n🟡 Pending: {len(pending)}\n🔵 In Progress: {len(inprogress)}\n🔴 Delayed: {len(delayed)}\n🚨 Risky: {len(risky)}"
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "delayed" and not is_reasoning_or_special_query:
        reply = "⚠️ *Delayed Projects*\n\n" + "\n".join([f"• {p}" for p in delayed]) if delayed else "✅ No delayed projects."
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "risk" and not is_reasoning_or_special_query:
        if not risky:
            return {"reply": "✅ No risky projects."}
        reply = "🚨 *Risky Projects*\n\n"
        for p in projects:
            if p.get("name") in risky:
                reply += f"• {p.get('name')} (Deadline: {p.get('deadline')})\n"
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "important":
        p = get_most_important_project(projects)
        if p:
            reply = f"🔥 *Most Important Project*\n\n*Name:* {p.get('name')}\n*Status:* {p.get('status')}\n*Deadline:* {p.get('deadline')}"
            if session_id: 
                save_session_message(session_id, "user", msg)
                save_session_message(session_id, "bot", reply)
            return {"reply": reply}

    if intent == "deadline":
        p = get_nearest_deadline(projects)
        if p:
            reply = f"📅 *Nearest Deadline*\n\n*Project:* {p.get('name')}\n*Deadline:* {p.get('deadline')}"
            if session_id: 
                save_session_message(session_id, "user", msg)
                save_session_message(session_id, "bot", reply)
            return {"reply": reply}

    if intent == "future_risk":
        future_risk = predict_future_risk(projects)
        reply = "🚨 *Future Risk Projects*\n\n" + "\n".join([f"• {p}" for p in future_risk]) if future_risk else "✅ No future risk detected."
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "completed":
        reply = "✅ *Completed Projects*\n\n" + "\n".join([f"• {p}" for p in completed]) if completed else "No completed projects."
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "pending":
        reply = "🟡 *Pending Projects*\n\n" + "\n".join([f"• {p}" for p in pending]) if pending else "No pending projects."
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "active":
        reply = "🔵 *Active Projects*\n\n" + "\n".join([f"• {p}" for p in inprogress]) if inprogress else "No active projects."
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    if intent == "list":
        names = [p.get("name", "Unnamed") for p in projects]
        reply = "📁 *All Projects*\n\n" + "\n".join([f"• {n}" for n in names])
        if session_id: 
            save_session_message(session_id, "user", msg)
            save_session_message(session_id, "bot", reply)
        return {"reply": reply}

    # 4. Fallback execution to standard generative inference engine
    ai_reply = get_ai_response(msg, email, projects, session_id)
    save_chat_history(email, msg, ai_reply)
    
    return {"reply": ai_reply}