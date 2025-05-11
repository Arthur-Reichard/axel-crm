from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from uuid import UUID
import os
import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

# Chargement des variables d'environnement
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/axel-crm/oauth/callback"

router = APIRouter()

@router.get("/oauth/callback")
async def google_oauth_callback(request: Request):
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        print("[CALLBACK] Code =", code, "State =", state)

        if not code or not state:
            return JSONResponse(status_code=400, content={"error": "Code ou state manquant"})

        # Obtenir le token Google
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        print("[GOOGLE TOKEN RESPONSE]", token_resp.status_code, token_resp.text)

        if token_resp.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Erreur Google token"})

        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        # Obtenir l'email de l'utilisateur
        async with httpx.AsyncClient() as client:
            userinfo_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
        print("[GOOGLE USERINFO]", userinfo_resp.status_code, userinfo_resp.text)

        if userinfo_resp.status_code != 200:
            return JSONResponse(status_code=500, content={"error": "Erreur Google userinfo"})

        email = userinfo_resp.json().get("email")
        print("[EMAIL OBTENU]", email)

        utilisateur_uuid = UUID(state)

        # Vérifie si un compte email existe déjà
        existing = supabase.table("comptes_email") \
            .select("id") \
            .eq("utilisateur_id", str(utilisateur_uuid)) \
            .eq("fournisseur", "gmail") \
            .maybe_single().execute()

        if existing and existing.data:
            print("[UPDATE] Compte déjà existant, mise à jour en cours...")
            supabase.table("comptes_email").update({
                "email": email,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "etat_token": "valide"
            }).eq("id", existing.data["id"]).execute()
        else:
            print("[INSERT] Nouveau compte Gmail ajouté.")
            supabase.table("comptes_email").insert({
                "utilisateur_id": str(utilisateur_uuid),
                "fournisseur": "gmail",
                "email": email,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "etat_token": "valide"
            }).execute()

        return RedirectResponse(url=f"http://192.168.1.151:8888/axel-crm/Campagne/?oauth=success&utilisateur_id={state}")

    except Exception as e:
        print("[EXCEPTION]", e)
        return JSONResponse(status_code=500, content={"error": str(e)})