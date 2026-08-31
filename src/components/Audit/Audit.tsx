import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AppMode } from '../Auth/Login';
import logoPng from '../../assets/GE_HealthCare_logo_2023.png';

type AuditForm = {
  établissement: string;
  date: string;
  auditeur: string;
  remarqueGénérale: string;
};

type RendezVous = {
  id: string;
  nom: string;
  interlocuteurs: string;
  serviceConcerné: string;
  utilisateurs: string;
  parcActuel: string;
  satisfaction: string;
  besoinsEtMateriels: string;
  remarquesComplémentaires: string;
};

type SavedAudit = {
  id: string;
  name: string;
  createdAt: string;
  audit: AuditForm;
  rendezVous: RendezVous[];
  activeRendezVousIndex: number;
};

const AUDIT_STORAGE_KEY = 'cvus:saved-audits';

const EMPTY_AUDIT: AuditForm = {
  établissement: '',
  date: new Date().toISOString().slice(0, 10),
  auditeur: '',
  remarqueGénérale: '',
};

const createRendezVous = (): RendezVous => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  nom: '',
  interlocuteurs: '',
  serviceConcerné: '',
  utilisateurs: '',
  parcActuel: '',
  satisfaction: '',
  besoinsEtMateriels: '',
  remarquesComplémentaires: '',
});

const APP_MODES: { key: AppMode; label: string }[] = [
  { key: 'demo', label: 'Démo' },
  { key: 'parc', label: 'Gestion de Parc' },
  { key: 'comparateur', label: 'Comparateur' },
  { key: 'audit', label: 'Audit' },
];

function formatDate(value: string): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR') : 'Non renseignée';
}

type PdfContentLine = { text: string };

function splitOversizedPdfLine(pdf: jsPDF, line: string, maxWidth: number): string[] {
  if (pdf.getTextWidth(line) <= maxWidth) return [line];

  const parts: string[] = [];
  let currentPart = '';
  for (const character of line) {
    if (currentPart && pdf.getTextWidth(currentPart + character) > maxWidth) {
      parts.push(currentPart);
      currentPart = character;
    } else {
      currentPart += character;
    }
  }
  if (currentPart) parts.push(currentPart);
  return parts;
}

function formatPdfContentLines(pdf: jsPDF, content: string): PdfContentLine[] {
  const lines: PdfContentLine[] = [];
  const textRightEdge = 189;
  const textStart = 24;
  content.split(/\r?\n/).forEach((rawLine) => {
    if (!rawLine.trim()) {
      lines.push({ text: '' });
      return;
    }

    const maxWidth = textRightEdge - textStart;
    const wrappedLines = pdf.splitTextToSize(rawLine, maxWidth) as string[];
    wrappedLines.flatMap((wrappedLine) => splitOversizedPdfLine(pdf, wrappedLine, maxWidth)).forEach((wrappedLine) => lines.push({ text: wrappedLine }));
  });
  return lines;
}

function addPdfDetailBlock(pdf: jsPDF, title: string, content: string, y: number, drawHeader: () => void): number {
  if (!content.trim()) return y;

  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const lines = formatPdfContentLines(pdf, content);
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const availableLineCount = Math.floor((pageHeight - 16 - y - 17) / 5);
    if (availableLineCount < 2) {
      pdf.addPage();
      drawHeader();
      y = 37;
      continue;
    }

    const lineChunk = lines.slice(lineIndex, lineIndex + availableLineCount);
    const blockHeight = Math.max(24, 17 + lineChunk.length * 5);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(223, 210, 241);
    pdf.rect(19.76, y, 170.49, blockHeight, 'FD');
    pdf.setFillColor(246, 242, 251);
    pdf.rect(19.76, y, 170.49, 4.94, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(96, 34, 166);
    pdf.text(title.toUpperCase(), 24, y + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(32, 33, 40);
    lineChunk.forEach((line, index) => pdf.text(line.text, 24, y + 17 + (index * 5)));
    lineIndex += lineChunk.length;
    y += blockHeight + 5;

    if (lineIndex < lines.length) {
      pdf.addPage();
      drawHeader();
      y = 37;
    }
  }

  return y;
}

function drawAuditFooters(pdf: jsPDF): void {
  const firstReportPage = 2;
  const totalPages = pdf.getNumberOfPages();
  const reportPageCount = totalPages - firstReportPage + 1;
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let pageNumber = firstReportPage; pageNumber <= totalPages; pageNumber += 1) {
    const reportPageNumber = pageNumber - firstReportPage + 1;
    const text = `GE Healthcare - Rapport d'audit - Page ${reportPageNumber}/${reportPageCount}`;
    pdf.setPage(pageNumber);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, pageHeight - 10, 210, 10, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(text, 105, pageHeight - 4, { align: 'center' });
  }
}

