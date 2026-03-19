"""
dashboard_advisor.py

Fonctions d'analyse IA pour le dashboard candidat :
- Feedback sur les refus
- Stratégie de timing
- Recherche de contacts
"""

import json
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types

def _clean_json_text(text: str) -> str:
    """Nettoie le texte pour extraire un JSON valide."""
    # Si bloc markdown détecté, on essaie de cibler le contenu
    if "```" in text:
        parts = text.split("```")
        # On prend la première partie qui contient des crochets ressemblant à une liste
        for p in parts:
            if "[" in p and "]" in p:
                text = p
                break

    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    # Nettoyage basique
    text = re.sub(r"(?<!:)\/\/.*", "", text) # Commentaires
    text = re.sub(r",\s*([\]}])", r"\1", text) # Trailing commas
    return text.strip()

def analyze_feedback(job_title: str, company: str, api_key: str, model_name: str) -> Dict[str, Any]:
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Tu es un expert en recrutement et carrière.
    Analyse une situation de refus de candidature pour le poste de "{job_title}" chez "{company}".
    
    TA MISSION :
    Fournir une analyse empathique et constructive au format JSON.
    
    FORMAT DE RÉPONSE ATTENDU (JSON uniquement) :
    {{
        "analysis": "Analyse du contexte probable (environ 2-3 phrases)",
        "potential_reasons": ["Raison 1", "Raison 2", "Raison 3"],
        "improvement_tips": ["Conseil 1", "Conseil 2", "Conseil 3"],
        "email_template": "Sujet et corps du mail pour demander du feedback"
    }}
    """
    
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    text = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(text)

def generate_timing_strategy(stats: Dict[str, Any], user_role: str, api_key: str, model_name: str) -> Dict[str, Any]:
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Tu es un expert en stratégie de recherche d'emploi.
    Analyse les statistiques suivantes pour un candidat au poste de "{user_role}" :

    STATISTIQUES :
    - Offres en attente (Likées/Superlikées) : {stats.get('total_potential')}
    - Candidatures envoyées : {stats.get('applied')}
    - Processus actifs : {stats.get('active_processes')}
    - Entretiens obtenus : {stats.get('interviews')}

    TA MISSION :
    Fournir une stratégie de timing optimale au format JSON.

    FORMAT DE RÉPONSE ATTENDU (JSON uniquement) :
    {{
      "best_days": [1, 2, 4], // Jours recommandés (0=Dimanche, 1=Lundi, ..., 6=Samedi)
      "best_time_range": "Matin entre 08h30 et 10h00",
      "reasoning": "Explication courte de la stratégie.",
      "action_plan": [
        {{ "day_offset": 0, "action": "Action pour aujourd'hui" }},
        {{ "day_offset": 1, "action": "Action pour demain" }},
        {{ "day_offset": 3, "action": "Action pour dans 3 jours" }}
      ],
      "general_tip": "Un conseil court."
    }}
    """
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    text = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(text)

def search_contacts(company: str, job_title: str, excluded_names: List[str], api_key: str, model_name: str) -> List[Dict[str, Any]]:
    client = genai.Client(api_key=api_key)
    google_search_tool = types.Tool(google_search=types.GoogleSearch())
    
    exclusion_text = ""
    if excluded_names:
        exclusion_text = f"IMPORTANT : Ne propose PAS les profils suivants : {', '.join(excluded_names)}. Trouve 5 personnes DIFFÉRENTES."

    prompt = f"""
    Objectif : Trouver des contacts pertinents chez {company} pour le poste de {job_title}.
    
    Instructions :
    1. Utilise Google Search pour identifier exactement 5 profils réels actuels chez {company}.
    {exclusion_text}
    2. Structure de la réponse (Ordre IMPÉRATIF) :
       - Les 3 premiers profils doivent être des opérationnels (pairs, seniors, managers) travaillant dans le département lié à {job_title}.
       - Les 2 derniers profils doivent être des RH avec l'intitulé "Talent Acquisition" ou "Ressources Humaines".
    3. Pour chaque profil, extrais ou déduis :
       - Nom complet, Intitulé exact du poste, Email professionnel (si introuvable, propose le format le plus probable), Bio courte
    4. Génère un message d'approche (custom_mail_body) court et ultra-personnalisé.
    
    Format de sortie STRICT (JSON uniquement) :
    [{{ "nom": "...", "poste": "...", "email": "...", "is_rh": true/false, "detail_bio": "...", "custom_mail_body": "..." }}]
    """
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[google_search_tool]
        )
    )
    
    try:
        # Gestion sécurisée de response.text (peut lever une exception si bloqué)
        try:
            raw_text = response.text
        except Exception:
            print("[WARN] Search Contacts: Contenu bloqué ou vide.")
            return []
            
        text = _clean_json_text(raw_text)
        return json.loads(text)
    except Exception as e:
        # On tente d'afficher le texte brut si disponible pour le débogage
        try:
            print(f"[ERROR] Failed to parse JSON from search_contacts. Raw text: {response.text}")
        except:
            pass
        raise e

if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    # Chargement des variables d'environnement pour le test local
    load_dotenv()
    
    API_KEY = os.getenv("GEMINI_API_KEY")
    MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-exp")
    
    if not API_KEY:
        print("ERREUR: GEMINI_API_KEY introuvable dans .env")
        exit(1)
        
    print(f"--- Test avec le modèle {MODEL_NAME} ---")

    # 1. Test Feedback
    print("\n[1] Test Analyze Feedback...")
    try:
        feedback = analyze_feedback("Data Scientist", "Airbus", API_KEY, MODEL_NAME)
        print(json.dumps(feedback, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Erreur Feedback: {e}")

    # 2. Test Timing
    print("\n[2] Test Timing Strategy...")
    stats_demo = {
        "total_potential": 15,
        "applied": 5,
        "active_processes": 2,
        "interviews": 1
    }
    try:
        timing = generate_timing_strategy(stats_demo, "Data Scientist", API_KEY, MODEL_NAME)
        print(json.dumps(timing, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Erreur Timing: {e}")

    # 3. Test Search Contacts (Source probable de l'erreur 500)
    print("\n[3] Test Search Contacts...")
    try:
        contacts = search_contacts("Thales", "Data Scientist", [], API_KEY, MODEL_NAME)
        print(json.dumps(contacts, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Erreur Contacts: {e}")
