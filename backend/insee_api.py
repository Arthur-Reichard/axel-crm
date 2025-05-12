# insee_api.py

import os
import httpx
from fastapi import APIRouter
from dotenv import load_dotenv
import ssl

load_dotenv()

cert_path = os.path.join(os.path.dirname(__file__), '..', 'certs', 'global-bundle.pem')
ssl_context = ssl.create_default_context(cafile=os.path.abspath(cert_path))


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
async def get_infos_insee(siren: str):
    token = await get_insee_token()

    # ➤ Appel à /siren/{siren}
    url_unite = f"https://api.insee.fr/entreprises/sirene/V3.11/siren/{siren}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url_unite, headers={"Authorization": f"Bearer {token}"})

    if response.status_code != 200:
        return {"error": "Erreur lors de l'appel à l'API INSEE"}

    data = response.json()
    unite_legale = data.get("uniteLegale", {})
    periode = unite_legale.get("periodesUniteLegale", [{}])[0]

    result = {
        "raison_sociale": periode.get("denominationUniteLegale"),
        "siren": unite_legale.get("siren"),
        "forme_juridique": periode.get("categorieJuridiqueUniteLegale"),
        "capital_social": unite_legale.get("capitalSocial"),
        "date_immatriculation": periode.get("dateDebut"),
        "naf_code": periode.get("activitePrincipaleUniteLegale"),
        "naf_label": periode.get("nomenclatureActivitePrincipaleUniteLegale"),
        "statut_entreprise": periode.get("etatAdministratifUniteLegale"),
        "categorie_juridique_code": periode.get("categorieJuridiqueUniteLegale"),
        "categorie_entreprise": unite_legale.get("categorieEntreprise"),
        "annee_categorie_entreprise": unite_legale.get("anneeCategorieEntreprise"),
        "date_derniere_mise_a_jour": unite_legale.get("dateDernierTraitementUniteLegale")
    }

    # ➤ Appel à /siret pour adresse
    url_siege = f"https://api.insee.fr/entreprises/sirene/V3.11/siret?q=siren:{siren}&siege=true"
    async with httpx.AsyncClient() as client:
        response2 = await client.get(url_siege, headers={"Authorization": f"Bearer {token}"})

    if response2.status_code == 200:
        siege_data = response2.json()
        etablissements = siege_data.get("etablissements", [])
        if etablissements:
            etab = etablissements[0]
            adresse = etab.get("adresseEtablissement", {})
            result["siret"] = etab.get("siret")
            result["siege_social_rue"] = f"{adresse.get('numeroVoieEtablissement', '')} {adresse.get('typeVoieEtablissement', '')} {adresse.get('libelleVoieEtablissement', '')}".strip()
            result["siege_social_cp"] = adresse.get("codePostalEtablissement")
            result["siege_social_ville"] = adresse.get("libelleCommuneEtablissement")
            result["siege_social_pays"] = "France"

    # ✅ C'est ici que tu AJOUTES le code asyncpg
    import asyncpg
    import os
    DB_URL = os.getenv("DATABASE_URL")

    try:
        import ssl
        ssl_context = ssl.create_default_context()
        conn = await asyncpg.connect(dsn=DB_URL, ssl=ssl_context)


        await conn.execute("""
            INSERT INTO entreprises_clients (
                siren, siret, raison_sociale, forme_juridique,
                capital_social, date_immatriculation,
                naf_code, naf_label, statut_entreprise, numero_rcs,
                siege_social_rue, siege_social_cp, siege_social_ville, siege_social_pays,
                date_derniere_mise_a_jour, categorie_juridique_code, categorie_entreprise, annee_categorie_entreprise
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6,
                $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16, $17, $18
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
                annee_categorie_entreprise = EXCLUDED.annee_categorie_entreprise;
        """, result["siren"], result.get("siret"), result["raison_sociale"], result["forme_juridique"],
             result.get("capital_social"), result.get("date_immatriculation"),
             result.get("naf_code"), result.get("naf_label"), result.get("statut_entreprise"), result.get("numero_rcs"),
             result.get("siege_social_rue"), result.get("siege_social_cp"),
             result.get("siege_social_ville"), result.get("siege_social_pays"),
             result.get("date_derniere_mise_a_jour"),
             result.get("categorie_juridique_code"),
             result.get("categorie_entreprise"),
             result.get("annee_categorie_entreprise"))

        await conn.close()

    except Exception as e:
        print("❌ Erreur lors de l’insertion en base :", e)

    # ➤ Enfin, retourne le JSON au frontend
    return result