function addContentsLinks(pdf: jsPDF, rendezVous: RendezVous[], meetingStartPages: number[]): void {
  const contentsPage = 2;
  const initialRowTop = 54;
  pdf.setPage(contentsPage);
  rendezVous.forEach((_, index) => {
    const targetPage = meetingStartPages[index];
    if (targetPage) pdf.link(21.17, initialRowTop + (index * 9.88), 167.67, 8.47, { pageNumber: targetPage });
  });
}

async function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = logoPng;
  });
}

function fitText(pdf: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number, maxLines: number): { lines: string[]; size: number } {
  let size = startSize;
  let lines: string[] = [];
  do {
    pdf.setFontSize(size);
    lines = pdf.splitTextToSize(text, maxWidth) as string[];
    if (lines.length <= maxLines || size === minSize) return { lines, size };
    size = Math.max(minSize, size - 1);
  } while (size >= minSize);
  return { lines, size };
}

async function drawCoverPage(pdf: jsPDF, audit: AuditForm): Promise<void> {
  const violet = [96, 34, 166] as const;
  const ink = [32, 33, 40] as const;
  pdf.setFillColor(252, 251, 254);
  pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...violet);
  pdf.rect(0, 0, 210, 48.68, 'F');
  pdf.rect(0, 50.09, 210, 2.12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.text('RAPPORT D\'AUDIT', 105, 19.71, { align: 'center' });
  const logo = await loadLogo();
  if (logo) pdf.addImage(logo, 'PNG', 70.9, 26.15, 68.21, 16.5);

  pdf.setFont('helvetica', 'bold');
  const hospital = fitText(pdf, audit.établissement, 157, 32, 20, 2);
  const hospitalLineGap = (hospital.size * 1.2) / 2.83465;
  const auditor = fitText(pdf, `Audit réalisé par : ${audit.auditeur}`, 157, 11, 9, 2);
  const auditorLineGap = (auditor.size * 1.2) / 2.83465;
  const coverBoxHeight = Math.max(44.45, 22 + (hospital.lines.length * hospitalLineGap) + 4 + (auditor.lines.length * auditorLineGap) + 8);
  const coverBoxTop = 57.82;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(223, 210, 241);
  pdf.rect(19.76, coverBoxTop, 170.49, coverBoxHeight, 'FD');
  pdf.setFillColor(246, 242, 251);
  pdf.rect(19.76, coverBoxTop, 170.49, 4.94, 'F');
  pdf.setFontSize(hospital.size);
  let hospitalY = coverBoxTop + 20;
  pdf.setTextColor(...violet);
  hospital.lines.forEach((line) => {
    pdf.text(line, 105, hospitalY, { align: 'center' });
    hospitalY += hospitalLineGap;
  });
  pdf.setTextColor(...ink);
  pdf.setFontSize(auditor.size);
  const auditorY = hospitalY - 3;
  pdf.text(auditor.lines, 105, auditorY, { align: 'center', lineHeightFactor: 1.2 });
  pdf.setFontSize(11);
  pdf.text(`Date : ${formatDate(audit.date)}`, 105, auditorY + (auditor.lines.length * auditorLineGap) + 4, { align: 'center' });
  const separatorY = coverBoxTop + coverBoxHeight + 6;
  pdf.setFillColor(...violet);
  pdf.rect(14.11, separatorY, 181.78, 0.71, 'F');

  if (audit.remarqueGénérale.trim()) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const remarkLines = formatPdfContentLines(pdf, audit.remarqueGénérale).map((line) => line.text);
    const remarkTop = separatorY + 11;
    const remarkHeight = Math.max(24, 17 + remarkLines.length * 5);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(223, 210, 241);
    pdf.rect(19.76, remarkTop, 170.49, remarkHeight, 'FD');
    pdf.setFillColor(246, 242, 251);
    pdf.rect(19.76, remarkTop, 170.49, 4.94, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...violet);
    pdf.text('REMARQUES GÉNÉRALES', 24, remarkTop + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...ink);
    remarkLines.forEach((line, index) => pdf.text(line, 24, remarkTop + 17 + (index * 5)));
  }
}

