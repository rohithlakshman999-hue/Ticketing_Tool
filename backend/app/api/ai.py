import os
import json
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

# Detect and configure AI provider
api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or "mock-key"
provider = "none"

if api_key.startswith("sk-"):
    provider = "openai"
    client = OpenAI(api_key=api_key)
elif api_key.startswith("AIza"):
    provider = "gemini"
    genai.configure(api_key=api_key)
else:
    provider = "mock"

class TextClassificationRequest(BaseModel):
    description: str

class ChatMessage(BaseModel):
    message: str

@router.post("/classify")
def classify_issue(req: TextClassificationRequest):
    if provider == "mock":
        return {"category": "Hardware", "priority": "medium", "mocked": True}
        
    prompt = f"""You are an Expert IT Support Dispatcher.
Analyze this issue and return ONLY a JSON object with 'category' (Hardware, Software, Network) and 'priority' (low, medium, high).
Description: {req.description}"""

    try:
        if provider == "openai":
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
        else:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_text)
            
        return {"category": data.get("category", "Other"), "priority": data.get("priority", "medium"), "mocked": False}
    except Exception as e:
        return {"category": "Software", "priority": "low", "error": str(e)}

@router.post("/chat")
async def chatbot_reply(msg: ChatMessage):
    if provider == "mock":
        return {"reply": "I'm in offline mode. Please check your AI API key configuration in the .env file.", "mocked": True}

    system_prompt = """You are 'Tech-Solve AI', a Tier 3 Senior Technical Support Engineer.
Your goal is to provide 'proper solutions'—meaning expert, step-by-step, and technically accurate troubleshooting.
Rules:
1. Always start with a brief empathetic sentence.
2. Provide 3-4 numbered technical steps.
3. If the issue sounds like hardware failure, suggest checking the warranty in the 'Devices' section.
4. Keep the total response concise but high-value."""

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
        else:
            model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_prompt)
            response = model.generate_content(msg.message)
            reply = response.text
            
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Technical diagnostic failed: {str(e)}"}
