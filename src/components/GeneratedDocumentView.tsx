import { useState, useEffect, useRef, ChangeEvent } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ArrowLeft, Download, FileText, PenTool, Edit3, Save, Loader2, ChevronDown, PlusCircle, Trash2, Sparkles, LayoutTemplate } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface GeneratedDocumentViewProps {
  cvData?: { pdf: string; content: any; html?: string };
  clData?: { pdf: string; content: any; html?: string };
  onBack: () => void;
  jobTitle: string;
  companyName: string;
  userProfile?: any;
  initialTab?: 'cv' | 'cl';
  onUpdateContent: (newContent: any, type: 'cv' | 'cl', style?: string) => Promise<void>;
  onRegenerateWithAI: () => Promise<void>;
}

// --- Composants UI pour l'éditeur ---

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
    {...props}
  />
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-medium text-slate-500">{label}</label>
    {children}
  </div>
);

const EditorSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <details className="group border-b border-slate-200" open>
    <summary className="list-none flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50">
      <span className="font-semibold text-slate-700 text-sm">{title}</span>
      <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
    </summary>
    <div className="p-4 bg-slate-50/50 space-y-4">
      {children}
    </div>
  </details>
);

const SubSection = ({ title, onDelete, children }: { title: string; onDelete: () => void; children: React.ReactNode }) => (
    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-xs text-slate-600">{title}</h4>
            <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const AddButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
    >
        <PlusCircle className="w-4 h-4" /> {children}
    </button>
);

// --- Templates pour les nouveaux éléments ---

const newExperienceTemplate = {
  company: "",
  target_title: "",
  location: "",
  start_date: "",
  end_date: "",
  bullets: [""],
};

const newProjectTemplate = {
  target_title: "",
  tech_stack: [],
  bullets: [""],
};

const newEducationTemplate = {
  school: "",
  degree: "",
  location: "",
  start_date: "",
  end_date: "",
  bullets: [""],
};

const newInterestTemplate = {
  label: "",
  sentence: "",
};

const newSkillSectionTemplate = {
  section_title: "",
  items: [""],
};


type ArrayKey = 'experiences' | 'projects' | 'education' | 'interests';
type TemplateType = typeof newExperienceTemplate | typeof newProjectTemplate | typeof newEducationTemplate | typeof newInterestTemplate;


