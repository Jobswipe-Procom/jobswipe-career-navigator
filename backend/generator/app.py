import json
import os
import sys
import base64
import traceback
import time
from dotenv import load_dotenv
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ajout du dossier courant au path pour garantir l'import du module functions
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from functions.generator_service import JobSwipeGeneratorService
from functions.matcher_engine import batch_match_offers

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

app = FastAPI(title="JobSwipe Generator API", version="1.0")

# Configuration des origines autorisées pour CORS
origins = [
    "http://localhost:5173",      # Développement local Vite
    "http://localhost:8080",      # Développement local (port actuel)
    "http://localhost:8081",      # Dev local (port 8081)
    "http://127.0.0.1:8081",
    "http://localhost:8082",      # Dev local (port 8082)
    "http://127.0.0.1:8082",
    "http://localhost:3000",      # Développement local alternatif
    "https://jobswipe-procom.github.io",  # Production (GitHub Pages)
    "http://10.144.200.85:8080",
    "http://172.16.2.207:8080",
    "http://192.168.1.130:8083",   # Frontend sur réseau local (port 8083)
    "http://192.168.1.3:8081",     # Dev réseau local (import CV)
    "http://192.168.1.3:8082",     # Dev réseau local (import CV, port 8082)
]

# Ajout d'une origine supplémentaire via variable d'environnement (ex: pour Render/Vercel previews)
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    origins.append(_frontend_url.strip().rstrip("/"))

# Regex pour accepter tout le réseau local 192.168.1.x (n'importe quel port frontend)
allow_origin_regex = r"http://192\.168\.1\.\d+(:\d+)?$"

# Headers CORS : autoriser explicitement x-gemini-api-key (clé fournie par l'utilisateur)
cors_allow_headers = [
    "Content-Type",
    "Accept",
    "Authorization",
    "x-gemini-api-key",
    "x-gemini-model-name",
]

# CORS : doit être le premier middleware ajouté pour envelopper toutes les réponses (y compris prévol OPTIONS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permettre toutes les origines (le regex gère les 192.168.1.x)
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=cors_allow_headers,
    expose_headers=["*"],
)

# Initialisation du service
# Les fichiers seront générés dans un dossier 'output_api' par défaut
OUTPUT_DIR = os.path.join(os.getcwd(), "output_api")
service = JobSwipeGeneratorService(output_dir=OUTPUT_DIR)

class ApplicationRequest(BaseModel):
    cv_data: Dict[str, Any]
    offer_data: Dict[str, Any]
    gender: str = "M"  # "M" pour masculin, "F" pour féminin
    style: str = "finance" # finance, modern
    manual_content: Optional[Dict[str, Any]] = None  # si présent : pas d'appel Gemini, HTML puis PDF direct

class BatchScoreRequest(BaseModel):
    cv_data: Dict[str, Any]
    offers: List[Dict[str, Any]]

class JobTextRequest(BaseModel):
    text: str

def _check_gemini_key_is_present(manual_content: Any):
    """Si Gemini est requis (pas de manual_content), vérifie que la clé est présente dans l'environnement."""
    if manual_content is not None:
        return
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="La clé API Gemini (GEMINI_API_KEY) n'est pas configurée sur le serveur.")


