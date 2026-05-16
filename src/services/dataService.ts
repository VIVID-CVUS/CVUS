import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { PDFArray, PDFDocument, PDFName, StandardFonts, rgb } from 'pdf-lib';
import logoPng from '../assets/GE_HealthCare_logo_2023.png'
// import autoTable from 'jspdf-autotable';
// import emailjs from 'emailjs-com';

// Define your color constants
const primaryColor = [96, 34, 166]; // #6022A6
const accentColor = [96, 34, 166];

const formatDateJJMMAAAA = (dateValue?: string): string => {
  if (!dateValue) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const frDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (frDatePattern.test(dateValue)) {
    return dateValue;
  }

  const isoDateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(dateValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return dateValue;
};

const normalizeTextForPdf = (value: string): string => {
  return value
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/[\u00A0\u202F\u2007]/g, ' ')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...');
};

const normalizeTextForPdfLib = (value: string): string => {
  let text = normalizeTextForPdf(value)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ');

  // Transliterate accented characters to safe WinAnsi equivalents using regex
  text = text.replace(/[àáâãäå]/g, 'a');
  text = text.replace(/[èéêë]/g, 'e');
  text = text.replace(/[ìíîï]/g, 'i');
  text = text.replace(/[òóôõö]/g, 'o');
  text = text.replace(/[ùúûü]/g, 'u');
  text = text.replace(/[ýÿ]/g, 'y');
  text = text.replace(/ç/g, 'c');
  text = text.replace(/ñ/g, 'n');
  text = text.replace(/æ/g, 'ae');
  text = text.replace(/œ/g, 'oe');

  // Drop any remaining unsupported code points
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
};

type SondeCategory =
  | 'Sectorielle'
  | 'ETO'
  | 'Convexe'
  | 'Linéaire'
  | 'Portable'
  | 'Crayon'
  | 'Endocavitaire'
  | 'Non classée';

const ETO_SONDES = new Set(['6TC-RS', '9T-RS', '10T-D', '6VT-D', '9T', '9VT-D', '9VT']);
const CRAYON_SONDES = new Set(['P2D', 'P6D']);
const SECTORIELLE_FORCE = new Set(['4VC-D', '6VC-D']);
const SONDE_CATEGORY_ORDER: SondeCategory[] = [
  'Sectorielle',
  'ETO',
  'Convexe',
  'Linéaire',
  'Portable',
  'Crayon',
  'Endocavitaire',
  'Non classée',
];

const categorizeSondeForPdf = (name: string): SondeCategory => {
  const normalized = name.toUpperCase().replace(/\s+/g, ' ').trim();
  const base = normalized.replace(/\(.*?\)/g, '').trim();

  if (base.includes('VSCAN')) return 'Portable';
  if (CRAYON_SONDES.has(base)) return 'Crayon';
  if (ETO_SONDES.has(base)) return 'ETO';

  if (
    base.startsWith('IC')
    || base.includes('IC5')
    || base.includes('IC- CORD')
    || base.includes('ICE CORD')
  ) {
    return 'Endocavitaire';
  }

  if (
    SECTORIELLE_FORCE.has(base)
    || base.includes('4VC')
    || base.includes('6VC')
    || base.includes('SC')
    || /(^|[^A-Z])S\d/.test(base)
    || /\dS-/.test(base)
    || base.includes('S-RS')
  ) {
    return 'Sectorielle';
  }

  if (
    base.startsWith('C')
    || /(^|[^A-Z])C\d/.test(base)
    || base.includes('C-RS')
    || /-C($|-)/.test(base)
  ) {
    return 'Convexe';
  }

  if (base.includes('L')) return 'Linéaire';

  return 'Non classée';
};

// Type de données pour la présentation des éléments
export type PresentedItem = {
  name: string;
  value: boolean;
  presented: boolean;
  appreciated: boolean;
  wanted: boolean;
};

// Type représentant un commercial
type Commercial = {
  name: string;
  email: string;
};

// Define your types - Consolidated PreparedData
type PreparedData = {
  selectedDevice: string;
  clientInfo: {
    name: string;
    email: string;
    demoDate: string;
    lieuService: string;
    generalRemarks: string;
  };
  sondes: {
    data: PresentedItem[];
    comments: string;
  };
  features: {
    data: PresentedItem[];
    comments: string;
  };
  hardware: {
    data: PresentedItem[];
    comments: string;
  };
  connex: {
    data: PresentedItem[];
    comments: string;
  };
  commercial: Commercial | null;
  selectedIAs: string[];
  emailBody: string;
  selectedCommercialEmails: string[];
  selectedIAEmails: string[];
  medecins: {
    promoteur: string;
    detracteur: string;
    indecis: string;
  };
};

export type ReportMode = 'demo' | 'parc' | 'comparateur';

export type ParcCoverInfo = {
  hospitalName: string;
  demoDate: string;
  address: string;
};

type ExportPdfOptions = {
  skipSave?: boolean;
  returnBlob?: boolean;
  includeClientInfo?: boolean;
  clientInfoBannerOnly?: boolean;
  reportMode?: ReportMode;
};

// Define jsPDF internal type extension
interface PDFInternal {
  getNumberOfPages: () => number;
  events: Record<string, unknown>;
  scaleFactor: number;
  pageSize: {
    width: number;
    getWidth: () => number;
    height: number;
    getHeight: () => number;
  };
  pages: number[];
  getEncryptor: (objectId: number) => (data: string) => string;
}

// Fixed ExtendedJsPDF type
type ExtendedJsPDF = jsPDF & {
  internal: PDFInternal;
};

const CONTENT_TOP_Y = 50;
const CONTENT_BOTTOM_Y = 285;

type DrawHeaderFn = () => void;

