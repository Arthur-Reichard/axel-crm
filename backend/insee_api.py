# insee_api.py

import os
import httpx
from fastapi import APIRouter
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

INSEE_CLIENT_ID = os.getenv("INSEE_CLIENT_ID")
INSEE_CLIENT_SECRET = os.getenv("INSEE_CLIENT_SECRET")

router = APIRouter()

async def get_insee_token():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.insee.fr/token",
            data={"grant_type": "client_credentials"},
            auth=(INSEE_CLIENT_ID, INSEE_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code != 200:
            raise Exception("Erreur récupération token INSEE")
        return response.json()["access_token"]

@router.get("/insee/{siren}")
async def get_infos_insee(siren: str, utilisateur_id: str):
    from datetime import datetime
    import asyncpg
    from supabase import create_client
    import os

    DB_URL = os.getenv("DATABASE_URL")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # Récupération entreprise_id via utilisateur
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    res = supabase.table("utilisateurs").select("entreprise_id").eq("id", utilisateur_id).execute()
    entreprise_id = res.data[0]["entreprise_id"] if res.data else None

    if not entreprise_id:
        return {"error": "Impossible de déterminer entreprise_id"}

    # Récupération token INSEE
    token = await get_insee_token()

    # Requête INSEE - siren
    url_unite = f"https://api.insee.fr/entreprises/sirene/V3.11/siren/{siren}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url_unite, headers={"Authorization": f"Bearer {token}"})

    if response.status_code != 200:
        return {"error": "Erreur lors de l'appel à l'API INSEE"}

    data = response.json()
    unite_legale = data.get("uniteLegale", {})
    periode = unite_legale.get("periodesUniteLegale", [{}])[0]

    result = {
        "siren": unite_legale.get("siren"),
        "siret": None,  # mis à jour plus bas
        "raison_sociale": periode.get("denominationUniteLegale"),
        "forme_juridique": periode.get("categorieJuridiqueUniteLegale"),
        "capital_social": unite_legale.get("capitalSocial"),
        "date_immatriculation": periode.get("dateDebut"),
        "naf_code": periode.get("activitePrincipaleUniteLegale"),
        "naf_label": periode.get("nomenclatureActivitePrincipaleUniteLegale"),
        "statut_entreprise": periode.get("etatAdministratifUniteLegale"),
        "numero_rcs": None,
        "siege_social_rue": None,
        "siege_social_cp": None,
        "siege_social_ville": None,
        "siege_social_pays": "France",
        "date_derniere_mise_a_jour": unite_legale.get("dateDernierTraitementUniteLegale"),
        "categorie_juridique_code": periode.get("categorieJuridiqueUniteLegale"),
        "categorie_entreprise": unite_legale.get("categorieEntreprise"),
        "annee_categorie_entreprise": unite_legale.get("anneeCategorieEntreprise"),
        "entreprise_id": entreprise_id
    }

    # Requête INSEE - siret (pour le siège social)
    url_siege = f"https://api.insee.fr/entreprises/sirene/V3.11/siret?q=siren:{siren}&siege=true"
    async with httpx.AsyncClient() as client:
        response2 = await client.get(url_siege, headers={"Authorization": f"Bearer {token}"})

    if response2.status_code == 200:
        etablissements = response2.json().get("etablissements", [])
        if etablissements:
            etab = etablissements[0]
            adresse = etab.get("adresseEtablissement", {})
            result["siret"] = etab.get("siret")
            result["siege_social_rue"] = f"{adresse.get('numeroVoieEtablissement', '')} {adresse.get('typeVoieEtablissement', '')} {adresse.get('libelleVoieEtablissement', '')}".strip()
            result["siege_social_cp"] = adresse.get("codePostalEtablissement")
            result["siege_social_ville"] = adresse.get("libelleCommuneEtablissement")

    # Conversion des dates
    def to_date_safe(value):
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except:
            return None

    result["date_immatriculation"] = to_date_safe(result.get("date_immatriculation"))
    result["date_derniere_mise_a_jour"] = to_date_safe(result.get("date_derniere_mise_a_jour"))
    result["created_by"] = utilisateur_id

    # Insertion dans la BDD PostgreSQL
    try:
        conn = await asyncpg.connect(dsn=DB_URL, ssl="require")

        await conn.execute("""
            INSERT INTO entreprises_clients (
                siren, siret, raison_sociale, forme_juridique,
                capital_social, date_immatriculation,
                naf_code, naf_label, statut_entreprise, numero_rcs,
                siege_social_rue, siege_social_cp, siege_social_ville, siege_social_pays,
                date_derniere_mise_a_jour, categorie_juridique_code,
                categorie_entreprise, annee_categorie_entreprise,
                entreprise_id, created_by
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6,
                $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16,
                $17, $18,
                $19, $20
            )
            ON CONFLICT (siren) DO UPDATE SET
                siret = EXCLUDED.siret,
                raison_sociale = EXCLUDED.raison_sociale,
                forme_juridique = EXCLUDED.forme_juridique,
                capital_social = EXCLUDED.capital_social,
                date_immatriculation = EXCLUDED.date_immatriculation,
                naf_code = EXCLUDED.naf_code,
                naf_label = EXCLUDED.naf_label,
                statut_entreprise = EXCLUDED.statut_entreprise,
                numero_rcs = EXCLUDED.numero_rcs,
                siege_social_rue = EXCLUDED.siege_social_rue,
                siege_social_cp = EXCLUDED.siege_social_cp,
                siege_social_ville = EXCLUDED.siege_social_ville,
                siege_social_pays = EXCLUDED.siege_social_pays,
                date_derniere_mise_a_jour = EXCLUDED.date_derniere_mise_a_jour,
                categorie_juridique_code = EXCLUDED.categorie_juridique_code,
                categorie_entreprise = EXCLUDED.categorie_entreprise,
                annee_categorie_entreprise = EXCLUDED.annee_categorie_entreprise,
                entreprise_id = EXCLUDED.entreprise_id;
        """, result["siren"], result["siret"], result["raison_sociale"], result["forme_juridique"],
             result["capital_social"], result["date_immatriculation"], result["naf_code"], result["naf_label"],
             result["statut_entreprise"], result["numero_rcs"], result["siege_social_rue"],
             result["siege_social_cp"], result["siege_social_ville"], result["siege_social_pays"],
             result["date_derniere_mise_a_jour"], result["categorie_juridique_code"],
             result["categorie_entreprise"], result["annee_categorie_entreprise"], result["entreprise_id"], result["created_by"])

        await conn.close()

    except Exception as e:
        print("❌ Erreur lors de l’insertion en base :", e)
        return {"error": str(e)}

    return result