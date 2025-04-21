from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from send_email import envoyer_email

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.1.151:8888"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

class EmailRequest(BaseModel):
    to: str
    subject: str
    html: str

@app.post("/send-email")
async def send_email_endpoint(payload: EmailRequest):
    try:
        await envoyer_email(payload.to, payload.subject, payload.html)
        return {"status": "ok"}
    except Exception as e:
        print("Erreur envoi email:", e)
        return {"status": "error", "detail": str(e)}