"""
compatibility_gemini.py

Use Gemini to compute a compatibility score between:
- a parsed job offer (output of parse_job_offer_gemini)
- a parsed CV/profile (output of parse_cv_with_gemini)

The scoring + advice are done BY GEMINI (LLM), not heuristically.
"""

from __future__ import annotations

import os
import json
import re
from typing import Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ============================================================================
# 1. CONFIG GEMINI
# ============================================================================

google_api_key = os.getenv("GEMINI_API_KEY")


# ============================================================================
# 2. OUTIL : extraction du JSON renvoyé par le modèle
# ============================================================================

def extract_json_from_output(output: str) -> Dict[str, Any]:
    """
    Extract a JSON object from the model's raw text output in a robust way.

    En cas d'échec irrécupérable, on renvoie un JSON par défaut avec score 0
    pour éviter de faire tomber tout le backend.
    """
    output = (output or "").strip()

    # JSON par défaut de secours
    default_result: Dict[str, Any] = {
        "overall_score": 0,
        "scores": {
            "skills_match": 0,
            "experience_match": 0,
            "education_match": 0,
            "language_match": 0,
        },
        "summary": "Analyse de compatibilité indisponible (erreur de parsing JSON).",
        "key_strengths": [],
        "key_gaps": [],
        "missing_hard_skills": [],
        "missing_soft_skills": [],
        "recommended_improvements": [],
        "recommended_projects_or_experiences": [],
        "recommended_courses_or_certifications": [],
    }

    if not output:
        return default_result

    # 1. Gestion des blocs Markdown (```json ... ```)
    if "```" in output:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", output, flags=re.DOTALL)
        if match:
            output = match.group(1)
        else:
            output = re.sub(r"^```[a-zA-Z0-9]*\s*", "", output)
            output = re.sub(r"\s*```$", "", output)

    # 2. Extraction du bloc JSON en cherchant le premier '{' et le dernier '}'
    start = output.find("{")
    end = output.rfind("}")
    if start != -1 and end != -1 and end > start:
        json_str = output[start : end + 1]
    else:
        # Si on ne trouve rien de cohérent, fallback direct
        return default_result

    def _try_parse(s: str) -> Dict[str, Any] | None:
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            return None

    # 3. Première tentative de parsing direct
    parsed = _try_parse(json_str)
    if parsed is not None:
        return parsed

    # 4. Tentative de réparation du JSON
    try:
        # 4.1 Suppression des caractères de contrôle non imprimables
        json_clean = re.sub(r"[\x00-\x1F\x7F]", "", json_str)

        # 4.2 Suppression des commentaires // (sauf si dans une URL http://)
        json_clean = re.sub(r"(?<!:)\/\/.*", "", json_clean)

        # 4.3 Suppression des virgules traînantes (trailing commas)
        json_clean = re.sub(r",\s*([\]}])", r"\1", json_clean)

        # 4.4 Ajout des virgules manquantes entre un bloc fermant et une clé suivante
        json_clean = re.sub(r"([\}\]])\s*(\"[^\"]+\"\s*:)", r"\1,\2", json_clean)

        # 4.5 Ajout des virgules manquantes après une valeur simple (nombre, bool, null) et une clé
        json_clean = re.sub(r"([0-9]+|true|false|null)\s+(\"[^\"]+\"\s*:)", r"\1,\2", json_clean)

        # 4.6 Ajout des virgules manquantes après une string et une clé
        json_clean = re.sub(r"(\")\s+(\"[^\"]+\"\s*:)", r"\1,\2", json_clean)

        # 4.7 Nettoyage des pourcentages ou fractions dans les valeurs numériques (ex: 20% -> 20)
        json_clean = re.sub(r":\s*(\d+)\s*[%]", r": \1", json_clean)
        json_clean = re.sub(r":\s*(\d+)\s*/\s*100", r": \1", json_clean)

        repaired = _try_parse(json_clean)
        if repaired is not None:
            return repaired
    except Exception:
        # Toute erreur dans la phase de réparation mène au fallback
        return default_result

    # 5. Fallback final : on ne lève plus d'exception, on renvoie le JSON par défaut
    return default_result


# ============================================================================
# 3. PROMPT DE COMPATIBILITÉ
# ============================================================================