async function drawContentsPage(pdf: jsPDF, rendezVous: RendezVous[]): Promise<void> {
  const violet = [96, 34, 166] as const;
  const ink = [32, 33, 40] as const;
  pdf.addPage();
  pdf.setFillColor(252, 251, 254);
  pdf.rect(0, 0, 210, 297, 'F');
  drawPageHeader(pdf, 'Sommaire', await loadLogo());
  pdf.setDrawColor(221, 210, 238);
  pdf.setFillColor(221, 210, 238);
  pdf.rect(20.46, 51, 169.08, 0.71, 'F');
  pdf.setTextColor(...violet);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text('Sommaire', 21.17, 50.3);
  const entries = rendezVous.map((item, index) => item.nom.trim() || `Rendez-vous ${index + 1}`);
  let rowTop = 54;
  entries.forEach((entry, index) => {
    pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 245, index % 2 === 0 ? 255 : 252);
    pdf.setDrawColor(224, 212, 240);
    pdf.rect(21.17, rowTop, 167.67, 8.47, 'FD');
    pdf.setFillColor(...violet);
    pdf.rect(23.99, rowTop + 2.82, 7.76, 4.23, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`#${index + 1}`, 27.87, rowTop + 6.01, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...ink);
    pdf.setFontSize(10);
    pdf.text(entry, 34.57, rowTop + 5.91);
    pdf.text('3', 184.14, rowTop + 5.91, { align: 'right' });
    rowTop += 9.88;
  });
}

