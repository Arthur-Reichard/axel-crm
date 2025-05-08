import os
import requests
import base64
from email.mime.text import MIMEText
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

from security import chiffrer, dechiffrer
from send_email import envoyer_email

load_dotenv()

# 🔧 Config Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 🔧 Config Google (via .env uniquement)
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# 🔧 Config Outlook (via .env uniquement)
OUTLOOK_CLIENT_ID = os.getenv("OUTLOOK_CLIENT_ID")
OUTLOOK_CLIENT_SECRET = os.getenv("OUTLOOK_CLIENT_SECRET")

# 🚀 Init FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.1.151:8888"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔁 Refresh Gmail
def refresh_access_token(refresh_token):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    response = requests.post(token_url, data=data)
    return response.json()

# 🔁 Refresh Outlook
def refresh_access_token_outlook(refresh_token):
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = {
        "client_id": OUTLOOK_CLIENT_ID,
        "client_secret": OUTLOOK_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "scope": "Mail.Send User.Read"
    }
    response = requests.post(token_url, data=data)
    return response.json()

# 📤 Envoi Gmail
def envoyer_message_gmail(access_token, sender, to, subject, html_content):
    message = MIMEText(html_content, "html")
    message["to"] = to
    message["from"] = sender
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    gmail_api_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    return requests.post(gmail_api_url, headers=headers, json={"raw": raw})

def send_outlook_email(access_token, to, subject, html_content):
    endpoint = "https://graph.microsoft.com/v1.0/me/sendMail"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    message = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_content
            },
            "toRecipients": [{"emailAddress": {"address": to}}]
        },
        "saveToSentItems": "true"
    }
    return requests.post(endpoint, headers=headers, json=message)

@app.post("/send-email-universel")
async def send_email_universel(request: Request):
    body = await request.json()
    utilisateur_id = body["utilisateur_id"]
    to = body["to"]
    subject = body["subject"]
    html_content = body["html"]

    compte = supabase.from_("comptes_email").select("*").eq("utilisateur_id", utilisateur_id).single().execute()
    if compte.error or not compte.data:
        return {"status": "error", "detail": "Aucun compte email trouvé"}

    fournisseur = compte.data["fournisseur"]
    sender = compte.data["email"]
    access_token = compte.data.get("access_token")
    refresh_token = compte.data.get("refresh_token")

    if fournisseur == "gmail":
        response = envoyer_message_gmail(access_token, sender, to, subject, html_content)
        if response.status_code == 401 and refresh_token:
            new_tokens = refresh_access_token(refresh_token)
            if "access_token" in new_tokens:
                access_token = new_tokens["access_token"]
                supabase.table("comptes_email").update({
                    "access_token": access_token,
                    "etat_token": "valide"
                }).eq("id", compte.data["id"]).execute()
                response = envoyer_message_gmail(access_token, sender, to, subject, html_content)
            else:
                supabase.table("comptes_email").update({"etat_token": "expiré"}).eq("id", compte.data["id"]).execute()

    elif fournisseur == "outlook":
        response = send_outlook_email(access_token, to, subject, html_content)
        if response.status_code == 401 and refresh_token:
            new_tokens = refresh_access_token_outlook(refresh_token)
            if "access_token" in new_tokens:
                access_token = new_tokens["access_token"]
                supabase.table("comptes_email").update({
                    "access_token": access_token,
                    "etat_token": "valide"
                }).eq("id", compte.data["id"]).execute()
                response = send_outlook_email(access_token, to, subject, html_content)
            else:
                supabase.table("comptes_email").update({"etat_token": "expiré"}).eq("id", compte.data["id"]).execute()

    elif fournisseur == "smtp":
        smtp_config = supabase.from_("smtp_config").select("*").eq("utilisateur_id", utilisateur_id).single().execute()
        if smtp_config.error or not smtp_config.data:
            return {"status": "error", "detail": "Pas de configuration SMTP"}

        try:
            smtp_host = smtp_config.data["host"]
            smtp_port = smtp_config.data["port"]
            smtp_user = smtp_config.data["username"]
            smtp_pass = dechiffrer(smtp_config.data["password_encrypted"])

            await envoyer_email(to, subject, html_content, smtp_host, smtp_port, smtp_user, smtp_pass)
            response = type("Response", (), {"status_code": 200, "json": lambda: {"id": "smtp-" + to}})
        except Exception as e:
            print("❌ Erreur SMTP :", str(e))
            return {"status": "error", "detail": str(e)}

    else:
        return {"status": "error", "detail": "Fournisseur non supporté"}

    if response.status_code not in (200, 202):
        print("❌ Erreur :", response.text)
        return {"status": "error", "detail": response.text}

    return {"status": "ok", "message_id": response.json().get("id")}


@app.get("/oauth/callback")
async def google_oauth_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        return {"error": "Code manquant"}

    # Pour l'instant, juste un test
    print("✅ Code reçu depuis Google :", code)

    return RedirectResponse(url="http://localhost:3000/axel-crm/Campagne")

@app.post("/smtp/connect")
async def connect_smtp(request: Request):
    data = await request.json()
    utilisateur_id = data["utilisateur_id"]
    host = data["host"]
    port = data["port"]
    username = data["username"]
    password = data["password"]

    encrypted_pw = chiffrer(password)

    supabase.table("smtp_config").upsert({
        "utilisateur_id": utilisateur_id,
        "host": host,
        "port": port,
        "username": username,
        "password_encrypted": encrypted_pw,
    }, on_conflict=["utilisateur_id"]).execute()

    supabase.table("comptes_email").upsert({
        "utilisateur_id": utilisateur_id,
        "fournisseur": "smtp",
        "email": username,
        "etat_token": "valide"
    }, on_conflict=["utilisateur_id", "fournisseur"]).execute()

    return {"status": "ok"}