@app.post("/generate-cv")
async def generate_cv(request: ApplicationRequest):
    """
    Génère uniquement le CV optimisé (PDF).
    Si manual_content est fourni : pas d'appel Gemini, le contenu est utilisé pour générer HTML puis PDF (xhtml2pdf).
    """
    _check_gemini_key_is_present(request.manual_content)
    try:
        results = service.process_cv(
            request.cv_data, request.offer_data,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME,
            manual_content=request.manual_content,
            style=request.style
        )
        
        response_data = {"files": {}}
        # Encodage du CV PDF
        if "cv_pdf" in results.get("paths", {}):
            with open(results["paths"]["cv_pdf"], "rb") as f:
                response_data["files"]["cv_pdf"] = base64.b64encode(f.read()).decode("utf-8")

        # Ajout du contenu HTML pour la prévisualisation
        response_data["html"] = results.get("html_content", "")

        # Ajout du contenu structuré pour l'affichage frontend
        response_data["content"] = results.get("generated_content", {})

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: ApplicationRequest):
    """
    Génère uniquement la lettre de motivation (PDF).
    Si manual_content est fourni : pas d'appel Gemini, le contenu (chunks) est utilisé pour générer HTML puis PDF (xhtml2pdf).
    """
    _check_gemini_key_is_present(request.manual_content)
    try:
        results = service.process_motivation(
            request.cv_data, request.offer_data,
            gender=request.gender,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME,
            manual_content=request.manual_content
        )
        
        response_data = {"files": {}}
        # Encodage de la Lettre PDF
        if "cl_pdf" in results.get("paths", {}):
            with open(results["paths"]["cl_pdf"], "rb") as f:
                response_data["files"]["cl_pdf"] = base64.b64encode(f.read()).decode("utf-8")
        
        # Ajout du contenu structuré pour l'affichage frontend
        response_data["content"] = results.get("generated_content", {})
        
        # Ajout du HTML si disponible (pour preview instantanée)
        if "html_content" in results:
            response_data["html"] = results["html_content"]

        return response_data
    except Exception as e:
        print(f"ERREUR 500 dans /generate-cover-letter : {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/score-application")
async def score_application(request: ApplicationRequest):
    """
    Calcule le score de compatibilité et fournit une analyse détaillée.
    """
    # Cet endpoint nécessite toujours Gemini
    _check_gemini_key_is_present(None)
    try:
        results = service.process_scoring(
            request.cv_data, request.offer_data,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
        return results
    except Exception as e:
        print(f"ERREUR 500 dans /score-application : {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/score-fast")
async def score_fast(request: ApplicationRequest):
    """
    Calcule un score rapide (NLP) pour l'affichage en liste.
    Retourne un entier entre 0 et 100.
    """
    try:
        # Utilisation de batch_match_offers pour un seul élément pour garantir la cohérence
        offer_id = "current"
        offers_dict = {offer_id: request.offer_data}
        scores = batch_match_offers(request.cv_data, offers_dict)
        score = scores.get(offer_id, 0)
        return {"score": score}
    except Exception as e:
        print(f"ERREUR 500 dans /score-fast : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/score-batch")
async def score_batch(request: BatchScoreRequest):
    """
    Calcule les scores pour une liste d'offres (NLP).
    Retourne un dictionnaire {offer_id: score}.
    """
    try:
        scores = {}
        # Conversion de la liste en dictionnaire pour le moteur NLP {id: data}
        offers_dict = {
            offer.get("id"): offer 
            for offer in request.offers 
            if offer.get("id")
        }
        
        # Utilisation du moteur NLP (spaCy) pour le matching sémantique
        scores = batch_match_offers(request.cv_data, offers_dict)
        
        return {"scores": scores}
    except Exception as e:
        print(f"ERREUR 500 dans /score-batch : {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-job")
async def parse_job(request: JobTextRequest):
    """
    Parse un texte d'offre d'emploi brut en JSON structuré.
    """
    _check_gemini_key_is_present(None)
    try:
        result = service.parse_only_offer(
            request.text,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-cv-upload")
async def parse_cv_upload(file: UploadFile = File(...), current_profile: Optional[str] = Form(None)):
    """
    Reçoit un fichier (PDF ou DOCX), extrait le texte et retourne le profil structuré JSON.
    Utilise x_gemini_api_key et x_gemini_model_name des headers (défaut: gemini-1.5-flash).
    """
    _check_gemini_key_is_present(None)
    try:
        content = await file.read()
        profile_data = None
        if current_profile:
            try:
                profile_data = json.loads(current_profile)
            except Exception:
                pass
        result = service.parse_cv_document(
            content, file.filename,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME,
            current_profile=profile_data
        )
        return result
    except Exception as e:
        print(f"ERREUR dans /parse-cv-upload : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse du CV : {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Écouter sur 0.0.0.0 pour être joignable depuis le réseau (ex: frontend sur 192.168.1.130:8083)
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8082")))