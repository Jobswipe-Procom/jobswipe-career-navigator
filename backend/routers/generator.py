import json
import os
import sys
import base64
import traceback
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

# Ajout du dossier generator au path pour les imports
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "generator"))

from functions.generator_service import JobSwipeGeneratorService

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

OUTPUT_DIR = os.path.join(os.getcwd(), "output_api")
service = JobSwipeGeneratorService(output_dir=OUTPUT_DIR)


class ApplicationRequest(BaseModel):
    cv_data: Dict[str, Any]
    offer_data: Dict[str, Any]
    gender: str = "M"
    style: str = "finance"
    manual_content: Optional[Dict[str, Any]] = None


class BatchScoreRequest(BaseModel):
    cv_data: Dict[str, Any]
    offers: List[Dict[str, Any]]


class JobTextRequest(BaseModel):
    text: str


class FeedbackRequest(BaseModel):
    job_title: str
    company: str


class TimingRequest(BaseModel):
    stats: Dict[str, Any]
    user_role: str = "Candidat"


class ContactSearchRequest(BaseModel):
    company: str
    job_title: str
    excluded_names: List[str] = []


def _check_gemini_key():
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="La clé API Gemini (GEMINI_API_KEY) n'est pas configurée sur le serveur."
        )


@router.post("/generate-cv")
async def generate_cv(request: ApplicationRequest):
    if not request.manual_content:
        _check_gemini_key()
    try:
        results = service.process_cv(
            request.cv_data, request.offer_data,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME,
            manual_content=request.manual_content,
            style=request.style
        )
        response_data = {"files": {}}
        if "cv_pdf" in results.get("paths", {}):
            with open(results["paths"]["cv_pdf"], "rb") as f:
                response_data["files"]["cv_pdf"] = base64.b64encode(f.read()).decode("utf-8")
        response_data["html"] = results.get("html_content", "")
        response_data["content"] = results.get("generated_content", {})
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cover-letter")
async def generate_cover_letter(request: ApplicationRequest):
    if not request.manual_content:
        _check_gemini_key()
    try:
        results = service.process_motivation(
            request.cv_data, request.offer_data,
            gender=request.gender,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME,
            manual_content=request.manual_content
        )
        response_data = {"files": {}}
        if "cl_pdf" in results.get("paths", {}):
            with open(results["paths"]["cl_pdf"], "rb") as f:
                response_data["files"]["cl_pdf"] = base64.b64encode(f.read()).decode("utf-8")
        response_data["content"] = results.get("generated_content", {})
        if "html_content" in results:
            response_data["html"] = results["html_content"]
        return response_data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score-application")
async def score_application(request: ApplicationRequest):
    _check_gemini_key()
    try:
        results = service.process_scoring(
            request.cv_data, request.offer_data,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
        return results
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-job")
async def parse_job(request: JobTextRequest):
    _check_gemini_key()
    try:
        result = service.parse_only_offer(
            request.text,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-cv-upload")
async def parse_cv_upload(file: UploadFile = File(...), current_profile: Optional[str] = Form(None)):
    _check_gemini_key()
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


@router.post("/analyze-feedback")
def analyze_feedback(request: FeedbackRequest):
    _check_gemini_key()
    try:
        return service.analyze_feedback(
            request.job_title, request.company,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/timing-strategy")
def timing_strategy(request: TimingRequest):
    _check_gemini_key()
    try:
        return service.generate_timing_strategy(
            request.stats, request.user_role,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search-contacts")
def search_contacts(request: ContactSearchRequest):
    _check_gemini_key()
    try:
        return service.search_contacts(
            request.company, request.job_title, request.excluded_names,
            api_key=GEMINI_API_KEY,
            model_name=GEMINI_MODEL_NAME
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