export const GeneratedDocumentView = ({ 
  cvData, 
  clData, 
  onBack, 
  jobTitle, 
  companyName, 
  initialTab,
  onUpdateContent,
  onRegenerateWithAI
}: GeneratedDocumentViewProps) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'cl'>(initialTab || (cvData ? 'cv' : 'cl'));
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>("finance");
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialisation et synchronisation du contenu éditable
  useEffect(() => {
    if (activeTab === 'cv' && cvData?.content) {
      setEditableContent(cvData.content);
    } else if (activeTab === 'cl' && clData?.content) {
      setEditableContent(clData.content);
    }
  }, [cvData, clData, activeTab]);

  const downloadPdf = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // On envoie le contenu modifié au parent (qui appelle le backend)
      await onUpdateContent(editableContent, activeTab, selectedStyle);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateWithAI();
    } catch (error) {
      // L'erreur est déjà gérée et affichée par le composant parent
    } finally {
      setIsRegenerating(false);
    }
  };

  const changeStyle = async (newStyle: string) => {
      setSelectedStyle(newStyle);
      if (editableContent && activeTab === 'cv') {
          await onUpdateContent(editableContent, 'cv', newStyle);
      }
  };

  // --- Fonctions de mise à jour de l'état (editableContent) ---

  const handleContactChange = (field: string, value: string) => {
    setEditableContent((prev: any) => ({
      ...prev,
      contact_info: {
        ...(prev?.contact_info || {}),
        [field]: value
      }
    }));
  };

  const handleBlockChange = (blockName: 'header_blocks' | 'company_blocks', field: string, value: string) => {
    setEditableContent((prev: any) => ({
      ...prev,
      [blockName]: {
        ...(prev?.[blockName] || {}),
        [field]: value
      }
    }));
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditableContent((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (arrayName: ArrayKey, index: number, field: string, value: string) => {
    setEditableContent((prev: any) => {
      const newArray = [...(prev[arrayName] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName: ArrayKey, template: TemplateType) => {
    setEditableContent((prev: any) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), template],
    }));
  };

  const removeArrayItem = (arrayName: ArrayKey, index: number) => {
    setEditableContent((prev: any) => ({
      ...prev,
      [arrayName]: (prev[arrayName] || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleBulletChange = (arrayName: 'experiences' | 'projects' | 'education', itemIndex: number, bulletIndex: number, value: string) => {
    setEditableContent((prev: any) => {
      const newArray = JSON.parse(JSON.stringify(prev[arrayName] || []));
      if (!newArray[itemIndex].bullets) newArray[itemIndex].bullets = [];
      newArray[itemIndex].bullets[bulletIndex] = value;
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addBullet = (arrayName: 'experiences' | 'projects' | 'education', itemIndex: number) => {
    setEditableContent((prev: any) => {
      const newArray = JSON.parse(JSON.stringify(prev[arrayName] || []));
      if (!newArray[itemIndex].bullets) newArray[itemIndex].bullets = [];
      newArray[itemIndex].bullets.push("");
      return { ...prev, [arrayName]: newArray };
    });
  };

  const removeBullet = (arrayName: 'experiences' | 'projects' | 'education', itemIndex: number, bulletIndex: number) => {
    setEditableContent((prev: any) => {
      const newArray = JSON.parse(JSON.stringify(prev[arrayName] || []));
      newArray[itemIndex].bullets = (newArray[itemIndex].bullets || []).filter((_: any, i: number) => i !== bulletIndex);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleSkillSectionChange = (sectionIndex: number, field: 'section_title', value: string) => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections[sectionIndex][field] = value;
      return { ...prev, skills: newSkills };
    });
  };

  const handleSkillItemChange = (sectionIndex: number, itemIndex: number, value: string) => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections[sectionIndex].items[itemIndex] = value;
      return { ...prev, skills: newSkills };
    });
  };

  const addSkillSection = () => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections.push(newSkillSectionTemplate);
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkillSection = (sectionIndex: number) => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections = newSkills.sections.filter((_: any, i: number) => i !== sectionIndex);
      return { ...prev, skills: newSkills };
    });
  };

  const addSkillItem = (sectionIndex: number) => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections[sectionIndex].items.push("");
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkillItem = (sectionIndex: number, itemIndex: number) => {
    setEditableContent((prev: any) => {
      const newSkills = JSON.parse(JSON.stringify(prev.skills || { sections: [] }));
      newSkills.sections[sectionIndex].items = newSkills.sections[sectionIndex].items.filter((_: any, i: number) => i !== itemIndex);
      return { ...prev, skills: newSkills };
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-base md:text-lg truncate">Candidature : {companyName}</h1>
            <p className="text-xs text-slate-500 truncate">{jobTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center px-3 md:px-4 h-10 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              <Edit3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Modifier</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { setIsEditing(false); if (cvData?.content) setEditableContent(cvData.content); }} 
                className="px-3 md:px-4 h-10 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50 rounded-lg hover:bg-slate-100"
                disabled={isSaving}
              >
                Annuler
              </button>
              <PrimaryButton onClick={handleSave} disabled={isSaving} className="h-10 px-3 md:px-4">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                    <span className="hidden md:inline">Génération...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Appliquer</span>
                  </>
                )}
              </PrimaryButton>
            </div>
          )}
          
          <PrimaryButton 
            onClick={() => {
              if (activeTab === 'cv' && cvData) downloadPdf(cvData.pdf, `CV_${companyName}.pdf`);
              if (activeTab === 'cl' && clData) downloadPdf(clData.pdf, `Lettre_${companyName}.pdf`);
            }}
            disabled={isEditing || isSaving}
            className="h-10 px-3 md:px-4"
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">PDF</span>
          </PrimaryButton>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-2 hidden md:flex">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Documents</div>
          {cvData && (
            <button
              onClick={() => setActiveTab('cv')}
              className={`flex items-center p-3 rounded-xl transition-all text-left ${activeTab === 'cv' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <FileText className={`w-5 h-5 mr-3 ${activeTab === 'cv' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold">CV</div>
            </button>
          )}
          {clData && (
            <button
              onClick={() => setActiveTab('cl')}
              className={`flex items-center p-3 rounded-xl transition-all text-left ${activeTab === 'cl' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <PenTool className={`w-5 h-5 mr-3 ${activeTab === 'cl' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold">Lettre de Motivation</div>
            </button>
          )}
        </aside>

        <div className="flex-1 flex overflow-hidden">
          {/* Panneau d'Édition */}
          {isEditing && (
            <div className="w-full md:w-96 lg:w-[450px] border-r border-slate-200 bg-white flex flex-col animate-in slide-in-from-left duration-200">
              <h2 className="font-bold text-slate-800 p-4 border-b border-slate-200 flex items-center gap-2 text-base">
                <Edit3 className="w-4 h-4" /> Éditeur de Contenu
              </h2>
              
              {/* Sélecteur de Style (Uniquement pour CV) */}
              {activeTab === 'cv' && (
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                        <LayoutTemplate className="w-3 h-3" /> Design du CV
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => changeStyle('finance')}
                            className={`px-2 py-2 text-xs font-medium rounded border ${selectedStyle === 'finance' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Finance (Classique)
                        </button>
                        <button 
                            onClick={() => changeStyle('modern')}
                            className={`px-2 py-2 text-xs font-medium rounded border ${selectedStyle === 'modern' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Moderne (Bleu)
                        </button>
                    </div>
                </div>
              )}

              <div className="p-4 border-b border-slate-200">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || isSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Régénération IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Régénérer avec l'IA
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                
                {activeTab === 'cv' ? (
                  <>
                    <EditorSection title="Informations Personnelles">
                      <Field label="Nom complet">
                        <Input value={editableContent?.contact_info?.name || ""} onChange={(e) => handleContactChange('name', e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Field label="Email"><Input value={editableContent?.contact_info?.email || ""} onChange={(e) => handleContactChange('email', e.target.value)} /></Field>
                          <Field label="Téléphone"><Input value={editableContent?.contact_info?.phone || ""} onChange={(e) => handleContactChange('phone', e.target.value)} /></Field>
                      </div>
                      <Field label="Ville / Pays"><Input value={editableContent?.contact_info?.city || ""} onChange={(e) => handleContactChange('city', e.target.value)} /></Field>
                      <Field label="LinkedIn"><Input value={editableContent?.contact_info?.linkedin || ""} onChange={(e) => handleContactChange('linkedin', e.target.value)} /></Field>
                      <Field label="Github"><Input value={editableContent?.contact_info?.github || ""} onChange={(e) => handleContactChange('github', e.target.value)} /></Field>
                    </EditorSection>

                    <EditorSection title="Infos Générales">
                      <Field label="Titre du poste ciblé">
                        <Input value={editableContent?.cv_title || ""} onChange={(e) => handleFieldChange('cv_title', e.target.value)} />
                      </Field>
                      <Field label="Résumé / Objectif">
                        <Textarea className="min-h-[120px]" value={editableContent?.objective || ""} onChange={(e) => handleFieldChange('objective', e.target.value)} />
                      </Field>
                    </EditorSection>

                    <EditorSection title="Expériences Professionnelles">
                      {(editableContent?.experiences || []).map((exp: any, index: number) => (
                        <SubSection key={index} title={exp.company || `Expérience ${index + 1}`} onDelete={() => removeArrayItem('experiences', index)}>
                          <Field label="Entreprise"><Input value={exp.company} onChange={e => handleArrayItemChange('experiences', index, 'company', e.target.value)} /></Field>
                          <Field label="Poste"><Input value={exp.target_title} onChange={e => handleArrayItemChange('experiences', index, 'target_title', e.target.value)} /></Field>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Field label="Date début"><Input value={exp.start_date} onChange={e => handleArrayItemChange('experiences', index, 'start_date', e.target.value)} /></Field>
                            <Field label="Date fin"><Input value={exp.end_date} onChange={e => handleArrayItemChange('experiences', index, 'end_date', e.target.value)} /></Field>
                          </div>
                          <Field label="Lieu"><Input value={exp.location} onChange={e => handleArrayItemChange('experiences', index, 'location', e.target.value)} /></Field>
                          <Field label="Missions / Tâches">
                            <div className="space-y-2">
                              {(exp.bullets || []).map((bullet: string, bIndex: number) => (
                                <div key={bIndex} className="flex items-center gap-2">
                                  <Textarea value={bullet} onChange={e => handleBulletChange('experiences', index, bIndex, e.target.value)} className="min-h-[40px]" />
                                  <button onClick={() => removeBullet('experiences', index, bIndex)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                              <AddButton onClick={() => addBullet('experiences', index)}>Ajouter une mission</AddButton>
                            </div>
                          </Field>
                        </SubSection>
                      ))}
                      <AddButton onClick={() => addArrayItem('experiences', newExperienceTemplate)}>Ajouter une expérience</AddButton>
                    </EditorSection>

                    <EditorSection title="Projets">
                      {(editableContent?.projects || []).map((proj: any, index: number) => (
                        <SubSection key={index} title={proj.target_title || `Projet ${index + 1}`} onDelete={() => removeArrayItem('projects', index)}>
                          <Field label="Nom du projet"><Input value={proj.target_title} onChange={e => handleArrayItemChange('projects', index, 'target_title', e.target.value)} /></Field>
                          <Field label="Description">
                            <div className="space-y-2">
                              {(proj.bullets || []).map((bullet: string, bIndex: number) => (
                                <div key={bIndex} className="flex items-center gap-2">
                                  <Textarea value={bullet} onChange={e => handleBulletChange('projects', index, bIndex, e.target.value)} className="min-h-[40px]" />
                                  <button onClick={() => removeBullet('projects', index, bIndex)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                              <AddButton onClick={() => addBullet('projects', index)}>Ajouter une description</AddButton>
                            </div>
                          </Field>
                        </SubSection>
                      ))}
                      <AddButton onClick={() => addArrayItem('projects', newProjectTemplate)}>Ajouter un projet</AddButton>
                    </EditorSection>

                    {/* ... Autres sections CV (Education, Skills, Interests) ... */}
                    <EditorSection title="Formation">
                      {(editableContent?.education || []).map((edu: any, index: number) => (
                        <SubSection key={index} title={edu.school || `Formation ${index + 1}`} onDelete={() => removeArrayItem('education', index)}>
                          <Field label="École / Organisme"><Input value={edu.school} onChange={e => handleArrayItemChange('education', index, 'school', e.target.value)} /></Field>
                          <Field label="Diplôme"><Input value={edu.degree} onChange={e => handleArrayItemChange('education', index, 'degree', e.target.value)} /></Field>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Field label="Date début"><Input value={edu.start_date} onChange={e => handleArrayItemChange('education', index, 'start_date', e.target.value)} /></Field>
                            <Field label="Date fin"><Input value={edu.end_date} onChange={e => handleArrayItemChange('education', index, 'end_date', e.target.value)} /></Field>
                          </div>
                          <Field label="Détails">
                            <div className="space-y-2">
                              {(edu.bullets || []).map((bullet: string, bIndex: number) => (
                                <div key={bIndex} className="flex items-center gap-2">
                                  <Textarea value={bullet} onChange={e => handleBulletChange('education', index, bIndex, e.target.value)} className="min-h-[40px]" />
                                  <button onClick={() => removeBullet('education', index, bIndex)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                              <AddButton onClick={() => addBullet('education', index)}>Ajouter un détail</AddButton>
                            </div>
                          </Field>
                        </SubSection>
                      ))}
                      <AddButton onClick={() => addArrayItem('education', newEducationTemplate)}>Ajouter une formation</AddButton>
                    </EditorSection>
                    
                    <EditorSection title="Compétences">
                      {(editableContent?.skills?.sections || []).map((section: any, sIndex: number) => (
                        <SubSection key={sIndex} title={section.section_title || `Section ${sIndex + 1}`} onDelete={() => removeSkillSection(sIndex)}>
                            <Field label="Titre de la section">
                              <Input value={section.section_title} onChange={e => handleSkillSectionChange(sIndex, 'section_title', e.target.value)} />
                            </Field>
                            <Field label="Compétences">
                              <div className="space-y-2">
                                {(section.items || []).map((item: string, iIndex: number) => (
                                  <div key={iIndex} className="flex items-center gap-2">
                                    <Input value={item} onChange={e => handleSkillItemChange(sIndex, iIndex, e.target.value)} />
                                    <button onClick={() => removeSkillItem(sIndex, iIndex)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                ))}
                                <AddButton onClick={() => addSkillItem(sIndex)}>Ajouter une compétence</AddButton>
                              </div>
                            </Field>
                        </SubSection>
                      ))}
                      <AddButton onClick={addSkillSection}>Ajouter une section de compétences</AddButton>
                    </EditorSection>

                    <EditorSection title="Centres d'Intérêt">
                      {(editableContent?.interests || []).map((interest: any, index: number) => (
                        <SubSection key={index} title={interest.label || `Intérêt ${index + 1}`} onDelete={() => removeArrayItem('interests', index)}>
                          <Field label="Label (ex: Course à pied)">
                            <Input value={interest.label} onChange={e => handleArrayItemChange('interests', index, 'label', e.target.value)} />
                          </Field>
                          <Field label="Description (ex: Semi-marathons...)">
                            <Input value={interest.sentence} onChange={e => handleArrayItemChange('interests', index, 'sentence', e.target.value)} />
                          </Field>
                        </SubSection>
                      ))}
                      <AddButton onClick={() => addArrayItem('interests', newInterestTemplate)}>Ajouter un intérêt</AddButton>
                    </EditorSection>
                  </>
                ) : (
                  <>
                     {/* --- ÉDITEUR LETTRE DE MOTIVATION --- */}
                    <EditorSection title="Vos Informations (En-tête)">
                      <Field label="Nom complet"><Input value={editableContent?.header_blocks?.fullname_block || ""} onChange={(e) => handleBlockChange('header_blocks', 'fullname_block', e.target.value)} /></Field>
                      <Field label="Adresse/Ville"><Input value={editableContent?.header_blocks?.location_block || ""} onChange={(e) => handleBlockChange('header_blocks', 'location_block', e.target.value)} /></Field>
                      <Field label="Email"><Input value={editableContent?.header_blocks?.email_block || ""} onChange={(e) => handleBlockChange('header_blocks', 'email_block', e.target.value)} /></Field>
                      <Field label="Téléphone"><Input value={editableContent?.header_blocks?.phone_block || ""} onChange={(e) => handleBlockChange('header_blocks', 'phone_block', e.target.value)} /></Field>
                      <Field label="Liens (Portfolio, etc)"><Input value={editableContent?.header_blocks?.websites_block || ""} onChange={(e) => handleBlockChange('header_blocks', 'websites_block', e.target.value)} /></Field>
                    </EditorSection>
                    
                    <EditorSection title="Informations de l'entreprise">
                      <Field label="Nom du recruteur (si connu)"><Input value={editableContent?.company_blocks?.contact_block || ""} onChange={(e) => handleBlockChange('company_blocks', 'contact_block', e.target.value)} /></Field>
                      <Field label="Nom de l'entreprise"><Input value={editableContent?.company_blocks?.company_name_block || ""} onChange={(e) => handleBlockChange('company_blocks', 'company_name_block', e.target.value)} /></Field>
                      <Field label="Adresse de l'entreprise"><Input value={editableContent?.company_blocks?.company_address_block || ""} onChange={(e) => handleBlockChange('company_blocks', 'company_address_block', e.target.value)} /></Field>
                    </EditorSection>

                    <EditorSection title="Métadonnées">
                      <Field label="Lieu et date (ex: Fait à Paris, le 1er janvier 2024)">
                        <Input value={editableContent?.place_date_line || ""} onChange={(e) => handleFieldChange('place_date_line', e.target.value)} />
                      </Field>
                      <Field label="Objet de la lettre">
                        <Input value={editableContent?.objet_line || ""} onChange={(e) => handleFieldChange('objet_line', e.target.value)} />
                      </Field>
                      <Field label="Formule d'appel (ex: Madame, Monsieur,)">
                        <Input value={editableContent?.greeting || ""} onChange={(e) => handleFieldChange('greeting', e.target.value)} />
                      </Field>
                    </EditorSection>

                    <EditorSection title="Contenu">
                      <Field label="Paragraphe 1 (Accroche)">
                        <Textarea className="min-h-[120px]" value={editableContent?.para1 || ""} onChange={(e) => handleFieldChange('para1', e.target.value)} />
                      </Field>
                      <Field label="Paragraphe 2 (Expérience)">
                        <Textarea className="min-h-[120px]" value={editableContent?.para2 || ""} onChange={(e) => handleFieldChange('para2', e.target.value)} />
                      </Field>
                      <Field label="Paragraphe 3 (Motivation/Entreprise)">
                        <Textarea className="min-h-[120px]" value={editableContent?.para3 || ""} onChange={(e) => handleFieldChange('para3', e.target.value)} />
                      </Field>
                      <Field label="Paragraphe 4 (Conclusion/Appel à l'action)">
                         <Textarea className="min-h-[100px]" value={editableContent?.para4 || ""} onChange={(e) => handleFieldChange('para4', e.target.value)} />
                      </Field>
                    </EditorSection>

                    <EditorSection title="Signature">
                      <Field label="Formule de politesse & Signature">
                        <Input value={editableContent?.signature || ""} onChange={(e) => handleFieldChange('signature', e.target.value)} />
                      </Field>
                    </EditorSection>
                  </>
                )}


              </div>
              <div className="p-4 border-t border-slate-200">
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <p className="text-[11px] text-slate-500 leading-normal italic">
                    Astuce : Modifiez le texte ci-dessus et cliquez sur "Appliquer" pour voir le rendu Finance mis à jour.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Zone */}
          <div className={`flex-1 bg-slate-200/50 p-4 md:p-8 overflow-y-auto flex flex-col items-center shadow-inner ${isEditing ? 'hidden md:flex' : 'flex'}`}>
            {/* Mobile Tabs */}
            <div className="w-full max-w-[21cm] md:hidden mb-4">
              <div className="flex bg-slate-200 rounded-lg p-1">
                {cvData && (
                  <button
                    onClick={() => setActiveTab('cv')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'cv' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    CV
                  </button>
                )}
                {clData && (
                  <button
                    onClick={() => setActiveTab('cl')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'cl' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    Lettre
                  </button>
                )}
              </div>
            </div>

            <div className="w-full max-w-[21cm] bg-white shadow-2xl relative min-h-[29.7cm]">
              {activeTab === 'cv' && cvData ? (
                cvData.html ? (
                  <iframe
                    // La KEY est cruciale pour forcer le rechargement de l'iframe
                    key={cvData.html.length + (isSaving ? 1 : 0)} 
                    srcDoc={cvData.html}
                    className="w-full h-[29.7cm] border-0"
                    title="Aperçu du CV"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[29.7cm] text-slate-400">
                    Génération du rendu...
                  </div>
                )
              ) : null}

              {activeTab === 'cl' && clData ? (
                 clData.html ? (
                  <iframe
                    key={clData.html.length + (isSaving ? 1 : 0)}
                    srcDoc={clData.html}
                    className="w-full h-[29.7cm] border-0"
                    title="Aperçu de la Lettre"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[29.7cm] text-slate-400 italic font-serif">
                    Génération de la lettre...
                  </div>
                )
              ) : null}

              {/* Overlay de chargement pendant la sauvegarde */}
              {isSaving && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-sm font-bold text-indigo-900 tracking-tight">Mise à jour du design Finance...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};