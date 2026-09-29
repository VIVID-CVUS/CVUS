import { type KeyboardEvent, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AppMode } from '../Auth/Login';
import logoPng from '../../assets/GE_HealthCare_logo_2023TEST.png';

type EvaluationCriterion = {
  id: string;
  label: string;
};

type EvaluationCategory = {
  id: string;
  name: string;
  criteria: EvaluationCriterion[];
};

type EvaluationForm = {
  etablissement: string;
  service: string;
  date: string;
  evaluateur: string;
  produit: string;
  sondesTestees: string;
  categories: EvaluationCategory[];
};

type SavedEvaluation = {
  id: string;
  name: string;
  createdAt: string;
  form: EvaluationForm;
};

const STORAGE_KEY = 'cvus:saved-evaluations';

const ECHOGRAPHES = [
  'Vivid Pioneer 4D',
  'Vivid Pioneer interventional',
  'Vivid Pioneer 2D',
  'Vivid Explorer 2D',
  'Vivid Advanced',
  'Vivid Focus',
  'Vivid E95',
  'Vivid E90',
  'Vivid S70N Dimension',
  'Vivid S70N',
  'Vivid S60N',
  'Vivid iq',
  'Vivid T9',
  'Vivid T8',
  'Venue',
  'Venue Go',
  'Venue Fit',
  'Venue Sprint',
];

const ERGONOMIE_CRITERES = [
  "Prise en main générale de l'échographe",
  "Lisibilité de l'écran et clarté de l'interface",
  'Accès aux réglages, presets et fonctions principales',
  'Fluidité du workflow et rapidité d’utilisation',
  "Positionnement / mobilité du système dans l’environnement de travail",
];

const QUALITE_IMAGERIE_CRITERES = [
  'Homogénéité de l’image',
  'Gestion des artefacts / bruit',
  'Qualité de l’image avec peu de réglages',
  'Qualité du zoom et des images en profondeur',
  'Qualité des différents modes utilisés : B, M, Doppler',
  'Sensibilité des différents Doppler',
  'Facilité de réglage PRF, gain, filtre de paroi',
];

const SONDES_CRITERES = [
  'Diversité des fréquences disponibles',
  'Robustesse et durabilité',
];

const OUTILS_INTEGRES_CRITERES = [
  'Fiabilité des mesures automatiques',
  'Rapports automatisés',
  'Aide au guidage / positionnement',
  'Connectivité (DICOM, réseau, cloud)',
  'Personnalisation des workflows',
  'Raccourcis',
];

const CATEGORY_CRITERES_SUGGESTIONS: Record<string, string[]> = {
  'cat-ergonomie': ERGONOMIE_CRITERES,
  'cat-imagerie': QUALITE_IMAGERIE_CRITERES,
  'cat-sondes': SONDES_CRITERES,
  'cat-outils': OUTILS_INTEGRES_CRITERES,
};

const createCriterion = (label = 'Nouveau critère'): EvaluationCriterion => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${label}`,
  label,
});

const createCategory = (name = 'Nouvelle catégorie'): EvaluationCategory => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`,
  name,
  criteria: [createCriterion()],
});

const createInitialForm = (): EvaluationForm => ({
  etablissement: '',
  service: '',
  date: new Date().toISOString().slice(0, 10),
  evaluateur: '',
  produit: '',
  sondesTestees: '',
  categories: [
    {
      id: 'cat-ergonomie',
      name: 'Ergonomie',
      criteria: [
        createCriterion('Facilité d’utilisation'),
        createCriterion('Confort des commandes'),
      ],
    },
    {
      id: 'cat-imagerie',
      name: 'Qualité d’imagerie',
      criteria: [
        createCriterion('Résolution / finesse des détails'),
        createCriterion('Contraste entre les tissus'),
        createCriterion('Qualité sur patients difficiles'),
      ],
    },
    {
      id: 'cat-sondes',
      name: 'Sondes',
      criteria: [
        createCriterion('Adéquation de la gamme de sondes avec l’activité du service'),
        createCriterion('Facilité de prise en main'),
        createCriterion('Qualité d’image en profondeur selon la sonde'),
      ],
    },
    {
      id: 'cat-outils',
      name: 'Outils intégrés',
      criteria: [
        createCriterion('Mesures IA automatique'),
        createCriterion('Tracés automatique'),
        createCriterion('Strain et FE Auto'),
      ],
    },
  ],
});

