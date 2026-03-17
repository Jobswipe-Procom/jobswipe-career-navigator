import json
import os
import sys
import base64
import traceback
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ajout du dossier courant au path pour garantir l'import du module functions
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from functions.generator_service import JobSwipeGeneratorService
from functions.matcher_engine import batch_match_offers
try:
    from functions.gemini_config import GEMINI_MODEL
except ImportError:
    from gemini_config import GEMINI_MODEL

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

def _require_gemini_key_if_needed(manual_content: Any, x_gemini_api_key: Optional[str]) -> str:
    """Si Gemini est requis (pas de manual_content), vérifie que la clé est présente et non vide. Sinon 401."""
    if manual_content is not None:
        return (x_gemini_api_key or "").strip()
    key = (x_gemini_api_key or "").strip()
    if not key:
        raise HTTPException(status_code=401, detail="Clé API manquante")
    return key


@app.post("/generate-cv")
async def generate_cv(
    request: ApplicationRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key"),
    x_gemini_model_name: str = Header("gemini-1.5-flash", alias="x-gemini-model-name")
):
    """
    Génère uniquement le CV optimisé (PDF).
    Si manual_content est fourni : pas d'appel Gemini, le contenu est utilisé pour générer HTML puis PDF (xhtml2pdf).
    """
    api_key = _require_gemini_key_if_needed(request.manual_content, x_gemini_api_key)
    try:
        results = service.process_cv(
            request.cv_data, request.offer_data,
            api_key=api_key,
            model_name=x_gemini_model_name,
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
async def generate_cover_letter(
    request: ApplicationRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key"),
    x_gemini_model_name: str = Header("gemini-1.5-flash", alias="x-gemini-model-name")
):
    """
    Génère uniquement la lettre de motivation (PDF).
    Si manual_content est fourni : pas d'appel Gemini, le contenu (chunks) est utilisé pour générer HTML puis PDF (xhtml2pdf).
    """
    api_key = _require_gemini_key_if_needed(request.manual_content, x_gemini_api_key)
    try:
        results = service.process_motivation(
            request.cv_data, request.offer_data,
            gender=request.gender,
            api_key=api_key,
            model_name=x_gemini_model_name,
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
async def score_application(
    request: ApplicationRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key"),
    x_gemini_model_name: str = Header("gemini-1.5-flash", alias="x-gemini-model-name")
):
    """
    Calcule le score de compatibilité et fournit une analyse détaillée.
    """
    if not x_gemini_api_key or not str(x_gemini_api_key).strip():
        raise HTTPException(status_code=401, detail="Clé API manquante")
    try:
        results = service.process_scoring(
            request.cv_data, request.offer_data,
            api_key=x_gemini_api_key.strip(),
            model_name=x_gemini_model_name
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
async def parse_job(
    request: JobTextRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key"),
    x_gemini_model_name: str = Header("gemini-1.5-flash", alias="x-gemini-model-name")
):
    """
    Parse un texte d'offre d'emploi brut en JSON structuré.
    """
    if not x_gemini_api_key or not str(x_gemini_api_key).strip():
        raise HTTPException(status_code=401, detail="Clé API manquante")
    try:
        result = service.parse_only_offer(
            request.text,
            api_key=x_gemini_api_key.strip(),
            model_name=x_gemini_model_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-cv-upload")
async def parse_cv_upload(
    file: UploadFile = File(...),
    current_profile: Optional[str] = Form(None),
    x_gemini_api_key: Optional[str] = Header(None, alias="x-gemini-api-key"),
    x_gemini_model_name: str = Header("gemini-1.5-flash", alias="x-gemini-model-name")
):
    """
    Reçoit un fichier (PDF ou DOCX), extrait le texte et retourne le profil structuré JSON.
    Utilise x_gemini_api_key du header et le modèle Gemini défini côté backend
    (variable d'environnement GEMINI_MODEL / GEMINI_MODEL_NAME ou valeur par défaut supportée).
    """
    if not x_gemini_api_key or not str(x_gemini_api_key).strip():
        raise HTTPException(status_code=401, detail="Clé API manquante")
    try:
        content = await file.read()
        profile_data = None
        if current_profile:
            try:
                profile_data = json.loads(current_profile)
            except Exception:
                pass

        model_to_use = GEMINI_MODEL
        print(f"[parse-cv-upload] DEBUG: Appel Gemini pour parsing CV avec le modèle: {model_to_use}")

        result = service.parse_cv_document(
            content, file.filename,
            api_key=x_gemini_api_key.strip(),
            model_name=model_to_use,
            current_profile=profile_data
        )
        return result
    except Exception as e:
        # Log détaillé pour le debug
        print(f"[parse-cv-upload] ERREUR lors de l'appel Gemini ou du parsing CV: {repr(e)}")
        # Erreur HTTP explicite pour le frontend
        raise HTTPException(
            status_code=502,
            detail=f"Echec de l'appel Gemini pour le parsing du CV: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    # Écouter sur 0.0.0.0 pour être joignable depuis le réseau (ex: frontend sur 192.168.1.130:8083)
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8082")))