type PaginatedGrayBoxOptions = {
  pdf: ExtendedJsPDF;
  drawHeader: DrawHeaderFn;
  y: number;
  lines: string[];
  bodyFontStyle?: 'normal' | 'italic';
  bodyFontSize?: number;
  bodyTextColor?: [number, number, number];
  fillColor?: [number, number, number];
  textX?: number;
  lineHeight?: number;
  minChunkHeight?: number;
  firstChunkTopPadding?: number;
  nextChunksTopPadding?: number;
  chunkGap?: number;
  blockGap?: number;
  title?: string;
  titleFontSize?: number;
  titleY?: number;
};

const addPageWithHeader = (pdf: ExtendedJsPDF, drawHeader: DrawHeaderFn): number => {
  pdf.addPage();
  drawHeader();
  return CONTENT_TOP_Y;
};

const ensureVerticalSpace = (
  pdf: ExtendedJsPDF,
  drawHeader: DrawHeaderFn,
  y: number,
  neededHeight: number
): number => {
  if (y + neededHeight > CONTENT_BOTTOM_Y) {
    return addPageWithHeader(pdf, drawHeader);
  }

  return y;
};

const drawPaginatedGrayBox = ({
  pdf,
  drawHeader,
  y,
  lines,
  bodyFontStyle = 'normal',
  bodyFontSize = 9,
  bodyTextColor = [80, 80, 80],
  fillColor = [245, 245, 245],
  textX = 20,
  lineHeight = 5,
  minChunkHeight = 12,
  firstChunkTopPadding = 5,
  nextChunksTopPadding = 5,
  chunkGap = 3,
  blockGap = 2,
  title,
  titleFontSize = 10,
  titleY = 5,
}: PaginatedGrayBoxOptions): number => {
  if (!lines.length) return y;

  let currentY = y;
  let lineIndex = 0;
  let isFirstChunk = true;

  while (lineIndex < lines.length) {
    const topPadding = isFirstChunk ? firstChunkTopPadding : nextChunksTopPadding;
    const availableHeight = CONTENT_BOTTOM_Y - currentY;
    const textBoxWidth = 170;
    const mmPerPoint = 0.352778;
    const lineHeightFactor = lineHeight / (bodyFontSize * mmPerPoint);
    const fontHeightMm = bodyFontSize * mmPerPoint;
    
    // Utiliser toute la place disponible pour le texte
    const maxLinesForPage = Math.max(1, Math.floor((availableHeight - topPadding) / lineHeight));
    
    const chunk = lines.slice(lineIndex, lineIndex + maxLinesForPage);
    // Hauteur réelle du texte (baseline-to-baseline + dernière ligne) pour éviter le fond gris en trop.
    const textHeight = chunk.length > 0
      ? ((chunk.length - 1) * lineHeight) + fontHeightMm
      : 0;
    const chunkHeight = Math.max(textHeight + topPadding + 1, minChunkHeight);

    // Si le contenu ne rentre pas, sauter à la page suivante
    if (currentY + chunkHeight > CONTENT_BOTTOM_Y && currentY > CONTENT_TOP_Y) {
      currentY = addPageWithHeader(pdf, drawHeader);
      continue;
    }

    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.rect(15, currentY, 180, chunkHeight, 'F');

    if (isFirstChunk && title) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(titleFontSize);
      pdf.text(title, textX, currentY + titleY);
    }

    pdf.setFont('helvetica', bodyFontStyle);
    pdf.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
    pdf.setFontSize(bodyFontSize);
    pdf.text(chunk.join('\n'), textX, currentY + topPadding, {
      align: 'justify',
      maxWidth: textBoxWidth,
      lineHeightFactor,
    });

    currentY += chunkHeight;
    lineIndex += chunk.length;
    isFirstChunk = false;

    if (lineIndex < lines.length) {
      currentY += chunkGap;
      currentY = addPageWithHeader(pdf, drawHeader);
    }
  }

  return currentY + blockGap;
};

// Fonction de traitement des données des sections (sondes, features, etc.)
export const processSectionData = (
  data: Record<string, boolean | null>
): PresentedItem[] => {
  if (!data) return [];

  return Object.keys(data).map((key) => ({
    name: key,
    value: data[key] !== null,
    presented: false,
    appreciated: false,
    wanted: false
  }));
};

// Type représentant les paramètres pour préparer les données
type PrepareDataParams = {
  clientName: string;
  clientEmail: string;
  demoDate: string;
  lieuService: string;
  generalRemarks: string;
  selectedDevice: string;
  sondes: PresentedItem[];
  sondesComments: string;
  features: PresentedItem[];
  featuresComments: string;
  hardware: PresentedItem[];
  hardwareComments: string;
  connex: PresentedItem[];
  connexComments: string;
  selectedCommercialEmails: string[];
  commerciaux: Commercial[];
  selectedIAEmails: string[];
  emailBody: string;
   medecins: {
    promoteur: string;
    detracteur: string;
    indecis: string;
  };
};

// Fonction pour préparer les données avant export
export const prepareData = ({
  clientName,
  clientEmail,
  demoDate,
  lieuService,
  generalRemarks,
  selectedDevice,
  sondes,
  sondesComments,
  features,
  featuresComments,
  hardware,
  hardwareComments,
  connex,
  connexComments,
  selectedCommercialEmails,
  commerciaux,
  selectedIAEmails,
  emailBody,
  medecins
}: PrepareDataParams): PreparedData => {
  // Find the selected commercial or set to null if not found
  const selectedCommercialObj = commerciaux.find((c) => c.email === selectedCommercialEmails[0]) || null;

  return {
    clientInfo: {
      name: clientName,
      email: clientEmail,
      demoDate: demoDate,
      lieuService,
      generalRemarks: generalRemarks
    },
    selectedDevice,
    sondes: {
      data: sondes.filter((s) => s.presented || s.appreciated || s.wanted),
      comments: sondesComments
    },
    features: {
      data: features.filter((f) => f.presented || f.appreciated || f.wanted),
      comments: featuresComments
    },
    hardware: {
      data: hardware.filter((h) => h.presented || h.appreciated || h.wanted),
      comments: hardwareComments
    },
    connex: {
      data: connex.filter((c) => c.presented || c.appreciated || c.wanted),
      comments: connexComments
    },
    commercial: selectedCommercialObj,
    selectedIAs: selectedIAEmails,
    selectedCommercialEmails,
    selectedIAEmails,
    emailBody,
    medecins,
  };
};

