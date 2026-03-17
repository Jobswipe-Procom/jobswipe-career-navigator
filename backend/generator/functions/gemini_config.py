import os

"""
Configuration centralisée du modèle Gemini.

- Utilise en priorité GEMINI_MODEL
- Garde la compatibilité éventuelle avec GEMINI_MODEL_NAME
- Fournit un fallback explicite sur un modèle par défaut supporté par l'API v1.
"""

DEFAULT_GEMINI_MODEL = "gemini-1.5-flash-latest"


def get_gemini_model(default: str | None = None) -> str:
  """
  Retourne le nom du modèle Gemini à utiliser.

  Ordre de priorité :
  - variable d'environnement GEMINI_MODEL
  - variable d'environnement GEMINI_MODEL_NAME (pour compat)
  - valeur par défaut passée en argument
  - DEFAULT_GEMINI_MODEL
  """
  env_model = os.getenv("GEMINI_MODEL") or os.getenv("GEMINI_MODEL_NAME")
  if env_model and env_model.strip():
    return env_model.strip()
  if default and str(default).strip():
    return str(default).strip()
  return DEFAULT_GEMINI_MODEL


GEMINI_MODEL = get_gemini_model()

