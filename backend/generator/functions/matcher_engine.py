"""
matcher_engine.py - Optimized Version
NLP Matching Engine using spaCy (Medium) and Scikit-Learn.
"""

try:
    import spacy
    import spacy.cli
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.feature_extraction.text import CountVectorizer
except ImportError:
    spacy = None
    np = None
    cosine_similarity = None
    CountVectorizer = None

# ============================================================================
# NLP ENGINE (RESUME MATCHER) - SPA CY & SCIKIT-LEARN
# ============================================================================

_nlp_model = None

def _get_spacy_model():
    """Loads the spaCy model into memory (singleton)."""
    global _nlp_model
    if _nlp_model is None and spacy is not None:
        try:
            # Switching to MEDIUM model for real word vectors
            model_name = "fr_core_news_md"
            if not spacy.util.is_package(model_name):
                print(f"[INFO] Model '{model_name}' not found. Downloading...")
                spacy.cli.download(model_name)
            _nlp_model = spacy.load(model_name)
        except Exception as e:
            print(f"[ERROR] Impossible to load spaCy '{model_name}': {e}")
    return _nlp_model

def vectorize_text_spacy(text: str):
    """
    Transforms text into a vector by filtering out low-significance words.
    Only Nouns, Adjectives, and Proper Nouns are kept (POS filtering).
    """
    nlp = _get_spacy_model()
    if not nlp or not text:
        return None
        
    doc = nlp(text.lower())
    
    # Filter to keep only "hard" semantic content
    # This prevents two texts with the same grammatical structure from looking too similar
    important_tokens = [
        token for token in doc 
        if token.pos_ in ["NOUN", "PROPN", "ADJ"] and not token.is_stop
    ]
    
    if not important_tokens:
        # Return a zero vector if no significant words are found
        return np.zeros((nlp.vocab.vectors_length,))
        
    # Average the vectors of important words
    vectors = [token.vector for token in important_tokens if token.has_vector]
    
    if not vectors:
        return np.zeros((nlp.vocab.vectors_length,))
        
    return np.mean(vectors, axis=0)

def calculate_cosine_similarity_spacy(vec_a, vec_b) -> float:
    """
    Calculates the cosine similarity.
    Returns a score between 0.0 and 1.0.
    """
    if vec_a is None or vec_b is None or cosine_similarity is None:
        return 0.0
    
    # Ensure vectors are not empty (all zeros)
    if np.all(vec_a == 0) or np.all(vec_b == 0):
        return 0.0
    
    vec_a_reshaped = vec_a.reshape(1, -1)
    vec_b_reshaped = vec_b.reshape(1, -1)
    
    similarity_matrix = cosine_similarity(vec_a_reshaped, vec_b_reshaped)
    similarity_score = similarity_matrix[0][0]
    
    # Return a float between 0.0 and 1.0 rounded to 2 decimals
    return round(float(max(0.0, min(1.0, similarity_score))), 2)

def analyze_missing_keywords_spacy(cv_text: str, job_desc: str) -> dict:
    nlp = _get_spacy_model()
    if not nlp or not cv_text or not job_desc:
        return {"missing_keywords": []}

    # Helper to get only "Meaningful" words before analyzing n-grams
    def get_clean_text(t):
        doc = nlp(t.lower())
        return " ".join([token.text for token in doc if not token.is_stop and not token.is_punct])

    clean_job = get_clean_text(job_desc)
    clean_cv = get_clean_text(cv_text)

    vectorizer = CountVectorizer(ngram_range=(2, 3), token_pattern=r"(?u)\b\w\w+\b")
    
    try:
        vectorizer.fit([clean_job])
        job_features = vectorizer.get_feature_names_out()
        cv_vector = vectorizer.transform([clean_cv])
        cv_features_mask = cv_vector.toarray()[0]
        
        missing = [job_features[i] for i, val in enumerate(cv_features_mask) if val == 0]
        return {"missing_keywords": missing[:10]}
    except:
        return {"missing_keywords": []}