def build_compat_prompt(offer_parsed: Dict[str, Any], cv_parsed: Dict[str, Any]) -> str:
    """
    Construis le prompt envoyé à Gemini pour calculer le score + conseils.
    """
    offer_json = json.dumps(offer_parsed, ensure_ascii=False, indent=2)
    cv_json = json.dumps(cv_parsed, ensure_ascii=False, indent=2)

    return f"""
You are an expert recruiter and career coach.

Your task:
Evaluate how well THIS CANDIDATE matches THIS JOB OFFER, based on their
parsed JSON representations, and return a detailed compatibility analysis.

You MUST return STRICTLY a valid JSON object, with NO explanation, NO text
before, and NO text after.
You MUST NOT use markdown at all (no ```json, no ```).
The response MUST be ONLY one valid JSON object.

====================
JOB OFFER (parsed JSON)
====================
{offer_json}

====================
CANDIDATE PROFILE (parsed CV JSON)
====================
{cv_json}

====================
OUTPUT JSON SPEC
====================

You MUST return a JSON object with EXACTLY these fields:

{{
  "overall_score": 0,

  "scores": {{
    "skills_match": 0,
    "experience_match": 0,
    "education_match": 0,
    "language_match": 0
  }},

  "summary": "string",

  "key_strengths": [
    "string"
  ],

  "key_gaps": [
    "string"
  ],

  "missing_hard_skills": [
    "string"
  ],

  "missing_soft_skills": [
    "string"
  ],

  "recommended_improvements": [
    "string"
  ],

  "recommended_projects_or_experiences": [
    "string"
  ],

  "recommended_courses_or_certifications": [
    "string"
  ]
}}

VERY IMPORTANT RULES:
- The response for all string fields in the JSON output (summary, strengths, gaps, etc.) MUST be in French.
- You MUST return ONLY the JSON object, with no markdown or extra text.
- Each score must be in the range [0,100].
- Do NOT include comments in the JSON output.
- Be realistic and fair: do not give 95+ unless the match is extremely strong.
- "missing_hard_skills" and "missing_soft_skills" must be based on the job offer vs the CV.
- "recommended_improvements" must be concrete and actionable (CV bullets, skills to add, etc.).
- Do NOT invent fake job titles or degrees; strictly base your reasoning on the JSON inputs.
- If a section (e.g. Experience, Education) is empty in the CV, the corresponding score MUST be low (or 0). Do NOT assume the candidate has experience if it is not listed.
"""


# ============================================================================
# 4. APPEL À GEMINI
# ============================================================================

def generate_with_gemini(prompt: str, api_key: str, model_name: str) -> str:
    """
    Call Gemini with the given prompt and return the raw text output.
    """
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.1,  # Baisse un peu pour plus de stabilité
            max_output_tokens=4000, 
            # FORCE LE MODE JSON (Très important)
            response_mime_type="application/json", 
        ),
    )
    try:
        return response.text
    except AttributeError:
        if hasattr(response, "candidates") and response.candidates:
            parts = []
            for cand in response.candidates:
                if not cand.content:
                    continue
                for p in cand.content.parts:
                    if getattr(p, "text", None):
                        parts.append(p.text)
            return "\n".join(parts)
        raise RuntimeError(f"Réponse Gemini inattendue : {response!r}")


def score_profile_with_gemini(
    offer_parsed: Dict[str, Any],
    cv_parsed: Dict[str, Any],
    api_key: str,
    model_name: str = "gemini-1.5-flash"
) -> Dict[str, Any]:
    """
    High-level: prend l'offre parsée + le CV parsé,
    appelle Gemini pour obtenir score + conseils.
    """
    prompt = build_compat_prompt(offer_parsed, cv_parsed)
    raw_output = generate_with_gemini(prompt, api_key, model_name)
    parsed_json = extract_json_from_output(raw_output)
    return parsed_json


# ============================================================================
# 5. DEMO EN LOCAL
# ============================================================================

if __name__ == "__main__":
    # Mini exemple : schemas simplifiés / fake
    offer_demo = {
        "title": "Data Scientist Junior",
        "company_name": "Airbus",
        "location": "Toulouse",
        "contract_type": "CDI",
        "seniority_level": "Junior",
        "Education": ["Diplôme d'ingénieur en Data Science"],
        "hard_skills": ["Python", "SQL", "Machine Learning"],
        "soft_skills": ["teamwork", "communication"],
        "missions": [
            "Develop machine learning models in Python.",
            "Collaborate with cross-functional engineering teams."
        ],
        "requirements": [
            "1–2 years of experience in data science (internship included)."
        ],
        "language": "fr"
    }

    cv_demo = {
        "first_name": "Theau",
        "last_name": "Aguet",
        "full_name": "Theau AGUET",
        "contacts": {
            "emails": ["theauaguetpro@gmail.com"],
            "phones": ["+33 7 82 01 83 97"],
            "locations": ["France"]
        },
        "websites": [],
        "social_links": [],
        "skills": {
            "hard_skills": ["Python", "SQL", "Pandas", "Machine Learning"],
            "soft_skills": ["Teamwork", "Problem-solving"],
            "languages": ["French (C1)", "English (C1)"]
        },
        "professional_experiences": [
            {
                "title": "Data Science Intern",
                "company": "Airbus",
                "location": "Toulouse",
                "start_date": "Feb 2024",
                "end_date": "Aug 2024",
                "description": "Worked on predictive maintenance models in Python and SQL."
            }
        ],
        "academic_projects": [],
        "education": [
            {
                "degree": "Diplôme d'ingénieur en Data Science",
                "school": "IMT Atlantique",
                "location": "France",
                "start_date": "2022",
                "end_date": "2025",
                "description": "Specialization in ML, statistics, data engineering."
            }
        ],
        "certifications": [],
        "interests": ["Running", "Chess"],
        "raw_summary": "Junior data scientist with internship at Airbus."
    }

    print("[INFO] Scoring compatibility with Gemini...")
    result = score_profile_with_gemini(offer_demo, cv_demo,api_key=google_api_key, model_name="gemini-2.5-flash")
    print(json.dumps(result, indent=2, ensure_ascii=False))