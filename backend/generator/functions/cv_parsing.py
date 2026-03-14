"""
cv_ai_parser.py

Parse a CV/resume using an LLM (Gemini) and return a structured dictionary.

- No PDF logic here: you pass a CV as raw text (string).
- Uses google-generativeai (Gemini) with a strict JSON schema.
- Output: Python dict (parsed from JSON returned by the model).

Env variables required:
    GEMINI_API_KEY      # your Gemini API key
Optional:
    GEMINI_MODEL_NAME   # override model name if needed
"""

from __future__ import annotations

import os
import json
import re
from typing import Dict, Any, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ============================================================================
# 1. CONFIG GEMINI
# ============================================================================

# Récupération de la clé API depuis les variables d'environnement
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Récupération du nom du modèle (avec une valeur par défaut si non définie)
GEMINI_MODEL_NAME = "gemini-2.5-flash-lite"  # ou "gemini-1.5-flash" selon votre accès

# ============================================================================
# 2. OUTIL : extraction du JSON renvoyé par le modèle
# ============================================================================

def extract_json_from_output(output: str) -> Dict[str, Any]:
    """
    Extract a JSON object from the model's raw text output.

    - If the output is already pure JSON, parse directly.
    - Otherwise, find the first {...} block.
    """
    output = output.strip()

    # Gestion des blocs Markdown
    if "```" in output:
        output = re.sub(r"^```[a-zA-Z0-9]*\s*", "", output)
        output = re.sub(r"\s*```$", "", output)

    match = re.search(r"\{.*\}", output, flags=re.DOTALL)
    if match:
        json_str = match.group(0)
    else:
        json_str = output

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] JSONDecodeError (first attempt): {e}")
        print(f"[DEBUG] Raw output was:\n{output}\n---")
        # Réparation basique
        # 0. Suppression des commentaires multi-lignes /* ... */
        json_str = re.sub(r"/\*.*?\*/", "", json_str, flags=re.DOTALL)
        # 1. Suppression des commentaires //
        json_str = re.sub(r"(?<!:)\/\/.*", "", json_str)
        # 2. Suppression des virgules traînantes
        json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
        # 3. Ajout des virgules manquantes entre accolades/crochets et clé suivante
        json_str = re.sub(r"([\}\]])\s*(\"[^\"]+\"\s*:)", r"\1,\2", json_str)
        # 4. Ajout des virgules manquantes après une valeur simple
        json_str = re.sub(r"([0-9]+|true|false|null)\s+(\"[^\"]+\"\s*:)", r"\1,\2", json_str)
        # 5. Ajout des virgules manquantes après une string
        json_str = re.sub(r"(\")\s+(\"[^\"]+\"\s*:)", r"\1,\2", json_str)
        
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e2:
            print(f"[ERROR] JSONDecodeError (after repair): {e2}")
            print(f"[ERROR] Failed JSON string:\n{json_str}\n---")
            print(f"[WARNING] Échec du parsing JSON du CV. Retour d'un profil partiel.")
            # Fallback pour éviter le crash 500
            return {"raw_summary": "Erreur de lecture automatique. Veuillez remplir votre profil manuellement."}


# ============================================================================
# 3. PROMPT DE PARSING DU CV
# ============================================================================