// Fonction pour exporter les données au format Excel
export const exportToExcel = (
  data: PreparedData,
  options: ExportPdfOptions = {}
): Blob | void => {


  //const commercial = data.commercial;
  
  // Use type assertion to handle the incompatible types
  const pdf = new jsPDF('p', 'mm', 'a4') as unknown as ExtendedJsPDF;

  const reportMode: ReportMode = options.reportMode ?? 'demo';

  // Fonctionnalités pour créer un PDF
  const drawHeader = () => {
    // 1️⃣ Fond violet
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, 210, 35, 'F');

    // 2️⃣ Logo GE Healthcare à gauche
    const logoWidth = 40;   // largeur en mm
    const logoHeight = 10;  // hauteur en mm, ajustez selon votre image
    pdf.addImage(logoPng, 'PNG', 5, 5, logoWidth, logoHeight);

    // 3️⃣ Titre/Service centré dans le bandeau
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    if (reportMode === 'parc') {
      // Mode Parc: afficher Service et Appareil centrés, sans étiquettes
      pdf.setFontSize(23);
      const serviceName = data.clientInfo.lieuService || 'Service non renseigné';
      pdf.text(serviceName, 105, 14, { align: 'center' });

      pdf.setFontSize(20);
      pdf.text(data.selectedDevice, 105, 25, { align: 'center' });
    } else {
      // Mode Démo: afficher le titre original avec Client et Date
      pdf.setFontSize(18);
      const headerTitle = `Démonstration ${data.selectedDevice}`;
      pdf.text(headerTitle, 105, 16, { align: 'center' });
      // 4️⃣ Info client et date (sous le bandeau)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let headerTextY = 24;
      if (data.clientInfo.name?.trim()) {
        pdf.text(`Client: ${data.clientInfo.name}`, 105, headerTextY, { align: 'center' });
        headerTextY += 7;
      }
      if (data.clientInfo.demoDate?.trim()) {
        pdf.text(
          `Date: ${formatDateJJMMAAAA(data.clientInfo.demoDate)}`,
          105,
          headerTextY,
          { align: 'center' }
        );
      }
    }
  };


  const drawFooter = (pageNumber: number, totalPages: number) => {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 287, 210, 10, 'F');
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    const footerTitle = reportMode === 'parc' ? 'Rapport de gestion de parc' : 'Rapport de démonstration';
    pdf.text(`GE Healthcare - ${footerTitle} - Page ${pageNumber}/${totalPages}`, 105, 293, { align: 'center' });
  };

  const drawSectionTitle = (title: string, yPos: number) => {
    yPos = ensureVerticalSpace(pdf, drawHeader, yPos, 10);

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(10, yPos - 6, 190, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 15, yPos);
    return yPos + 10;
  };

  const drawTable = (headers: string[], rows: (string | number | boolean | undefined)[][], startY: number, maxY: number = 270) => {
    const cellPadding = 3;
    const fontSize = 9;
    const lineHeight = 4;
    // Largeur totale 180mm, aligné à 15mm
    const colCount = headers.length;
    const colWidths = Array(colCount).fill(Math.floor(180 / colCount));
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    let y = startY;

    // En-têtes du tableau
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.rect(15, y, tableWidth, 8, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');

    let x = 15;
    headers.forEach((header: string, i: number) => {
      pdf.text(header, x + cellPadding, y + 5);
      x += colWidths[i];
    });

    y += 8;

    // Corps du tableau
    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i < rows.length; i++) {
      // Vérifier si on a besoin d'une nouvelle page
      const wrappedRow = rows[i].map((cell: string | number | boolean | undefined, idx: number) => {
        const text = cell === undefined || cell === null ? '' : normalizeTextForPdf(String(cell));
        const usableWidth = Math.max(colWidths[idx] - (cellPadding * 2), 8);
        return pdf.splitTextToSize(text, usableWidth);
      });
      const rowLineCount = Math.max(...wrappedRow.map((lines: string[]) => Math.max(lines.length, 1)));
      const rowHeight = Math.max((rowLineCount * lineHeight) + 2, 7);

      if (y + rowHeight > maxY) {
        // Ajouter une nouvelle page
        pdf.addPage();
        // Dessiner le header de la nouvelle page
        drawHeader();
        // Réinitialiser la position Y
        y = 40;
        // Redessiner les en-têtes du tableau
        pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        pdf.rect(15, y, tableWidth, 8, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');

        x = 15;
        headers.forEach((header: string, idx: number) => {
          pdf.text(header, x + cellPadding, y + 5);
          x += colWidths[idx];
        });

        y += 8;
        pdf.setFont('helvetica', 'normal');
      }

      // Alterner les couleurs de fond des lignes
      if (i % 2 === 0) {
        pdf.setFillColor(240, 240, 240);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.rect(15, y, tableWidth, rowHeight, 'F');

      // Texte des cellules
      let xPos = 15;
      wrappedRow.forEach((cellLines: string[], idx: number) => {
        const cellValue = rows[i][idx] === undefined || rows[i][idx] === null
          ? ''
          : normalizeTextForPdf(String(rows[i][idx]));
        const isEuroData = cellValue.includes('€');

        pdf.setTextColor(
          isEuroData ? accentColor[0] : 50,
          isEuroData ? accentColor[1] : 50,
          isEuroData ? accentColor[2] : 50
        );
        pdf.setFont('helvetica', isEuroData ? 'bold' : 'normal');
        pdf.text(cellLines, xPos + cellPadding, y + 4);
        xPos += colWidths[idx];
      });

      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'normal');

      y += rowHeight;
    }

    return y + 5;
  };

  const addCommentBox = (comment: string | undefined, y: number) => {
    if (!comment?.trim()) return y;

    const safeComment = normalizeTextForPdf(comment);
    const commentLines = pdf.splitTextToSize(safeComment, 170) as string[];
    const newY = drawPaginatedGrayBox({
      pdf,
      drawHeader,
      y,
      lines: commentLines,
      bodyFontStyle: 'italic',
      firstChunkTopPadding: 5,
      nextChunksTopPadding: 5,
      minChunkHeight: 12,
      chunkGap: 3,
      blockGap: 2,
    });
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, newY, 180, 5, 'F');
    return newY + 5;
  };

  // Première page
  drawHeader();

  // Infos client
  let yPosition = CONTENT_TOP_Y;
  const hasClientInfoRows = Boolean(
    data.clientInfo.name?.trim()
    || data.clientInfo.email?.trim()
    || data.clientInfo.demoDate?.trim()
    || data.clientInfo.lieuService?.trim()
  );
  const hasClientRemarks = Boolean(data.clientInfo.generalRemarks?.trim());
  const includeClientInfo = options.includeClientInfo !== false && (hasClientInfoRows || hasClientRemarks);
  if (includeClientInfo) {
    yPosition = drawSectionTitle(reportMode === 'parc' ? 'Informations Service' : 'Informations Client', yPosition);

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const clientInfoTable: string[][] = [];
    if (reportMode === 'parc') {
      if (data.clientInfo.lieuService?.trim()) {
        clientInfoTable.push(['Service', data.clientInfo.lieuService]);
      }
      if (data.clientInfo.name?.trim()) {
        clientInfoTable.push(['Contact client', data.clientInfo.name]);
      }
    } else {
      if (data.clientInfo.name?.trim()) {
        clientInfoTable.push(['Nom du client', data.clientInfo.name]);
      }
      if (data.clientInfo.email?.trim()) {
        clientInfoTable.push(['Email', data.clientInfo.email]);
      }
      if (data.clientInfo.demoDate?.trim()) {
        clientInfoTable.push(['Date de démonstration', formatDateJJMMAAAA(data.clientInfo.demoDate)]);
      }
      if (data.clientInfo.lieuService?.trim()) {
        clientInfoTable.push(['Lieu/Service', data.clientInfo.lieuService]);
      }
    }

    if (clientInfoTable.length > 0) {
      const infoHeaders = ['Information', 'Détail'];
      const infoColWidths = [90, 90];
      const infoHeaderHeight = 8;
      const infoCellPaddingX = 3;
      const infoCellPaddingY = 3;
      const infoLineHeight = 4;
      const infoMinRowHeight = 8;
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(15, yPosition, 180, infoHeaderHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let xInfo = 15;
      infoHeaders.forEach((header, i) => {
        pdf.text(header, i === 0 ? 18 : 105, yPosition + 5);
        xInfo += infoColWidths[i];
      });
      yPosition += infoHeaderHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      clientInfoTable.forEach((row, idx) => {
        const safeLabel = normalizeTextForPdf(row[0]);
        const safeValue = normalizeTextForPdf(row[1]);
        const labelLines = pdf.splitTextToSize(safeLabel, infoColWidths[0] - (infoCellPaddingX * 2)) as string[];
        const valueLines = pdf.splitTextToSize(safeValue, infoColWidths[1] - (infoCellPaddingX * 2)) as string[];
        const maxLines = Math.max(labelLines.length, valueLines.length);
        const infoRowHeight = Math.max(infoMinRowHeight, (maxLines * infoLineHeight) + (infoCellPaddingY * 2));

        yPosition = ensureVerticalSpace(pdf, drawHeader, yPosition, infoRowHeight);
        pdf.setFillColor(idx % 2 === 0 ? 245 : 245, 245, 245);
        pdf.rect(15, yPosition, 180, infoRowHeight, 'F');
        pdf.text(labelLines, 18, yPosition + infoCellPaddingY + infoLineHeight - 1);
        pdf.text(valueLines, 105, yPosition + infoCellPaddingY + infoLineHeight - 1);
        yPosition += infoRowHeight;
      });

      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPosition, 180, 8, 'F');
      yPosition += 5;
    }
  }

  // Tableau médecins
  const hasMedecinsAvis = [
    data.medecins.promoteur,
    data.medecins.detracteur,
    data.medecins.indecis,
  ].some((value) => value?.trim());

  if (hasMedecinsAvis) {
    // Tableau horizontal "Avis des médecins"
    const avisHeaders = ['Promoteur', 'Rétracteur', 'Indécis'];
    const avisRow = [
      normalizeTextForPdf(data.medecins.promoteur || 'Aucun'),
      normalizeTextForPdf(data.medecins.detracteur || 'Aucun'),
      normalizeTextForPdf(data.medecins.indecis || 'Aucun')
    ];
    // Largeur totale 180mm, 3 colonnes égales
    const avisColWidths = [60, 60, 60]; // total 180mm, aligné avec le tableau client
    // Calculer la hauteur max nécessaire
    const avisLinesArr = avisRow.map((avis, i) => pdf.splitTextToSize(avis, avisColWidths[i] - 6));
    const maxAvisHeight = Math.max(...avisLinesArr.map(lines => lines.length * 5 + 8));
    yPosition = ensureVerticalSpace(pdf, drawHeader, yPosition, 8 + maxAvisHeight);
    // En-tête violet
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(15, yPosition, 180, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    let xAvis = 15;
    avisHeaders.forEach((header, i) => {
      pdf.text(header, xAvis + 3, yPosition + 5);
      xAvis += avisColWidths[i];
    });
    yPosition += 8;
    // Ligne d'avis, hauteur max
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    const avisLineHeight = 5;
    const avisMmPerPoint = 0.352778;
    const avisLineHeightFactor = avisLineHeight / (10 * avisMmPerPoint);
    let xAvisVal = 15;
    avisLinesArr.forEach((avisLines, i) => {
      // Promoteur et Indécis : gris, Rétracteur : blanc
      if (i === 1) {
        pdf.setFillColor(255, 255, 255); // Rétracteur en blanc
      } else {
        pdf.setFillColor(245, 245, 245); // Autres en gris
      }
      pdf.rect(xAvisVal, yPosition, avisColWidths[i], maxAvisHeight, 'F');
      pdf.text(avisLines.join('\n'), xAvisVal + 3, yPosition + 6, {
        align: 'justify',
        maxWidth: avisColWidths[i] - 6,
        lineHeightFactor: avisLineHeightFactor,
      });
      xAvisVal += avisColWidths[i];
    });
    yPosition += maxAvisHeight;
    yPosition += 5;
  }

  if (includeClientInfo && data.clientInfo.generalRemarks?.trim()) {
    yPosition += 3;
    const remarquesText = normalizeTextForPdf(data.clientInfo.generalRemarks);
    const remarquesLines = pdf.splitTextToSize(remarquesText, 170) as string[];
    
    yPosition = drawPaginatedGrayBox({
      pdf,
      drawHeader,
      y: yPosition,
      lines: remarquesLines,
      title: 'Remarques générales',
      bodyFontStyle: 'italic',
      firstChunkTopPadding: 9,
      nextChunksTopPadding: 5,
      minChunkHeight: 0,
      chunkGap: 3,
      blockGap: 0,
      titleY: 4,
    });
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, yPosition, 180, 7, 'F');
    yPosition += 10;
  }

  // Sondes
  // drawSectionTitle dessine le bandeau à yPos - 6, on compense pour conserver 5mm blancs visibles.
  yPosition += 5;
  yPosition = drawSectionTitle('Sonde', yPosition);

  const sondesHeaders = ['Sonde', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
  const sondesRows: string[][] = [];

  if (data.sondes.data && data.sondes.data.length > 0) {
    const sortedSondes = [...data.sondes.data].sort((a, b) => {
      const categoryA = categorizeSondeForPdf(a.name);
      const categoryB = categorizeSondeForPdf(b.name);
      const categoryIndex = SONDE_CATEGORY_ORDER.indexOf(categoryA) - SONDE_CATEGORY_ORDER.indexOf(categoryB);
      if (categoryIndex !== 0) return categoryIndex;
      return a.name.localeCompare(b.name, 'fr');
    });

    sortedSondes.forEach(sonde => {
      sondesRows.push([
        sonde.name,
        sonde.presented ? 'oui' : 'non',
        sonde.appreciated ? 'oui' : 'non',
        sonde.wanted ? 'oui' : 'non'
      ]);
    });
  } else {
    sondesRows.push(['Aucune sonde sélectionnée', '', '', '']);
  }

  yPosition = drawTable(sondesHeaders, sondesRows, yPosition);
  yPosition = addCommentBox(data.sondes.comments, yPosition);
  yPosition += 5;

  // Fonctionnalités
  yPosition += 5;
  yPosition = drawSectionTitle('Option Software', yPosition);

  const featuresHeaders = ['Option Software', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
  const featuresRows = [];

  if (data.features.data && data.features.data.length > 0) {
    data.features.data.forEach(feature => {
      featuresRows.push([
        feature.name,
        feature.presented ? 'oui' : 'non',
        feature.appreciated ? 'oui' : 'non',
        feature.wanted ? 'oui' : 'non'
      ]);
    });
  } else {
    featuresRows.push(['Aucune option software sélectionnée', '', '', '']);
  }

  yPosition = drawTable(featuresHeaders, featuresRows, yPosition);
  yPosition = addCommentBox(data.features.comments, yPosition);
  yPosition += 5;

  // Options matérielles
  yPosition += 5;
  yPosition = drawSectionTitle('Option Hardware', yPosition);

  const hardwareHeaders = ['Option Hardware', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
  const hardwareRows = [];

  if (data.hardware.data && data.hardware.data.length > 0) {
    data.hardware.data.forEach(hw => {
      hardwareRows.push([
        hw.name,
        hw.presented ? 'oui' : 'non',
        hw.appreciated ? 'oui' : 'non',
        hw.wanted ? 'oui' : 'non'
      ]);
    });
  } else {
    hardwareRows.push(['Aucune option hardware sélectionnée', '', '', '']);
  }

  yPosition = drawTable(hardwareHeaders, hardwareRows, yPosition);
  yPosition = addCommentBox(data.hardware.comments, yPosition);
  yPosition += 5;

  // Options de connexion
  yPosition += 5;
  yPosition = drawSectionTitle('Connectivité et imprimante', yPosition);

  const connexHeaders = ['Connectivité et imprimante', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
  const connexRows = [];

  if (data.connex.data && data.connex.data.length > 0) {
    data.connex.data.forEach(conn => {
      connexRows.push([
        conn.name,
        conn.presented ? 'oui' : 'non',
        conn.appreciated ? 'oui' : 'non',
        conn.wanted ? 'oui' : 'non'
      ]);
    });
  } else {
    connexRows.push(['Aucune option de connexion sélectionnée', '', '', '']);
  }

  yPosition = drawTable(connexHeaders, connexRows, yPosition);
  yPosition = addCommentBox(data.connex.comments, yPosition);
  yPosition += 5;

  // Section Médecins
    // ...le tableau médecins est déjà affiché plus haut, on retire la redéclaration...

  // Informations commercial
  // pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2], 0.1);
  // pdf.rect(15, yPosition, 180, 20, 'F');

  // pdf.setFont('helvetica', 'bold');
  // pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  // pdf.setFontSize(11);
  // pdf.text('Commercial en charge', 20, yPosition + 6);

  // pdf.setFont('helvetica', 'normal');
  // pdf.setTextColor(50, 50, 50);
  // pdf.setFontSize(10);
  // pdf.text(`Nom: ${commercial ? commercial.name : 'Non spécifié'}`, 25, yPosition + 13);
  // pdf.text(`Email: ${commercial ? commercial.email : 'Non spécifié'}`, 25, yPosition + 19);

  // Ajouter les footers à la fin pour garantir une pagination correcte
  const totalPages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    drawFooter(page, totalPages);
  }

  // Générer le fichier PDF
  const filePrefix = reportMode === 'parc' ? 'GestionParc' : 'Démo';
  const fileName = `${filePrefix}_${data.selectedDevice}_${data.clientInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;

  const pdfBlob = pdf.output('blob');
  if (!options.skipSave) {
    pdf.save(fileName);
  }

  if (options.returnBlob) {
    return pdfBlob;
  }
};

const mergePdfBlobs = async (blobs: Blob[]): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();

  for (const blob of blobs) {
    const bytes = await blob.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  await redrawMergedFooters(mergedPdf, 'demo');

  const mergedBytes = await mergedPdf.save();
  const mergedArrayBuffer = mergedBytes.buffer.slice(
    mergedBytes.byteOffset,
    mergedBytes.byteOffset + mergedBytes.byteLength
  ) as ArrayBuffer;
  return new Blob([mergedArrayBuffer], { type: 'application/pdf' });
};

const redrawMergedFooters = async (
  pdfDoc: PDFDocument,
  reportMode: ReportMode,
  startPageIndex = 0
): Promise<void> => {
  const pages = pdfDoc.getPages().slice(startPageIndex);

  if (!pages.length) {
    return;
  }

  const footerFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const footerTitle = reportMode === 'parc' ? 'Rapport de gestion de parc' : 'Rapport de démonstration';
  const footerHeight = 28.35;
  const footerTextY = 11.34;

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const pageNumber = index + 1;
    const text = `GE Healthcare - ${footerTitle} - Page ${pageNumber}/${pages.length}`;
    const textWidth = footerFont.widthOfTextAtSize(text, 8);

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: footerHeight,
      color: rgb(240 / 255, 240 / 255, 240 / 255),
    });

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: footerTextY,
      size: 8,
      font: footerFont,
      color: rgb(100 / 255, 100 / 255, 100 / 255),
    });
  });
};

const buildMergedFileName = (
  dataList: PreparedData[],
  reportMode: ReportMode = 'demo',
  parcCoverInfo?: ParcCoverInfo
): string => {
  const first = dataList[0];
  const datePart = new Date().toISOString().split('T')[0];

  if (reportMode === 'parc') {
    const hospitalName = (parcCoverInfo?.hospitalName?.trim() || first.clientInfo.name?.trim() || 'Hopital');
    return `Gestion_de_Parc_${hospitalName}_${datePart}.pdf`;
  }

  const prefix = 'Démo';
  const entity = first.clientInfo.name || 'Client';

  if (dataList.length === 1) {
    return `${prefix}_${first.selectedDevice}_${entity}_${datePart}.pdf`;
  }

  return `${prefix}_multi_${entity}_${datePart}.pdf`;
};

const addInternalLink = (
  pdfDoc: PDFDocument,
  sourcePageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  targetPageIndex: number
): void => {
  const pages = pdfDoc.getPages();
  if (
    sourcePageIndex < 0
    || sourcePageIndex >= pages.length
    || targetPageIndex < 0
    || targetPageIndex >= pages.length
  ) {
    return;
  }

  const sourcePage = pages[sourcePageIndex] as unknown as { node: { lookupMaybe?: (name: unknown, type: unknown) => PDFArray | undefined; lookup?: (name: unknown, type: unknown) => PDFArray | undefined; set?: (name: unknown, value: unknown) => void; }; ref: unknown; };
  const targetPage = pages[targetPageIndex] as unknown as { ref: unknown };

  const linkAnnot = (pdfDoc.context as any).obj({
    Type: PDFName.of('Annot'),
    Subtype: PDFName.of('Link'),
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    Dest: [targetPage.ref, PDFName.of('Fit')],
  });

  const linkRef = pdfDoc.context.register(linkAnnot);
  const sourceNode = sourcePage.node;
  if (!sourceNode || typeof sourceNode.set !== 'function') {
    return;
  }

  let annots: PDFArray | undefined;
  if (typeof sourceNode.lookupMaybe === 'function') {
    annots = sourceNode.lookupMaybe(PDFName.of('Annots'), PDFArray);
  } else if (typeof sourceNode.lookup === 'function') {
    try {
      annots = sourceNode.lookup(PDFName.of('Annots'), PDFArray);
    } catch {
      annots = undefined;
    }
  }

  if (annots && typeof annots.push === 'function') {
    annots.push(linkRef);
  } else {
    sourceNode.set(PDFName.of('Annots'), pdfDoc.context.obj([linkRef]));
  }
};

const splitTextLines = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (lineWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

const buildParcMergedBlob = async (
  blobs: Blob[],
  dataList: PreparedData[],
  parcCoverInfo?: ParcCoverInfo
): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();
  const sectionStartPages: number[] = [];

  for (const blob of blobs) {
    const bytes = await blob.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    sectionStartPages.push(mergedPdf.getPageCount());
    const copied = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copied.forEach((page) => mergedPdf.addPage(page));
  }

  const totalBeforeCover = mergedPdf.getPageCount();
  const coverPage = mergedPdf.insertPage(0, [595.28, 841.89]);
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Load GE Logo
  const logoResponse = await fetch(logoPng);
  const logoBlob = await logoResponse.blob();
  const logoArrayBuffer = await logoBlob.arrayBuffer();
  const logoImage = await mergedPdf.embedPng(logoArrayBuffer);
  const logoDims = logoImage.scale(0.14); // Scale to 14% of original

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const centerX = pageWidth / 2;
  const violetMain = rgb(96 / 255, 34 / 255, 166 / 255);
  const ink = rgb(32 / 255, 33 / 255, 40 / 255);
  const centeredX = (textWidth: number): number => Math.round(centerX - (textWidth / 2));

  // Fond et structure institutionnelle
  coverPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(252 / 255, 251 / 255, 254 / 255) });
  coverPage.drawRectangle({ x: 0, y: 704, width: pageWidth, height: 138, color: violetMain });
  coverPage.drawRectangle({ x: 0, y: 694, width: pageWidth, height: 6, color: violetMain });
  coverPage.drawRectangle({ x: 40, y: 530, width: pageWidth - 80, height: 2, color: violetMain });

  const heroTitle = normalizeTextForPdfLib('GESTION DE PARC');
  const heroTitleSize = 32;
  const heroTitleWidth = fontBold.widthOfTextAtSize(heroTitle, heroTitleSize);
  coverPage.drawText(heroTitle, {
    x: centeredX(heroTitleWidth),
    y: 786,
    size: heroTitleSize,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Place GE Logo under the title
  coverPage.drawImage(logoImage, {
    x: centerX - (logoDims.width / 2),
    y: 721,
    width: logoDims.width,
    height: logoDims.height,
  });

  const hospitalName = normalizeTextForPdfLib((parcCoverInfo?.hospitalName || dataList[0]?.clientInfo.name || 'Hôpital').trim());
  const address = normalizeTextForPdfLib((parcCoverInfo?.address || '').trim());
  const demoDate = normalizeTextForPdfLib(formatDateJJMMAAAA(parcCoverInfo?.demoDate || dataList[0]?.clientInfo.demoDate || ''));

  // Bloc établissement principal
  coverPage.drawRectangle({
    x: 56,
    y: 552,
    width: pageWidth - 112,
    height: 126,
    color: rgb(1, 1, 1),
    borderColor: rgb(223 / 255, 210 / 255, 241 / 255),
    borderWidth: 1.2,
  });
  coverPage.drawRectangle({ x: 56, y: 664, width: pageWidth - 112, height: 14, color: rgb(246 / 255, 242 / 255, 251 / 255) });

  let hospitalFontSize = 42;
  const hospitalMaxWidth = pageWidth - 150;
  while (hospitalFontSize > 28 && fontBold.widthOfTextAtSize(hospitalName, hospitalFontSize) > hospitalMaxWidth) {
    hospitalFontSize -= 2;
  }
  const hospitalLines = splitTextLines(hospitalName, fontBold, hospitalFontSize, hospitalMaxWidth);
  const coverInfoLift = 72 / 25.4;
  const hospitalY = 616 + coverInfoLift;
  const hospitalLineGap = hospitalFontSize * 1.35;
  const hospitalBlockBottomY = hospitalY - ((hospitalLines.length - 1) * hospitalLineGap);
  let currentHospitalY = hospitalY;
  hospitalLines.forEach((line: string) => {
    const lineWidth = fontBold.widthOfTextAtSize(line, hospitalFontSize);
    coverPage.drawText(line, {
      x: centeredX(lineWidth),
      y: currentHospitalY,
      size: hospitalFontSize,
      font: fontBold,
      color: violetMain,
    });
    currentHospitalY -= hospitalLineGap;
  });

  const addressText = address ? normalizeTextForPdfLib(`Adresse: ${address}`) : normalizeTextForPdfLib('Adresse: Non renseignée');
  const dateText = demoDate ? normalizeTextForPdfLib(`Date: ${demoDate}`) : normalizeTextForPdfLib('Date: Non renseignée');
  const addressSize = 11;
  const dateSize = 11;
  const addressMaxWidth = pageWidth - 120;
  const mmToPt = (mm: number): number => (mm * 72) / 25.4;
  const hospitalToAddressGap = mmToPt(5);
  const addressLift = mmToPt(6);
  const addressToDateGap = mmToPt(3);
  const addressLines = splitTextLines(addressText, fontBold, addressSize, addressMaxWidth);
  const addressLineGap = addressSize * 1.35;
  const addressY = hospitalBlockBottomY - hospitalFontSize - hospitalToAddressGap + addressLift;
  const addressBlockBottomY = addressY - ((addressLines.length - 1) * addressLineGap);
  let currentAddressY = addressY;
  addressLines.forEach((line: string) => {
    const lineWidth = fontBold.widthOfTextAtSize(line, addressSize);
    coverPage.drawText(line, {
      x: centeredX(lineWidth),
      y: currentAddressY,
      size: addressSize,
      font: fontBold,
      color: ink,
    });
    currentAddressY -= addressLineGap;
  });
  
  coverPage.drawText(dateText, {
    x: centeredX(fontBold.widthOfTextAtSize(dateText, dateSize)),
    y: addressBlockBottomY - dateSize - addressToDateGap,
    size: dateSize,
    font: fontBold,
    color: ink,
  });

  // Titre Sommaire
  const sommaireTitleY = 500;
  coverPage.drawRectangle({ x: 58, y: sommaireTitleY - 2, width: pageWidth - 116, height: 2, color: rgb(221 / 255, 210 / 255, 238 / 255) });
  coverPage.drawText(normalizeTextForPdfLib('Sommaire'), {
    x: 60,
    y: sommaireTitleY,
    size: 18,
    font: fontBold,
    color: violetMain,
  });

  let y = sommaireTitleY - 28;
  dataList.forEach((item, idx) => {
    const targetPageIndex = sectionStartPages[idx] + 1;
    const service = normalizeTextForPdfLib(item.clientInfo.lieuService || 'Service non renseigné');
    const device = normalizeTextForPdfLib(item.selectedDevice);
    const rowHeight = 24;

    coverPage.drawRectangle({
      x: 60,
      y: y - 6,
      width: pageWidth - 120,
      height: rowHeight,
      color: idx % 2 === 0 ? rgb(1, 1, 1) : rgb(248 / 255, 245 / 255, 252 / 255),
      borderColor: rgb(224 / 255, 212 / 255, 240 / 255),
      borderWidth: 0.9,
    });

    const indexLabel = `#${idx + 1}`;
    const indexLabelWidth = fontBold.widthOfTextAtSize(indexLabel, 9);
    coverPage.drawRectangle({ x: 68, y: y - 1, width: 22, height: 12, color: violetMain, borderWidth: 0 });
    coverPage.drawText(indexLabel, {
      x: 79 - (indexLabelWidth / 2),
      y: y + 2,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const entry = normalizeTextForPdfLib(`${service}`);
    const entryDevice = normalizeTextForPdfLib(`${device}`);
    coverPage.drawText(entry, {
      x: 98,
      y: y + 2,
      size: 10,
      font: fontBold,
      color: ink,
    });
    coverPage.drawText(entryDevice, {
      x: 300,
      y: y + 2,
      size: 10,
      font: fontRegular,
      color: ink,
    });
    addInternalLink(mergedPdf, 0, 60, y - 6, pageWidth - 120, rowHeight, targetPageIndex);
    y -= 28;
  });

  dataList.forEach((_, idx) => {
    const sectionStart = sectionStartPages[idx] + 1;
    const sectionEnd = ((idx + 1 < sectionStartPages.length) ? sectionStartPages[idx + 1] : totalBeforeCover);

    for (let pageIndex = sectionStart; pageIndex <= sectionEnd; pageIndex++) {
      const page = mergedPdf.getPage(pageIndex);
      const { width } = page.getSize();
      const rightText = normalizeTextForPdfLib(`Échographe ${idx + 1}/${dataList.length}`);

      const rightTextWidth = fontBold.widthOfTextAtSize(rightText, 9);
      const rightX = width - rightTextWidth - 20;
      page.drawText(rightText, {
        x: rightX,
        y: 810.67,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      addInternalLink(mergedPdf, pageIndex, rightX - 2, 810.67, rightTextWidth + 4, 14, 0);
    }
  });

  await redrawMergedFooters(mergedPdf, 'parc', 1);

  const bytes = await mergedPdf.save();
  const mergedArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([mergedArrayBuffer], { type: 'application/pdf' });
};

export const exportMultipleToExcel = async (dataList: PreparedData[]): Promise<void> => {
  if (!dataList.length) return;

  const blobs = dataList
    .map((data) => exportToExcel(data, {
      skipSave: true,
      returnBlob: true,
      includeClientInfo: true,
      clientInfoBannerOnly: false,
    }))
    .filter(Boolean) as Blob[];

  if (!blobs.length) return;

  const mergedBlob = await mergePdfBlobs(blobs);
  saveAs(mergedBlob, buildMergedFileName(dataList));
};

export const exportMultipleToPDF = async (
  dataList: PreparedData[],
  formRef: React.RefObject<HTMLFormElement>,
  options?: {
    reportMode?: ReportMode;
    parcCoverInfo?: ParcCoverInfo;
    shouldSendEmail?: boolean;
  }
): Promise<void> => {
  if (!formRef.current || !dataList.length) return;

  const loadingDiv = document.createElement('div');
  loadingDiv.style.position = 'fixed';
  loadingDiv.style.top = '0';
  loadingDiv.style.left = '0';
  loadingDiv.style.width = '100%';
  loadingDiv.style.height = '100%';
  loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
  loadingDiv.style.display = 'flex';
  loadingDiv.style.justifyContent = 'center';
  loadingDiv.style.alignItems = 'center';
  loadingDiv.style.zIndex = '9999';
  loadingDiv.innerHTML = '<div style="background: white; padding: 20px; border-radius: 5px;">Génération du PDF en cours...</div>';
  document.body.appendChild(loadingDiv);

  try {
    const reportMode = options?.reportMode ?? 'demo';
    const shouldSendEmail = options?.shouldSendEmail ?? true;
    const blobs = dataList
      .map((data) => exportToExcel(data, {
        skipSave: true,
        returnBlob: true,
        includeClientInfo: true,
        clientInfoBannerOnly: false,
        reportMode,
      }))
      .filter(Boolean) as Blob[];

    if (!blobs.length) return;

    const mergedBlob = reportMode === 'parc'
      ? await buildParcMergedBlob(blobs, dataList, options?.parcCoverInfo)
      : await mergePdfBlobs(blobs);

    const fileName = buildMergedFileName(dataList, reportMode, options?.parcCoverInfo);
    saveAs(mergedBlob, fileName);

    if (shouldSendEmail) {
      const firstData = dataList[0];
      const subject = reportMode === 'parc' ? 'Rapport de gestion de parc' : 'Rapport de démonstration';
      await sendEmail(
        firstData.selectedCommercialEmails,
        subject,
        firstData.emailBody,
        mergedBlob,
        firstData.selectedIAEmails
      );
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF multi:', error);
    const message = error instanceof Error ? error.message : String(error);
    alert(`Une erreur s'est produite lors de la génération du PDF multi: ${message}`);
  } finally {
    document.body.removeChild(loadingDiv);
  }
};

export const sendEmail = async (
  toEmails: string[],
  subject: string,
  message: string,
  pdfBlob: Blob,
  ccEmails: string[] = []
) => {
  if (!toEmails.length) {
    console.error('Aucun destinataire fourni');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('to', toEmails.join(','));
    formData.append('subject', subject);
    formData.append('text', message);
    formData.append('file', pdfBlob, 'document.pdf');

    if (ccEmails.length > 0) {
      formData.append('cc', ccEmails.join(','));
    }

    const response = await fetch('https://gein.app.n8n.cloud/webhook/send-email', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur serveur : ${errorText}`);
    }

    console.log('✅ Email envoyé avec succès aux destinataires:', toEmails.join(', '));

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail :', error);
    throw error;
  }
};