export default function Audit({ onSwitchModule }: { onSwitchModule: (mode: AppMode) => void }) {
  const [audit, setAudit] = useState<AuditForm>(EMPTY_AUDIT);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([createRendezVous()]);
  const [activeRendezVousIndex, setActiveRendezVousIndex] = useState(0);
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
  const [isSavedAuditsOpen, setIsSavedAuditsOpen] = useState(false);
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);

  const updateField = <K extends keyof AuditForm>(key: K, value: AuditForm[K]): void => {
    setAudit((current) => ({ ...current, [key]: value }));
  };

  const updateRendezVous = <K extends keyof Omit<RendezVous, 'id'>>(id: string, key: K, value: RendezVous[K]): void => {
    setRendezVous((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addRendezVous = (): void => {
    const newIndex = rendezVous.length;
    setRendezVous((current) => [...current, createRendezVous()]);
    setActiveRendezVousIndex(newIndex);
  };

  const activeRendezVous = rendezVous[activeRendezVousIndex] ?? rendezVous[0];

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) ?? '[]') as SavedAudit[];
      if (Array.isArray(stored)) setSavedAudits(stored);
    } catch {
      setSavedAudits([]);
    }
  }, []);

  const persistSavedAudits = (nextAudits: SavedAudit[]): void => {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextAudits));
    setSavedAudits(nextAudits);
  };

  const saveAudit = (): void => {
    const defaultName = audit.établissement.trim()
      ? `${audit.établissement.trim()} - ${formatDate(audit.date)}`
      : `Audit - ${formatDate(audit.date)}`;
    const enteredName = window.prompt('Nom de l’enregistrement :', defaultName);
    if (enteredName === null) return;
    const name = enteredName.trim();
    if (!name) {
      alert('Le nom de l’enregistrement est obligatoire.');
      return;
    }
    persistSavedAudits([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, createdAt: new Date().toISOString(), audit, rendezVous, activeRendezVousIndex }, ...savedAudits]);
  };

  const loadAudit = (savedAudit: SavedAudit): void => {
    const restoredRendezVous = savedAudit.rendezVous.length ? savedAudit.rendezVous : [createRendezVous()];
    setAudit(savedAudit.audit);
    setRendezVous(restoredRendezVous);
    setActiveRendezVousIndex(Math.min(savedAudit.activeRendezVousIndex, restoredRendezVous.length - 1));
    setIsSavedAuditsOpen(false);
  };

  const deleteAudit = (savedAudit: SavedAudit): void => {
    if (!window.confirm(`Supprimer l’enregistrement "${savedAudit.name}" ?`)) return;
    persistSavedAudits(savedAudits.filter((item) => item.id !== savedAudit.id));
  };

  const generatePdf = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!audit.établissement.trim() || !audit.auditeur.trim()) {
      alert('Veuillez renseigner l’établissement et l’auditeur avant de générer le PDF.');
      return;
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    await drawCoverPage(pdf, audit);
    await drawContentsPage(pdf, rendezVous);
    pdf.addPage();

    let y = 37;
    const pageLogo = await loadLogo();
    const meetingStartPages: number[] = [];
    rendezVous.forEach((item, index) => {
      const meetingTitle = `Rendez-vous ${index + 1}\n${item.nom.trim() || `Rendez-vous ${index + 1}`}`;
      if (index > 0) {
        pdf.addPage();
        y = 37;
      }
      drawPageHeader(pdf, meetingTitle, pageLogo);
      meetingStartPages.push(pdf.getCurrentPageInfo().pageNumber);
      const drawMeetingHeader = () => drawPageHeader(pdf, meetingTitle, pageLogo);
      y = addPdfDetailBlock(pdf, 'Interlocuteurs et leurs rôles', item.interlocuteurs, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Service(s) concerné(s)', item.serviceConcerné, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Utilisateurs dans le service', item.utilisateurs, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Parc actuel', item.parcActuel, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Satisfaction du parc actuel', item.satisfaction, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Besoins et matériels souhaités', item.besoinsEtMateriels, y, drawMeetingHeader);
      y = addPdfDetailBlock(pdf, 'Remarques complémentaires', item.remarquesComplémentaires, y, drawMeetingHeader);
    });

    addContentsLinks(pdf, rendezVous, meetingStartPages);
    drawAuditFooters(pdf);

    const safeName = audit.établissement.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'audit';
    pdf.save(`rapport-audit-${safeName}.pdf`);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-6">
      <form onSubmit={generatePdf} className="mx-auto max-w-6xl rounded-lg bg-gray-50 p-4 shadow-lg md:p-6">
        <header className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative">
              <button type="button" onClick={() => setIsModuleMenuOpen((open) => !open)} className="flex items-center gap-2 text-left">
                <span className="rounded bg-purple-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">Audit</span>
                <span className="text-sm text-gray-500">▾</span>
              </button>
              {isModuleMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 min-w-[190px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {APP_MODES.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => { onSwitchModule(key); setIsModuleMenuOpen(false); }} className={`block w-full px-4 py-2 text-sm hover:bg-purple-50 ${key === 'audit' ? 'bg-purple-50 font-semibold text-purple-800' : 'text-gray-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setIsSavedAuditsOpen(true)} className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-purple-600">Mes enregistrements</button>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-lg bg-white p-5 shadow">
          <h1 className="text-xl font-bold text-purple-800">Établissement</h1>
          <p className="mt-1 text-sm text-gray-500">Informations utilisées pour la page de garde du rapport</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Établissement *" value={audit.établissement} onChange={(value) => updateField('établissement', value)} />
            <Field label="Date de l'audit" type="date" value={audit.date} onChange={(value) => updateField('date', value)} />
            <Field label="Audit réalisé par *" value={audit.auditeur} onChange={(value) => updateField('auditeur', value)} />
          </div>
          <div className="mt-4">
            <TextArea label="Remarques générales" value={audit.remarqueGénérale} onChange={(value) => updateField('remarqueGénérale', value)} placeholder="Informations générales sur l'établissement..." />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-lg bg-white p-4 shadow">
            {rendezVous.map((_, index) => (
              <button
                key={`rendez-vous-tab-${index}`}
                type="button"
                onClick={() => setActiveRendezVousIndex(index)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeRendezVousIndex === index ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Rendez-vous {index + 1}
              </button>
            ))}
            <button type="button" onClick={addRendezVous} className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-600">Ajouter un rendez-vous</button>
          </div>
          {activeRendezVous && (
            <div className="rounded-lg bg-white p-5 shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-purple-800">Rendez-vous {activeRendezVousIndex + 1}</h2>
                <div className="w-full sm:w-80">
                  <label className="sr-only" htmlFor={`rendez-vous-name-${activeRendezVous.id}`}>Nom dans le sommaire</label>
                  <input id={`rendez-vous-name-${activeRendezVous.id}`} type="text" value={activeRendezVous.nom || ''} onChange={(event) => updateRendezVous(activeRendezVous.id, 'nom', event.target.value)} placeholder={`Nom dans le sommaire (Rendez-vous ${activeRendezVousIndex + 1})`} className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600" />
                </div>
              </div>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2"><TextArea label="Interlocuteurs et leurs rôles" value={activeRendezVous.interlocuteurs} onChange={(value) => updateRendezVous(activeRendezVous.id, 'interlocuteurs', value)} placeholder="Nom - rôle" /></div>
              <div className="lg:col-span-2"><TextArea label="Service(s) concerné(s)" value={activeRendezVous.serviceConcerné} onChange={(value) => updateRendezVous(activeRendezVous.id, 'serviceConcerné', value)} placeholder="Service, spécialité, organisation..." /></div>
              <div className="lg:col-span-2"><TextArea label="Utilisateurs dans le service" value={activeRendezVous.utilisateurs} onChange={(value) => updateRendezVous(activeRendezVous.id, 'utilisateurs', value)} placeholder="Profils, nombre d'utilisateurs, habitudes..." /></div>
              <div className="lg:col-span-2"><TextArea label="Parc actuel" value={activeRendezVous.parcActuel} onChange={(value) => updateRendezVous(activeRendezVous.id, 'parcActuel', value)} placeholder="Équipements en place, ancienneté, usage..." /></div>
              <div className="lg:col-span-2"><TextArea label="Satisfaction du parc actuel" value={activeRendezVous.satisfaction} onChange={(value) => updateRendezVous(activeRendezVous.id, 'satisfaction', value)} placeholder="Niveau de satisfaction, points appréciés et difficultés..." /></div>
              <div className="lg:col-span-2 rounded-lg bg-white p-5 shadow">
                <label className="mb-3 block text-base font-bold text-purple-800">Besoins et matériels souhaités</label>
                <textarea value={activeRendezVous.besoinsEtMateriels} onChange={(event) => updateRendezVous(activeRendezVous.id, 'besoinsEtMateriels', event.target.value)} placeholder="Besoins exprimés, matériels souhaités, échéances..." rows={6} className="w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600" />
              </div>
              <div className="lg:col-span-2"><TextArea label="Remarques complémentaires" value={activeRendezVous.remarquesComplémentaires} onChange={(value) => updateRendezVous(activeRendezVous.id, 'remarquesComplémentaires', value)} placeholder="Éléments complémentaires issus du rendez-vous..." /></div>
            </div>
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
          <button type="button" onClick={saveAudit} className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700">Enregistrer</button>
          <button type="submit" className="rounded-lg bg-purple-800 px-6 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-purple-700">Générer le PDF</button>
        </div>

        {isSavedAuditsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-800">Mes enregistrements</h2>
                <button type="button" onClick={() => setIsSavedAuditsOpen(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Fermer</button>
              </div>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
                {savedAudits.length === 0 && <p className="text-gray-600">Aucun rapport enregistré pour le moment.</p>}
                {savedAudits.map((savedAudit) => (
                  <div key={savedAudit.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:flex-row md:items-center md:justify-between">
                    <div><p className="font-semibold text-gray-800">{savedAudit.name}</p><p className="text-sm text-gray-600">Rendez-vous : {savedAudit.rendezVous.length}</p><p className="text-xs text-gray-500">Créé le {new Date(savedAudit.createdAt).toLocaleString('fr-FR')}</p></div>
                    <div className="flex gap-2"><button type="button" onClick={() => loadAudit(savedAudit)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Charger</button><button type="button" onClick={() => deleteAudit(savedAudit)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><label className="mb-2 block text-sm font-bold text-gray-700">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600" /></div>;
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    const textarea = event.currentTarget;
    const lineStart = textarea.value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
    const currentLine = textarea.value.slice(lineStart, textarea.selectionStart);
    if (event.key === ' ' && currentLine === '-') {
      event.preventDefault();
      const nextValue = `${textarea.value.slice(0, lineStart)}  - ${textarea.value.slice(textarea.selectionEnd)}`;
      onChange(nextValue);
      requestAnimationFrame(() => {
        const cursorPosition = lineStart + 4;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      });
      return;
    }

    if (event.key !== 'Enter') return;

    if (!currentLine.startsWith('  - ')) return;

    event.preventDefault();
    const nextValue = `${textarea.value.slice(0, textarea.selectionStart)}\n  - ${textarea.value.slice(textarea.selectionEnd)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      const cursorPosition = textarea.selectionStart + 5;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  return <div className="rounded-lg bg-white p-5 shadow"><label className="mb-3 block text-base font-bold text-purple-800">{label}</label><textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} rows={6} className="w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600" /></div>;
}

function drawPageHeader(pdf: jsPDF, title: string, logo: HTMLImageElement | null): void {
  pdf.setFillColor(96, 34, 166);
  pdf.rect(0, 0, 210, 30, 'F');
  if (logo) pdf.addImage(logo, 'PNG', 8, 9.8, 42, 10.16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const titleLines = title.split('\n');
  if (titleLines.length > 1) {
    pdf.setFontSize(20);
    pdf.text(titleLines[0], 105, 11, { align: 'center' });
    const subtitleLines = pdf.splitTextToSize(titleLines.slice(1).join(' '), 132) as string[];
    pdf.text(subtitleLines, 105, 21, { align: 'center', lineHeightFactor: 1.05 });
    return;
  }
  pdf.setFontSize(title === 'Sommaire' ? 28 : 20);
  pdf.text(pdf.splitTextToSize(title, 132), 105, 18, { align: 'center', lineHeightFactor: 1.05 });
}