def build_cv_parsing_prompt(cv_text: str, current_profile: Optional[Dict[str, Any]] = None) -> str:
    """
    Build the prompt sent to Gemini to parse the CV into a structured JSON.
    The output will be in French.
    """
    context_instruction = ""
    if current_profile:
        profile_str = json.dumps(current_profile, ensure_ascii=False, indent=2)
        context_instruction = f"""
CONTEXTE - PROFIL UTILISATEUR EXISTANT :
L'utilisateur a déjà un profil avec les données suivantes :
{profile_str}

MIVE À JOUR :
- Fusionnez les informations du texte du CV ci-dessous dans ce profil existant.
- GARDEZ les informations existantes si elles ne sont pas mentionnées dans le CV.
- METTEZ À JOUR les champs si le CV fournit des informations plus récentes.
- ÉVITEZ les doublons dans les listes.
"""

    return f"""
Vous êtes un expert en IA spécialisé dans l'analyse de CV (parsing).
Votre tâche : Analyser le texte du CV ci-dessous et extraire les informations structurées.

{context_instruction}

Vous DEVEZ retourner STRICTEMENT un objet JSON valide, sans explication, sans texte avant ou après.

⚠️ TRÈS IMPORTANT — Le JSON DOIT contenir TOUS les champs suivants :

{{
  "first_name": string | null,
  "last_name": string | null,
  "full_name": string | null,
  "gender": string | null,              // "Homme", "Femme", ou "Non-binaire"
  "target_role": string | null,
  "experience_level": string | null,
  "availability_date": string | null,   // Date de disponibilité au format YYYY-MM-DD
  "salary_expectation": string | null,  // Prétention salariale (ex: "45k", "500€/jour")
  "is_disabled": boolean | null,        // true si mention de situation de handicap, sinon false ou null

  "contacts": {{
    "emails": string[],
    "phones": string[],
    "locations": string[]
  }},

  "websites": [
    {{ "label": string | null, "url": string }}
  ],

  "social_links": [
    {{ "platform": string | null, "url": string }}
  ],

  "skills": {{
    "hard_skills": string[],
    "soft_skills": string[],
    "languages": [
      {{ "name": string, "level": string | null }}
    ]
  }},

  "professional_experiences": [
    {{
      "title": string | null,
      "company": string | null,
      "location": string | null,
      "start_date": string | null,      // Format YYYY-MM-DD (ex: 2024-02-01)
      "end_date": string | null,        // Format YYYY-MM-DD ou "Présent"
      "description": string
    }}
  ],

  "academic_projects": [
    {{
      "title": string | null,
      "context": string | null,
      "technologies": string[],
      "description": string
    }}
  ],

  "education": [
    {{
      "degree": string | null,
      "school": string | null,
      "location": string | null,
      "start_date": string | null,      // Format YYYY-MM-DD
      "end_date": string | null,        // Format YYYY-MM-DD
      "description": string
    }}
  ],

  "certifications": [
    {{
      "name": string | null,
      "issuer": string | null,
      "date": string | null             // Format YYYY-MM-DD
    }}
  ],

  "interests": [string],
  "raw_summary": string | null
}}

RÈGLES STRICTES :
1. Toutes les valeurs textuelles (descriptions, titres) DOIVENT être en Français.
2. Les dates DOIVENT être converties au format ISO "YYYY-MM-DD". Si seul le mois/année est présent (ex: "Fev 2024"), utilisez le premier jour du mois (2024-02-01).
3. Si un champ est inconnu, mettez null (pour les objets) ou [] (pour les listes).
4. Ne pas inventer d'informations.
5. Retournez UNIQUEMENT le JSON.

Texte du CV à analyser :
\"\"\" 
{cv_text}
\"\"\"
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
            temperature=0.1,
            max_output_tokens=8192,
        ),
    )
    # Selon la version de la lib, le texte peut être accessible via .text ou parts
    try:
        return response.text
    except AttributeError:
        # fallback: concat all text parts
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


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """
    Extrait le texte brut depuis un fichier binaire (PDF, DOCX) ou texte.
    """
    filename = filename.lower()
    text = ""

    if filename.endswith(".pdf"):
        try:
            import io
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_content))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except ImportError:
            raise ImportError("La librairie 'pypdf' est manquante. Installez-la avec : pip install pypdf")
        except Exception as e:
            raise ValueError(f"Erreur lors de la lecture du PDF : {e}")

    elif filename.endswith(".docx"):
        try:
            import io
            from docx import Document
            doc = Document(io.BytesIO(file_content))
            text = "\n".join([p.text for p in doc.paragraphs])
        except ImportError:
            raise ImportError("La librairie 'python-docx' est manquante. Installez-la avec : pip install python-docx")
        except Exception as e:
            raise ValueError(f"Erreur lors de la lecture du DOCX : {e}")

    else:
        # Tentative de lecture en texte brut
        text = file_content.decode("utf-8", errors="ignore")

    return text


def parse_cv_with_gemini(cv_text: str, api_key: str, model_name: str = "gemini-1.5-flash", current_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    High-level function: takes raw CV text, sends it to Gemini,
    parses the JSON, and returns a Python dict.
    """
    prompt = build_cv_parsing_prompt(cv_text, current_profile)
    raw_output = generate_with_gemini(prompt, api_key, model_name)
    parsed_json = extract_json_from_output(raw_output)
    return parsed_json


# ============================================================================
# 5. DEMO EN LIGNE DE COMMANDE (OPTIONNEL)
# ============================================================================

if __name__ == "__main__":
    demo_cv = """
    THEAU AGUET
    Data Scientist & Entrepreneur - Bridging AI, Product & Strategy
    France
    Phone: +33 7 82 01 83 97
    Email: theauaguetpro@gmail.com
    LinkedIn: https://www.linkedin.com/in/theauaguet
    GitHub: https://github.com/the0eau
    Portfolio: https://the0eau.github.io/portfolio/

    EXPERIENCE PROFESSIONNELLE
    Data Scientist Intern - Airbus, Toulouse, France
    Feb 2024 - Aug 2024
    - Built predictive maintenance models on sensor data (Python, scikit-learn).
    - Improved failure detection by ~7% on 50k+ records.
    - Automated dashboards for 3 stakeholders in the engineering team.

    PROJETS ACADÉMIQUES
    Glycemic Variability Dashboard – D3.js & Wearables
    - Built an interactive visualization of glucose and activity data.
    - Combined 7 datasets (Dexcom, ACC, HR, etc.) with Python and Pandas.

    FORMATION
    IMT Atlantique – Diplôme d'ingénieur en Data Science
    2022 – 2025

    CERTIFICATIONS
    DeepLearning.AI TensorFlow Developer – Coursera, 2023

    COMPÉTENCES
    Python, SQL, Machine Learning, D3.js, Data Visualization, Git, Docker

    CENTRES D'INTÉRÊT
    Running (half-marathons), Chess, Entrepreneurship, Teaching.
    """

    print("[INFO] Parsing CV with Gemini...")
    result = parse_cv_with_gemini(demo_cv, api_key=GEMINI_API_KEY, model_name=GEMINI_MODEL_NAME)
    print(json.dumps(result, indent=2, ensure_ascii=False))
