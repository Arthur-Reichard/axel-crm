from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

key_env = os.getenv("SMTP_SECRET_KEY")
if key_env is None:
    raise ValueError("❌ SMTP_SECRET_KEY manquant dans .env")
key = key_env.encode()

fernet = Fernet(key)

def chiffrer(mot_de_passe: str) -> str:
    return fernet.encrypt(mot_de_passe.encode()).decode()

def dechiffrer(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()
