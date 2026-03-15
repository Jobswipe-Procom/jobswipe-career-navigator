from __future__ import annotations
from typing import Dict, Any, List, Optional
import os
import re
from pyhere import here

try:
    from xhtml2pdf import pisa
except ImportError:
    raise ImportError("La librairie 'xhtml2pdf' est manquante. Veuillez l'installer via la commande : pip install xhtml2pdf")

# ===========================
#  HTML Helpers
# ===========================

def html_escape(text: str) -> str:
    if text is None: return ""
    replacements = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}
    return "".join(replacements.get(c, c) for c in text)

def format_rich_text(text: str) -> str:
    safe_text = html_escape(text)
    return re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", safe_text)

# ===========================
#  Style Finance (Black & White)
# ===========================

def _render_html_head_and_header(contact_info: Dict[str, str], role: str) -> str:
    css_styles = """
    @page {
        size: a4 portrait;
        margin: 1.2cm;
    }

    body {
        font-family: "Times New Roman", Times, serif; /* Style Classique Finance */
        color: #000;
        background-color: #fff;
        font-size: 9.5pt;
        line-height: 1.15;
    }
    
    p { margin: 0; padding: 0; }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2px;
    }

    td { vertical-align: top; }

    /* Header centré style WSO / Finance */
    .header-container {
        text-align: center;
        margin-bottom: 15px;
    }

    h1 {
        font-size: 18pt;
        margin: 0;
        text-transform: uppercase;
        font-weight: bold;
    }

    .contact-bar {
        font-size: 9pt;
        margin-top: 4px;
    }

    .cv-section {
        margin-bottom: 12px;
    }

    .cv-section h2 {
        font-size: 11pt;
        text-transform: uppercase;
        font-weight: bold;
        border-bottom: 1px solid #000;
        margin-top: 10px;
        margin-bottom: 5px;
        padding-bottom: 1px;
    }

    .subsection-title {
        font-weight: bold;
    }

    .subsection-dates {
        text-align: right;
        font-weight: normal;
    }

    ul {
        margin-left: 18px;
        padding-left: 0;
        margin-top: 2px;
    }

    li {
        margin-bottom: 2px;
        text-align: justify;
    }

    a {
        color: #000;
        text-decoration: none;
    }
    """
    
    # Barre de contact formatée sur une ligne
    contact_parts = [
        contact_info['email'],
        contact_info['phone'],
        contact_info['city'],
        f"LinkedIn: {contact_info['linkedin']}"
    ]
    contact_line = " | ".join([html_escape(p) for p in contact_parts if p])

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>{css_styles}</style>
</head>
<body>
    <div class="header-container">
        <h1>{html_escape(contact_info['name'])}</h1>
        <div class="contact-bar">{contact_line}</div>
        <div style="font-style: italic; font-size: 10pt; margin-top: 2px;">{html_escape(role)}</div>
    </div>
"""

def _render_html_objective(objective: str) -> str:
    if not objective: return ""
    return f"""
    <div class="cv-section">
        <h2>Résumé Professionnel</h2>
        <p>{format_rich_text(objective)}</p>
    </div>
