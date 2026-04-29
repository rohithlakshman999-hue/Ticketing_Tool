import os
import json
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

# Load env variables
load_dotenv()

router = APIRouter()

# Get API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

provider = "mock"
client = None

# Detect provider safely
if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
    provider = "openai"
    client = OpenAI(api_key=OPENAI_API_KEY)

elif GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIza"):
    provider = "gemini"
    genai.configure(api_key=GEMINI_API_KEY)

else:
    provider = "mock"


# ------------------- MODELS -------------------

class TextClassificationRequest(BaseModel):
    description: str


class ChatMessage(BaseModel):
    message: str


# ------------------- CLASSIFICATION -------------------

@router.post("/classify")
def classify_issue(req: TextClassificationRequest):

    if provider == "mock":
        return {
            "category": "Hardware",
            "priority": "medium",
            "mocked": True
        }

    prompt = f"""
You are an Expert IT Support Dispatcher.

Analyze this issue and return ONLY JSON:

{{
  "category": "Hardware | Software | Network",
  "priority": "low | medium | high"
}}

Description:
{req.description}
"""

    try:
        if provider == "openai":
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)

        elif provider == "gemini":
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)

            clean_text = (
                response.text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

            data = json.loads(clean_text)

        return {
            "category": data.get("category", "Other"),
            "priority": data.get("priority", "medium"),
            "mocked": False
        }

    except Exception as e:
        return {
            "category": "Software",
            "priority": "low",
            "error": str(e)
        }


# ------------------- CHATBOT -------------------

@router.post("/chat")
async def chatbot_reply(msg: ChatMessage):

    if provider == "mock":
        return {
            "reply": "⚠️ AI is in offline mode. Please configure your API key.",
            "mocked": True
        }

    system_prompt = """
You are 'Tech-Solve AI', a Tier 3 Senior Technical Support Engineer.

Rules:
1. Start with a short empathetic sentence.
2. Give 3–4 clear troubleshooting steps.
3. If hardware issue → suggest checking warranty.
4. Keep response concise and useful.
"""

    try:
        if provider == "openai":
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": msg.message}
                ]
            )
            reply = response.choices[0].message.content

        elif provider == "gemini":
            model = genai.GenerativeModel(
                "gemini-1.5-flash",
                system_instruction=system_prompt
            )
            response = model.generate_content(msg.message)
            reply = response.text

        return {"reply": reply}

    except Exception as e:
        return {
            "reply": f"⚠️ AI service error: {str(e)}"
        }