def batch_match_offers(cv_input, offers_dict: dict) -> dict:
    """Matches a CV against multiple offers. Returns scores out of 100."""
    # (CV text extraction logic remains the same)
    cv_text = ""
    if isinstance(cv_input, str):
        cv_text = cv_input
    elif isinstance(cv_input, dict):
        parts = [cv_input.get("raw_summary", "")]
        skills = cv_input.get("skills", {})
        if isinstance(skills, dict):
            parts.extend(skills.get("hard_skills", []))
        # ... (rest of concatenation)
        cv_text = " ".join([str(p) for p in parts if p])
    
    cv_vec = vectorize_text_spacy(cv_text)
    if cv_vec is None:
        return {k: 0 for k in offers_dict}

    scores = {}
    for key, value in offers_dict.items():
        text_offer = value.get("description", "") if isinstance(value, dict) else value
        offer_vec = vectorize_text_spacy(text_offer)
        
        # Calculate raw score (0.0 - 1.0)
        raw_score = calculate_cosine_similarity_spacy(cv_vec, offer_vec)
        
        # Multiply by 100 ONLY for the final output dictionary
        scores[key] = raw_score * 100
        
    return scores

def run_matcher_demo(cv_text: str, job_desc: str):
    print("\n--- MATCHER ENGINE DEMO (Optimized) ---")
    cv_vec = vectorize_text_spacy(cv_text)
    job_vec = vectorize_text_spacy(job_desc)
    
    if cv_vec is not None and job_vec is not None:
        score = calculate_cosine_similarity_spacy(cv_vec, job_vec)
        # Display as a clean percentage
        print(f"   Compatibility Score: {int(score * 100)}%")
    
    analysis = analyze_missing_keywords_spacy(cv_text, job_desc)
    print(f"   Missing Keywords: {analysis.get('missing_keywords')}")

if __name__ == "__main__":
    # Exemple simple pour tester si le script est exécuté directement
    print("--- TEST DU MOTEUR DE MATCHING (FRANÇAIS) ---")
    
    # 1. Données structurées (Format Application)
    print("\n[1] Test avec Profil et Offres structurés (JSON)")
    
    cv_struct = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "raw_summary": "Développeur Full Stack Senior avec 7 ans d'expérience, spécialisé en Python et React.",
        "skills": {
            "hard_skills": ["Python", "JavaScript", "TypeScript", "Java", "React", "Django", "Spring Boot", "Docker", "Kubernetes", "AWS", "PostgreSQL"],
            "soft_skills": ["Agile", "Scrum", "Leadership", "Mentoring"]
        },
        "professional_experiences": [
            {
                "title": "Lead Développeur Full Stack",
                "company": "Tech Solutions",
                "description": "Conception d'architectures microservices, migration vers le cloud AWS, encadrement de 3 développeurs juniors."
            },
            {
                "title": "Développeur Backend Python",
                "company": "StartupFlow",
                "description": "Développement d'API REST avec Django DRF, optimisation des requêtes SQL."
            }
        ],
        "education": [
            {
                "degree": "Master 2 Ingénierie Logicielle",
                "school": "Université de Technologie"
            }
        ]
    }
    
    offres_batch = {
        "job_1_perfect_match": {
            "title": "Développeur Python / React Senior (H/F)",
            "company_name": "SaaS Corp",
            "description": "Nous recherchons un Lead Dev pour notre stack Python/React. Expérience AWS et Docker requise.",
            "hard_skills": ["Python", "React", "Django", "AWS", "Docker"]
        },
        "job_2_partial_match": {
            "title": "Data Scientist Senior",
            "company_name": "AI Lab",
            "description": "Expert en Python pour des modèles de Machine Learning. Connaissance de Kubernetes appréciée.",
            "hard_skills": ["Python", "Machine Learning", "TensorFlow", "Kubernetes"]
        },
        "job_3_no_match": {
            "title": "Boulanger Pâtissier (H/F)",
            "company_name": "Boulangerie Artisanale",
            "description": "Préparation des pains et viennoiseries. CAP Boulanger requis.",
            "hard_skills": ["Pétrissage", "Cuisson", "Hygiène"]
        }
    }
    
    scores = batch_match_offers(cv_struct, offres_batch)
    print(f"Scores calculés pour 3 offres (Algorithme Exigeant) : {scores}")

    # 2. Test unitaire détaillé (Texte)
    print("\n[2] Test unitaire détaillé (Texte brut - Mode Global)")
    # On reconstruit un texte simple pour la démo détaillée
    cv_text_demo = cv_struct["raw_summary"] + " " + " ".join(cv_struct["skills"]["hard_skills"])
    job_text_demo = offres_batch["job_1_perfect_match"]["description"]
    
    run_matcher_demo(cv_text_demo, job_text_demo)