"""

def _render_html_experiences(experiences: List[Dict[str, Any]]) -> str:
    if not experiences: return ""
    html_blocks = []
    for exp in experiences:
        title = format_rich_text(exp.get("target_title") or exp.get("source_title", ""))
        company = format_rich_text(exp.get("company", ""))
        location = format_rich_text(exp.get("location", ""))
        date_str = f"{exp.get('start_date', '')} – {exp.get('end_date', '')}"
        bullets = "".join([f"<li>{format_rich_text(b)}</li>" for b in exp.get("bullets", []) if b.strip()])

        html_blocks.append(f"""
            <table>
                <tr>
                    <td class="subsection-title">{company}</td>
                    <td class="subsection-dates">{location}</td>
                </tr>
                <tr>
                    <td style="font-style: italic;">{title}</td>
                    <td class="subsection-dates" style="font-style: italic;">{date_str}</td>
                </tr>
            </table>
            <ul>{bullets}</ul>
        """)
    return f'<div class="cv-section"><h2>Expérience Professionnelle</h2>{"".join(html_blocks)}</div>'

def _render_html_education(education_list: List[Dict[str, Any]]) -> str:
    if not education_list: return ""
    html_blocks = []
    for edu in education_list:
        degree = format_rich_text(edu.get("degree", ""))
        school = format_rich_text(edu.get("school", ""))
        location = format_rich_text(edu.get("location", ""))
        date_str = f"{edu.get('start_date', '')} – {edu.get('end_date', '')}"
        
        bullets = ""
        if edu.get("bullets"):
            bullets = f"<ul><li>{format_rich_text(' '.join(edu.get('bullets')))}</li></ul>"

        html_blocks.append(f"""
            <table>
                <tr>
                    <td class="subsection-title">{school}</td>
                    <td class="subsection-dates">{location}</td>
                </tr>
                <tr>
                    <td style="font-style: italic;">{degree}</td>
                    <td class="subsection-dates" style="font-style: italic;">{date_str}</td>
                </tr>
            </table>
            {bullets}
        """)
    return f'<div class="cv-section"><h2>Formation</h2>{"".join(html_blocks)}</div>'

def _render_html_skills(skills: Dict[str, Any]) -> str:
    sections = skills.get("sections") or []
    if not sections: return ""
    html_blocks = []
    for section in sections:
        title = format_rich_text(section.get("section_title", ""))
        items = ", ".join([format_rich_text(i) for i in section.get("items", []) if i])
        html_blocks.append(f"<p><strong>{title}:</strong> {items}</p>")
    
    return f'<div class="cv-section"><h2>Compétences & Langues</h2>{"".join(html_blocks)}</div>'

def _render_html_activities(interests: List[Dict[str, Any]]) -> str:
    if not interests: return ""
    items = []
    for it in interests:
        label = format_rich_text(it.get("label", ""))
        sentence = format_rich_text(it.get("sentence", ""))
        items.append(f"<strong>{label}:</strong> {sentence}")
    
    return f'<div class="cv-section"><h2>Informations Complémentaires</h2><p>{" ; ".join(items)}</p></div>'

def generate_cv_html(full_cv_content: Dict[str, Any], contact_info: Dict[str, str]) -> str:
    cv_title = full_cv_content.get("cv_title", {}).get("cv_title") if isinstance(full_cv_content.get("cv_title"), dict) else ""
    role_to_use = cv_title or contact_info["role"]

    objective_data = full_cv_content.get("objective", {})
    objective_str = objective_data.get("objective", "") if isinstance(objective_data, dict) else ""

    html_parts = [
        _render_html_head_and_header(contact_info, role_to_use),
        _render_html_objective(objective_str),
        _render_html_education(full_cv_content.get("education", {}).get("education", [])),
        _render_html_experiences(full_cv_content.get("experiences", {}).get("experiences", [])),
        _render_html_experiences(full_cv_content.get("projects", {}).get("projects", [])), # Inclus en Expérience style finance
        _render_html_skills(full_cv_content.get("skills", {}).get("skills", {})),
        _render_html_activities(full_cv_content.get("interests", {}).get("interests", [])),
        "</body></html>"
    ]
    return "".join(html_parts)

def convert_html_to_pdf(html_content: str, output_path: str) -> str:
    with open(output_path, "wb") as result_file:
        pisa.CreatePDF(html_content, dest=result_file)
    return output_path

if __name__ == "__main__":
    # Exemple minimal factice pour tester la génération de fichiers
    dummy_full_cv = {
        "cv_title": {"cv_title": "Data Scientist Junior – Machine Learning"},
        "objective": {
            "objective": (
                "Étudiant passionné en data science, en recherche d’un poste junior en machine learning "
                "afin de générer un fort impact business grâce aux données."
            )
        },
        "experiences": {
            "experiences": [
                {
                    "source_title": "Stagiaire Data Scientist",
                    "company": "Airbus",
                    "location": "Toulouse, France",
                    "start_date": "2024-02",
                    "end_date": "2024-08",
                    "target_title": "Stagiaire Data Scientist – Maintenance prédictive",
                    "bullets": [
                        "Développé des modèles prédictifs améliorant la détection de pannes d’environ 7 % sur plus de 50 000 enregistrements.",
                        "Automatisé des pipelines de données SQL pour des mises à jour quotidiennes utilisées par 3 équipes.",
                        "Réduit le temps de reporting manuel de 2 heures à 30 minutes."
                    ],
                }
            ]
        },
        "projects": {
            "projects": [
                {
                    "source_title": "Tableau de bord de variabilité glycémique",
                    "target_title": "Tableau de bord de variabilité glycémique – D3.js & Wearables",
                    "tech_stack": ["Python", "D3.js", "Pandas"],
                    "bullets": [
                        "Conçu un tableau de bord interactif pour explorer les données de glucose et d’activité.",
                        "Agrégé des séries temporelles multi-capteurs provenant de 7 jeux de données.",
                        "Accéléré l’exploration des données pour les chercheurs en automatisant les vues clés."
                    ],
                }
            ]
        },
        "education": {
            "education": [
                {
                    "degree": "Diplôme d’ingénieur en Data Science",
                    "school": "IMT Atlantique",
                    "location": "France",
                    "start_date": "2022",
                    "end_date": "2025",
                    "bullets": [
                        "Spécialisation en machine learning, statistiques et data engineering."
                    ],
                }
            ]
        },
        "interests": {
            "interests": [
                {"label": "Course à pied", "sentence": "Semi-marathons (discipline et persévérance sur le long terme)."},
                {"label": "Échecs", "sentence": "Réflexion stratégique et reconnaissance de motifs."},
            ]
        },
        "skills": {
            "skills": {
                "sections": [
                    {
                        "section_title": "Compétences techniques",
                        "items": ["Python", "SQL", "Pandas", "scikit-learn"],
                    },
                    {
                        "section_title": "Compétences comportementales",
                        "items": ["Travail d’équipe", "Communication", "Résolution de problèmes"],
                    },
                ],
                "highlighted": ["Python", "Machine Learning", "SQL"],
            }
        },
    }

    dummy_contact = {
        "name": "Theau AGUET",
        "city": "France",
        "phone": "+33 7 82 01 83 97",
        "email": "theauaguetpro@gmail.com",
        "linkedin": "theau aguet",
        "github": "the0eau",
        "role": "Data Scientist & Entrepreneur – À la croisée de l’IA, du produit et de la stratégie",
    }

    print("[INFO] Génération du CV HTML à partir de dummy_full_cv...")
    html_cv_content = generate_cv_html(dummy_full_cv, dummy_contact)
    html_output_path = here("backend/generator/cv/resume.html")
    with open(html_output_path, "w", encoding="utf-8") as f:
        f.write(html_cv_content)
    print(f"CV HTML généré à l’emplacement : {html_output_path}")

    # Compilation du CV HTML en PDF
    html_pdf_path = here("backend/generator/cv/resume_html.pdf")
    convert_html_to_pdf(html_cv_content, html_pdf_path)
    print(f"CV HTML converti en PDF à l’emplacement : {html_pdf_path}")
    print("[INFO] Terminé.")