const APP_MODES: { key: AppMode; label: string }[] = [
  { key: 'demo', label: 'Démo' },
  { key: 'parc', label: 'Gestion de Parc' },
  { key: 'comparateur', label: 'Comparateur' },
  { key: 'audit', label: 'Audit' },
  { key: 'evaluation', label: 'Fiche d’évaluation' },
];

function formatDate(value: string): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR') : '';
}

export default function Evaluation({ onSwitchModule }: { onSwitchModule: (mode: AppMode) => void }) {
  const [form, setForm] = useState<EvaluationForm>(createInitialForm);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedEvaluations, setSavedEvaluations] = useState<SavedEvaluation[]>([]);
  const [isSavedEvaluationsOpen, setIsSavedEvaluationsOpen] = useState(false);
  const [openErgonomieCriterionId, setOpenErgonomieCriterionId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SavedEvaluation[];
      setSavedEvaluations(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedEvaluations([]);
    }
  }, []);

  const updateField = <K extends keyof EvaluationForm>(key: K, value: EvaluationForm[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCategory = (categoryId: string, value: string): void => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, name: value } : category,
      ),
    }));
  };

  const updateCriterion = (categoryId: string, criterionId: string, value: string): void => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          criteria: category.criteria.map((criterion) => {
            if (criterion.id !== criterionId) return criterion;
            return { ...criterion, label: value };
          }),
        };
      }),
    }));
  };

  const addCategory = (): void => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      return;
    }

    setForm((current) => ({
      ...current,
      categories: [...current.categories, createCategory(trimmedName)],
    }));
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const cancelAddCategory = (): void => {
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const startAddCategory = (): void => {
    setIsAddingCategory(true);
  };

  const handleCategoryNameKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCategory();
    }
    if (event.key === 'Escape') {
      cancelAddCategory();
    }
  };

  const removeCategory = (categoryId: string): void => {
    setForm((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
    }));
  };

  const addCriterion = (categoryId: string): void => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? { ...category, criteria: [...category.criteria, createCriterion()] }
          : category,
      ),
    }));
  };

  const removeCriterion = (categoryId: string, criterionId: string): void => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          criteria: category.criteria.filter((criterion) => criterion.id !== criterionId),
        };
      }),
    }));
  };

  const saveEvaluation = (): void => {
    const name = form.etablissement.trim() || form.produit.trim() || 'Fiche d’évaluation';
    const persisted = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `${name} - ${formatDate(form.date)}`,
        createdAt: new Date().toISOString(),
        form,
      },
      ...savedEvaluations,
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    setSavedEvaluations(persisted);
  };

  const loadEvaluation = (item: SavedEvaluation): void => {
    setForm(item.form);
  };

  const deleteEvaluation = (id: string): void => {
    const next = savedEvaluations.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedEvaluations(next);
  };

  const generatePdf = (): void => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const logo = new Image();
    logo.src = logoPng;
    logo.onload = () => {
      const purple = [96, 34, 166] as const;
      const lightGray = [241, 242, 244] as const;
      const dark = [35, 35, 35] as const;
      const value = (text?: string): string => text?.trim() || '';

      const drawHeader = (firstPage: boolean): void => {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, firstPage ? 32 : 14, 'F');
        pdf.addImage(logo, 'PNG', 174, 6, 24, 5.4);
        if (firstPage) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(18);
          pdf.setTextColor(...purple);
          pdf.text('FICHE D’ÉVALUATION – TEST D’ÉCHOGRAPHE', pageWidth / 2, 20, { align: 'center' });
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          pdf.setTextColor(90, 90, 90);
          pdf.text('GE HealthCare  |  Évaluation client – Ultrasound', pageWidth / 2, 27, { align: 'center' });
        }
        pdf.setFillColor(...purple);
        pdf.rect(12, firstPage ? 31 : 12, 186, 0.8, 'F');
      };

      const drawInfoTable = (startY: number, rows: [[string, string], [string, string]][]): number => {
        const colWidth = 93;
        let rowY = startY;
        rows.forEach((row, rowIndex) => {
          const cellPad = 3;
          const labelLines = row.map(([label]) => pdf.splitTextToSize(label, colWidth - cellPad * 2) as string[]);
          const rowHeight = Math.max(12, Math.max(labelLines[0].length, labelLines[1].length) * 4 + 8);
          const rowColor: readonly [number, number, number] = rowIndex % 2 === 0 ? lightGray : [255, 255, 255];
          pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
          pdf.rect(12, rowY, colWidth * 2, rowHeight, 'F');
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(12, rowY, colWidth * 2, rowHeight);
          pdf.line(12 + colWidth, rowY, 12 + colWidth, rowY + rowHeight);
          row.forEach(([, text], cellIndex) => {
            const cellX = 12 + cellIndex * colWidth + cellPad;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(...dark);
            const lines = labelLines[cellIndex];
            lines.forEach((line, li) => pdf.text(line, cellX, rowY + 5 + li * 4));
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(70, 70, 70);
            pdf.text(value(text), cellX, rowY + 5 + lines.length * 4, { maxWidth: colWidth - cellPad * 2 });
          });
          rowY += rowHeight;
        });
        return rowY;
      };

      drawHeader(true);
      let y = 38;
      y = drawInfoTable(y, [
        [['Hôpital', form.etablissement], ['Date', formatDate(form.date)]],
        [['Service', form.service], ['Évaluateur', form.evaluateur]],
        [['Modèle d’échographe', form.produit], ['Sondes testées', form.sondesTestees]],
      ]);
      y += 12;

      const startNewPage = (): void => {
        pdf.addPage();
        drawHeader(false);
        y = 18;
      };

      const ensureSpace = (height: number): void => {
        if (y + height > pageHeight - 14) startNewPage();
      };

      const colCritere = 68;
      const colScore = 9;
      const colCommentaire = 186 - colCritere - colScore * 6;
      const scoreLabels = ['1', '2', '3', '4', '5', 'N/A'];
      const scaleText = 'Échelle : 1 = Insuffisant  ·  2 = À améliorer  ·  3 = Satisfaisant  ·  4 = Très satisfaisant  ·  5 = Excellent  ·  N/A = Non testé';

      const drawCategory = (category: EvaluationCategory, categoryIndex: number): void => {
        ensureSpace(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(...purple);
        const categoryTitle = pdf.splitTextToSize(`${categoryIndex + 1}. ${category.name}`, 186) as string[];
        categoryTitle.forEach((line, index) => pdf.text(line, 12, y + index * 4.5));
        y += categoryTitle.length * 4.5;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(90, 90, 90);
        const scaleLines = pdf.splitTextToSize(scaleText, 186) as string[];
        scaleLines.forEach((line, index) => pdf.text(line, 12, y + index * 4));
        y += scaleLines.length * 4;

        const drawTableHeaderRow = (): void => {
          pdf.setFillColor(...purple);
          pdf.rect(12, y, 186, 8, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.text('Critère évalué', 14, y + 5.3);
          scoreLabels.forEach((label, index) => {
            const colX = 12 + colCritere + index * colScore;
            pdf.text(label, colX + colScore / 2, y + 5.3, { align: 'center' });
          });
          pdf.text('Commentaire', 12 + colCritere + colScore * 6 + 2, y + 5.3);
          y += 8;
        };

        drawTableHeaderRow();

        const ensureRowSpace = (height: number): void => {
          const beforeY = y;
          ensureSpace(height);
          if (y < beforeY) drawTableHeaderRow();
        };

        category.criteria.forEach((criterion) => {
          const critereLines = pdf.splitTextToSize(criterion.label || 'Critère non renseigné', colCritere - 4) as string[];
          const rowHeight = Math.max(14, critereLines.length * 4.2 + 4);
          ensureRowSpace(rowHeight);
          pdf.setDrawColor(190, 190, 190);
          pdf.rect(12, y, 186, rowHeight);
          pdf.line(12 + colCritere, y, 12 + colCritere, y + rowHeight);
          for (let i = 1; i < scoreLabels.length; i += 1) {
            const lineX = 12 + colCritere + i * colScore;
            pdf.line(lineX, y, lineX, y + rowHeight);
          }
          pdf.line(12 + colCritere + colScore * 6, y, 12 + colCritere + colScore * 6, y + rowHeight);
          pdf.setTextColor(...dark);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          critereLines.forEach((line, li) => pdf.text(line, 14, y + 5 + li * 4.2));
          pdf.setDrawColor(140, 140, 140);
          scoreLabels.forEach((_, index) => {
            const colX = 12 + colCritere + index * colScore;
            const boxSize = 3.4;
            pdf.rect(colX + colScore / 2 - boxSize / 2, y + rowHeight / 2 - boxSize / 2, boxSize, boxSize);
          });
          const commentX = 12 + colCritere + colScore * 6;
          pdf.setDrawColor(210, 210, 210);
          pdf.line(commentX + 2, y + rowHeight - 7, commentX + colCommentaire - 2, y + rowHeight - 7);
          pdf.line(commentX + 2, y + rowHeight - 2.5, commentX + colCommentaire - 2, y + rowHeight - 2.5);
          y += rowHeight;
        });

        const generalBoxHeight = 18;
        ensureSpace(6 + generalBoxHeight);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...dark);
        pdf.text('Commentaire additionnel', 12, y + 4);
        const generalBoxY = y + 6;
        pdf.setDrawColor(190, 190, 190);
        pdf.rect(12, generalBoxY, 186, generalBoxHeight);
        pdf.setDrawColor(210, 210, 210);
        pdf.line(14, generalBoxY + 6, 196, generalBoxY + 6);
        pdf.line(14, generalBoxY + 11, 196, generalBoxY + 11);
        pdf.line(14, generalBoxY + 16, 196, generalBoxY + 16);
        y = generalBoxY + generalBoxHeight + 14;
      };

      form.categories.forEach(drawCategory);
      y += 2;

      ensureSpace(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...purple);
      pdf.text(`${form.categories.length + 1}. Bilan utilisateur`, 12, y);
      y += 7;

      ensureSpace(10);
      const radioSize = 2.8;
      const needsOptions = ['Faible', 'Moyenne', 'Bonne', 'Très bonne'];
      const measureLineWidth = (fontSize: number): number => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        let width = pdf.getTextWidth('Satisfaction globale :') + 3;
        pdf.setFont('helvetica', 'normal');
        [1, 2, 3, 4, 5].forEach((option) => {
          width += radioSize + 1 + pdf.getTextWidth(String(option)) + 3;
        });
        width += 5;
        pdf.setFont('helvetica', 'bold');
        width += pdf.getTextWidth('Adéquation aux besoins :') + 3;
        pdf.setFont('helvetica', 'normal');
        needsOptions.forEach((label) => {
          width += radioSize + 1 + pdf.getTextWidth(label) + 3;
        });
        return width;
      };
      let satisfactionFontSize = 9;
      while (measureLineWidth(satisfactionFontSize) > 186 && satisfactionFontSize > 6) {
        satisfactionFontSize -= 0.25;
      }
      pdf.setFontSize(satisfactionFontSize);
      let x = 12;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...dark);
      pdf.text('Satisfaction globale :', x, y);
      x += pdf.getTextWidth('Satisfaction globale :') + 3;
      pdf.setFont('helvetica', 'normal');
      [1, 2, 3, 4, 5].forEach((option) => {
        pdf.rect(x, y - 2.8, radioSize, radioSize);
        pdf.text(String(option), x + radioSize + 1, y);
        x += radioSize + 1 + pdf.getTextWidth(String(option)) + 3;
      });

      x += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Adéquation aux besoins :', x, y);
      x += pdf.getTextWidth('Adéquation aux besoins :') + 3;
      pdf.setFont('helvetica', 'normal');
      needsOptions.forEach((label) => {
        pdf.rect(x, y - 2.8, radioSize, radioSize);
        pdf.text(label, x + radioSize + 1, y);
        x += radioSize + 1 + pdf.getTextWidth(label) + 3;
      });
      y += 8;

      const drawObservationBlock = (title: string): void => {
        const boxHeight = 21;
        ensureSpace(6 + boxHeight + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...dark);
        pdf.text(title, 12, y);
        const boxY = y + 3;
        pdf.setDrawColor(190, 190, 190);
        pdf.rect(12, boxY, 186, boxHeight);
        pdf.setDrawColor(210, 210, 210);
        pdf.line(14, boxY + 6, 196, boxY + 6);
        pdf.line(14, boxY + 11, 196, boxY + 11);
        pdf.line(14, boxY + 16, 196, boxY + 16);
        y = boxY + boxHeight + 5;
      };

      drawObservationBlock('Points forts identifiés');
      drawObservationBlock('Points à améliorer / limites perçues');
      drawObservationBlock('Commentaires, questions ou demandes complémentaires');

      const totalPages = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 140, 140);
        pdf.text(`Page ${pageNumber} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
      }

      const safeName = (form.etablissement || form.produit || 'fiche-evaluation').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'fiche-evaluation';
      pdf.save(`fiche-evaluation-${safeName}.pdf`);
    };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-purple-800 px-6 py-4 text-white shadow-md">
        <div className="relative mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div>
              <h1 className="text-xl font-bold text-left">GE Healthcare</h1>
              <p className="flex items-center gap-1 text-sm text-purple-200">
                Fiche d’évaluation <span className="text-purple-300">▾</span>
              </p>
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg">
              {APP_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSwitchModule(key);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    key === 'evaluation' ? 'bg-purple-50 font-semibold text-purple-800' : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-800">Fiche de retour d’expérience</h2>
              <p className="text-sm text-gray-600">Préparez les critères et les observations du rapport client.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setIsSavedEvaluationsOpen(true)} className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-purple-600">Mes enregistrements</button>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-purple-100 bg-purple-50 p-3">
            <h3 className="text-base font-bold text-purple-800">Informations de la fiche</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Hôpital
              <input value={form.etablissement} onChange={(event) => updateField('etablissement', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Nom de l’hôpital" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Service
              <input value={form.service} onChange={(event) => updateField('service', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Cardiologie, réa..." />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Modèle d’échographe
              <select value={form.produit} onChange={(event) => updateField('produit', event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2">
                <option value="">-- Sélectionner un échographe --</option>
                {ECHOGRAPHES.map((echographe) => <option key={echographe} value={echographe}>{echographe}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Sondes
              <input value={form.sondesTestees} onChange={(event) => updateField('sondesTestees', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Modèle de sondes" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Évaluateur
              <input value={form.evaluateur} onChange={(event) => updateField('evaluateur', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Nom de l’évaluateur" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              Date
              <input type="date" lang="fr" value={form.date} onChange={(event) => updateField('date', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>

        </div>

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Catégories et critères du rapport</h3>
            {!isAddingCategory && <button type="button" onClick={startAddCategory} className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-700">+ Ajouter catégorie</button>}
          </div>

          {isAddingCategory && (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row">
              <input autoFocus value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} onKeyDown={handleCategoryNameKeyDown} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2" placeholder="Nom de la catégorie" />
              <button type="button" onClick={addCategory} disabled={!newCategoryName.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Ajouter</button>
              <button type="button" onClick={cancelAddCategory} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">Annuler</button>
            </div>
          )}

          <div className="space-y-5">
            {form.categories.map((category, categoryIndex) => {
              return (
                <div key={category.id} className="rounded-xl border border-purple-100 bg-purple-50 p-4 shadow-sm">
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex w-full items-center gap-3 md:max-w-lg">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-sm font-bold text-white">{categoryIndex + 1}</span>
                      <input value={category.name} onChange={(event) => updateCategory(category.id, event.target.value)} className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2" placeholder="Nom de la catégorie" />
                    </div>
                    <button type="button" onClick={() => removeCategory(category.id)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">Supprimer</button>
                  </div>

                  <div className="space-y-3">
                    {category.criteria.map((criterion) => (
                      <div key={criterion.id} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-[2fr_auto] md:items-center">
                        {CATEGORY_CRITERES_SUGGESTIONS[category.id] ? (
                          <div className="relative">
                            <input value={criterion.label} onFocus={() => setOpenErgonomieCriterionId(criterion.id)} onChange={(event) => updateCriterion(category.id, criterion.id, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10" placeholder="Saisir ou choisir un critère" />
                            <button type="button" aria-label="Afficher les critères suggérés" onClick={() => setOpenErgonomieCriterionId((current) => current === criterion.id ? null : criterion.id)} className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-purple-700">▾</button>
                            {openErgonomieCriterionId === criterion.id && (
                              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
                                {CATEGORY_CRITERES_SUGGESTIONS[category.id].map((critere) => (
                                  <button key={critere} type="button" onClick={() => { updateCriterion(category.id, criterion.id, critere); setOpenErgonomieCriterionId(null); }} className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-purple-50">{critere}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <input value={criterion.label} onChange={(event) => updateCriterion(category.id, criterion.id, event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Critère" />
                        )}
                        <button type="button" onClick={() => removeCriterion(category.id, criterion.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Retirer</button>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => addCriterion(category.id)} className="mt-3 rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50">+ Ajouter critère</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
          <button type="button" onClick={saveEvaluation} className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700">Enregistrer</button>
          <button type="button" onClick={generatePdf} className="rounded-lg bg-purple-800 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-purple-700">Générer le PDF</button>
        </div>

        {isSavedEvaluationsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-800">Mes enregistrements</h2>
                <button type="button" onClick={() => setIsSavedEvaluationsOpen(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Fermer</button>
              </div>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
                {savedEvaluations.length === 0 && <p className="text-gray-600">Aucune fiche enregistrée pour le moment.</p>}
                {savedEvaluations.map((savedEvaluation) => (
                  <div key={savedEvaluation.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{savedEvaluation.name}</p>
                      <p className="text-xs text-gray-500">Créée le {new Date(savedEvaluation.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { loadEvaluation(savedEvaluation); setIsSavedEvaluationsOpen(false); }} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Charger</button>
                      <button type="button" onClick={() => deleteEvaluation(savedEvaluation.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
