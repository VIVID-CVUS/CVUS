import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
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

const CONTENT_TOP_Y = 45;
const CONTENT_BOTTOM_Y = 270;

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
    const maxLinesForPage = Math.max(
      Math.floor((availableHeight - topPadding - 5) / lineHeight),
      1
    );
    const chunk = lines.slice(lineIndex, lineIndex + maxLinesForPage);
    const chunkHeight = Math.max((chunk.length * lineHeight) + topPadding, minChunkHeight);

    if (currentY + chunkHeight > CONTENT_BOTTOM_Y) {
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
    pdf.text(chunk, textX, currentY + topPadding);

    currentY += chunkHeight + chunkGap;
    lineIndex += chunk.length;
    isFirstChunk = false;

    if (lineIndex < lines.length) {
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
  options: { skipSave?: boolean; returnBlob?: boolean; includeClientInfo?: boolean; clientInfoBannerOnly?: boolean } = {}
): Blob | void => {


  //const commercial = data.commercial;
  
  // Use type assertion to handle the incompatible types
  const pdf = new jsPDF('p', 'mm', 'a4') as unknown as ExtendedJsPDF;

  // Fonctionnalités pour créer un PDF
  const drawHeader = () => {
    // 1️⃣ Fond violet
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, 210, 35, 'F');

    // 2️⃣ Logo GE Healthcare à gauche
    const logoWidth = 40;   // largeur en mm
    const logoHeight = 10;  // hauteur en mm, ajustez selon votre image
    pdf.addImage(logoPng, 'PNG', 5, 5, logoWidth, logoHeight);

    // 3️⃣ Titre de la démo, centré verticalement dans le bandeau
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Démonstration ${data.selectedDevice}`, 105, 16, { align: 'center' });

    // 4️⃣ Info client et date (sous le bandeau)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Client: ${data.clientInfo.name}`, 105, 24, { align: 'center' });
    pdf.text(
      `Date: ${formatDateJJMMAAAA(data.clientInfo.demoDate)}`,
      105,
      31,
      { align: 'center' }
    );
  };


  const drawFooter = (pageNumber: number, totalPages: number) => {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 287, 210, 10, 'F');
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text(`GE Healthcare - Rapport de démonstration - Page ${pageNumber}/${totalPages}`, 105, 293, { align: 'center' });
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
        const text = cell === undefined || cell === null ? '' : String(cell);
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
      pdf.setTextColor(50, 50, 50);
      let xPos = 15;
      wrappedRow.forEach((cellLines: string[], idx: number) => {
        pdf.text(cellLines, xPos + cellPadding, y + 4);
        xPos += colWidths[idx];
      });

      y += rowHeight;
    }

    return y + 5;
  };

  const addCommentBox = (comment: string | undefined, y: number) => {
    if (!comment?.trim()) return y;

    const commentLines = pdf.splitTextToSize(comment, 170) as string[];
    return drawPaginatedGrayBox({
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
  };

  // Première page
  drawHeader();

  // Infos client
  let yPosition = 45;
  const includeClientInfo = options.includeClientInfo !== false;
  const clientInfoBannerOnly = options.clientInfoBannerOnly === true;
  if (includeClientInfo) {
    yPosition = drawSectionTitle('Informations Client', yPosition);

    if (clientInfoBannerOnly) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPosition, 180, 8, 'F');
      yPosition += 8;
    } else {

      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const clientInfoTable = [
        ['Nom du client', data.clientInfo.name || 'Non spécifié'],
        ['Email', data.clientInfo.email || 'Non spécifié'],
        ['Date de démonstration', data.clientInfo.demoDate ? formatDateJJMMAAAA(data.clientInfo.demoDate) : 'Non spécifiée'],
        ['Lieu/Service', data.clientInfo.lieuService || 'Non spécifié']
      ];
      const infoHeaders = ['Information', 'Détail'];
      const infoColWidths = [90, 90];
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(15, yPosition, 180, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let xInfo = 15;
      infoHeaders.forEach((header, i) => {
        pdf.text(header, xInfo + 3, yPosition + 5);
        xInfo += infoColWidths[i];
      });
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      clientInfoTable.forEach((row, idx) => {
        pdf.setFillColor(idx % 2 === 0 ? 245 : 245, 245, 245);
        pdf.rect(15, yPosition, 180, 8, 'F');
        pdf.text(row[0], 18, yPosition + 5);
        pdf.text(row[1], 105, yPosition + 5);
        yPosition += 8;
      });

      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPosition, 180, 8, 'F');
      yPosition += 8;
    }
  }

  // Tableau médecins
  // Tableau horizontal "Avis des médecins"
  const avisHeaders = ['Promoteur', 'Rétracteur', 'Indécis'];
  const avisRow = [
    data.medecins.promoteur || 'Aucun',
    data.medecins.detracteur || 'Aucun',
    data.medecins.indecis || 'Aucun'
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
  pdf.setTextColor(50, 50, 50);
  let xAvisVal = 15;
  avisLinesArr.forEach((avisLines, i) => {
    // Promoteur et Indécis : gris, Rétracteur : blanc
    if (i === 1) {
      pdf.setFillColor(255, 255, 255); // Rétracteur en blanc
    } else {
      pdf.setFillColor(245, 245, 245); // Autres en gris
    }
    pdf.rect(xAvisVal, yPosition, avisColWidths[i], maxAvisHeight, 'F');
    pdf.text(avisLines, xAvisVal + 3, yPosition + 6);
    xAvisVal += avisColWidths[i];
  });
  yPosition += maxAvisHeight;

  if (includeClientInfo && !clientInfoBannerOnly) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, yPosition, 180, 8, 'F');
    yPosition += 8;

    yPosition += 5;
    const remarquesText = data.clientInfo.generalRemarks || 'Aucune';
    const remarquesLines = pdf.splitTextToSize(remarquesText, 170) as string[];
    yPosition = drawPaginatedGrayBox({
      pdf,
      drawHeader,
      y: yPosition,
      lines: remarquesLines,
      title: 'Remarques générales',
      firstChunkTopPadding: 12,
      nextChunksTopPadding: 5,
      minChunkHeight: 12,
      chunkGap: 3,
      blockGap: 2,
    });
  }

  // Ajout d'un espace blanc avant le bandeau Sondes
  pdf.setFillColor(255, 255, 255);
  pdf.rect(15, yPosition, 180, 8, 'F');
  yPosition += 8;

  // Sondes
  yPosition = drawSectionTitle('Sondes', yPosition);

  const sondesHeaders = ['Sonde', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
  const sondesRows = [];

  if (data.sondes.data && data.sondes.data.length > 0) {
    data.sondes.data.forEach(sonde => {
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
  yPosition += 10;

  // Vérifier si on a besoin d'une nouvelle page pour les fonctionnalités
  if (yPosition > 200) {
    pdf.addPage();
    drawHeader();
    yPosition = 45;
  }

  // Fonctionnalités
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

  // Ajouter la deuxième page pour les options matérielles et connexion
  pdf.addPage();
  drawHeader();
  yPosition = 45;

  // Options matérielles
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
  yPosition += 10;

  // Options de connexion
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
  yPosition += 15;

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
  const fileName = `Démo_${data.selectedDevice}_${data.clientInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;

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

  const mergedBytes = await mergedPdf.save();
  const mergedArrayBuffer = mergedBytes.buffer.slice(
    mergedBytes.byteOffset,
    mergedBytes.byteOffset + mergedBytes.byteLength
  ) as ArrayBuffer;
  return new Blob([mergedArrayBuffer], { type: 'application/pdf' });
};

const buildMergedFileName = (dataList: PreparedData[]): string => {
  const first = dataList[0];
  const datePart = new Date().toISOString().split('T')[0];
  if (dataList.length === 1) {
    return `Démo_${first.selectedDevice}_${first.clientInfo.name}_${datePart}.pdf`;
  }

  return `Démo_multi_${first.clientInfo.name}_${datePart}.pdf`;
};

export const exportMultipleToExcel = async (dataList: PreparedData[]): Promise<void> => {
  if (!dataList.length) return;

  const blobs = dataList
    .map((data, index) => exportToExcel(data, {
      skipSave: true,
      returnBlob: true,
      includeClientInfo: true,
      clientInfoBannerOnly: index > 0,
    }))
    .filter(Boolean) as Blob[];

  if (!blobs.length) return;

  const mergedBlob = await mergePdfBlobs(blobs);
  saveAs(mergedBlob, buildMergedFileName(dataList));
};

export const exportMultipleToPDF = async (
  dataList: PreparedData[],
  formRef: React.RefObject<HTMLFormElement>
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
    const blobs = dataList
      .map((data, index) => exportToExcel(data, {
        skipSave: true,
        returnBlob: true,
        includeClientInfo: true,
        clientInfoBannerOnly: index > 0,
      }))
      .filter(Boolean) as Blob[];

    if (!blobs.length) return;

    const mergedBlob = await mergePdfBlobs(blobs);
    const fileName = buildMergedFileName(dataList);
    saveAs(mergedBlob, fileName);

    const firstData = dataList[0];
    await sendEmail(
      firstData.selectedCommercialEmails,
      'Rapport de démonstration',
      firstData.emailBody,
      mergedBlob,
      firstData.selectedIAEmails
    );
  } catch (error) {
    console.error('Erreur lors de la génération du PDF multi:', error);
    alert('Une erreur s\'est produite lors de la génération du PDF multi.');
  } finally {
    document.body.removeChild(loadingDiv);
  }
};

export const exportToPDF = async (data: PreparedData, formRef: React.RefObject<HTMLFormElement>) => {
  if (!formRef.current) return;

  try {
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

    // Use type assertion to handle the incompatible types
    const pdf = new jsPDF('p', 'mm', 'a4') as unknown as ExtendedJsPDF;

    // Fonctionnalités pour créer un PDF
    const drawHeader = () => {
      // 1️⃣ Fond violet
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, 210, 35, 'F');

      // 2️⃣ Logo GE Healthcare
      //    si logoPng est une URL, convertissez-le en base64 avant (ex: fetch -> blob -> FileReader)
      //    ici on suppose logoPng est déjà une data:URL "data:image/png;base64,...."
      const logoWidth = 40;   // largeur en mm
      const logoHeight = 10;  // hauteur en mm, ajustez selon votre image
      pdf.addImage(logoPng, 'PNG', 10, 10, logoWidth, logoHeight);

      // 3️⃣ Titre de la démo, centré
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Démonstration ${data.selectedDevice}`, 105, 15, { align: 'center' });

      // 4️⃣ Info client et date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Client: ${data.clientInfo.name}`, 105, 22, { align: 'center' });
      pdf.text(
        `Date: ${formatDateJJMMAAAA(data.clientInfo.demoDate)}`,
        105,
        29,
        { align: 'center' }
      );
    };


    const drawFooter = (pageNumber: number, totalPages: number) => {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 287, 210, 10, 'F');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.text(`GE Healthcare - Rapport de démonstration - Page ${pageNumber}/${totalPages}`, 105, 293, { align: 'center' });
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
      const colWidths = [80, 30, 30, 30]; // Ajustez selon vos besoins
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
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
          const text = cell === undefined || cell === null ? '' : String(cell);
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
        pdf.setTextColor(50, 50, 50);
        let xPos = 15;
        wrappedRow.forEach((cellLines: string[], idx: number) => {
          pdf.text(cellLines, xPos + cellPadding, y + 4);
          xPos += colWidths[idx];
        });

        y += rowHeight;
      }

      return y + 5;
    };

    const addCommentBox = (comment: string | undefined, y: number) => {
      if (!comment?.trim()) return y;

      const commentLines = pdf.splitTextToSize(comment, 170) as string[];
      return drawPaginatedGrayBox({
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
    };

    // Première page
    drawHeader();

    // Infos client
    let yPosition = 45;
    yPosition = drawSectionTitle('Informations Client', yPosition);

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const clientInfoTable = [
      ['Nom du client', data.clientInfo.name || 'Non spécifié'],
      ['Email', data.clientInfo.email || 'Non spécifié'],
      ['Date de démonstration', data.clientInfo.demoDate ? formatDateJJMMAAAA(data.clientInfo.demoDate) : 'Non spécifiée'],
      ['Lieu/Service', data.clientInfo.lieuService || 'Non spécifié']
    ];

    yPosition = drawTable(['Information', 'Détail'], clientInfoTable, yPosition);
    
    // Remarques générales avec hauteur dynamique
    yPosition += 5;
    const remarquesText = data.clientInfo.generalRemarks || 'Aucune';
    const remarquesLines = pdf.splitTextToSize(remarquesText, 170) as string[];
    yPosition = drawPaginatedGrayBox({
      pdf,
      drawHeader,
      y: yPosition,
      lines: remarquesLines,
      title: 'Remarques générales',
      firstChunkTopPadding: 12,
      nextChunksTopPadding: 5,
      minChunkHeight: 12,
      chunkGap: 3,
      blockGap: 7,
    });

    // Sondes
    yPosition = drawSectionTitle('Sondes', yPosition);

    const sondesHeaders = ['Sonde', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
    const sondesRows = [];

    if (data.sondes.data && data.sondes.data.length > 0) {
      data.sondes.data.forEach(sonde => {
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
    yPosition += 10;

    // Vérifier si on a besoin d'une nouvelle page pour les fonctionnalités
    if (yPosition > 200) {
      pdf.addPage();
      drawHeader();
      yPosition = 45;
    }

    // Fonctionnalités
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

    // Ajouter la deuxième page pour les options matérielles et connexion
    pdf.addPage();
    drawHeader();
    yPosition = 45;

    // Options matérielles
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
    yPosition += 10;

    // Options de connexion
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
    yPosition += 15;

    // Vérifier si on a besoin d'une nouvelle page pour les médecins
    if (yPosition > 200) {
      pdf.addPage();
      drawHeader();
      yPosition = 45;
    }

    // Section Médecins
    yPosition = drawSectionTitle('Médecins et Responsables', yPosition);

    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');


      // Remarques générales en zone grise
      yPosition += 5;
      // Sous-titre violet "Remarques générales"
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(15, yPosition, 180, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Remarques générales', 20, yPosition + 7);
      yPosition += 12;
      // Zone grise (paginée si le texte est long)
      yPosition = drawPaginatedGrayBox({
        pdf,
        drawHeader,
        y: yPosition,
        lines: remarquesLines,
        firstChunkTopPadding: 8,
        nextChunksTopPadding: 8,
        minChunkHeight: 12,
        chunkGap: 3,
        blockGap: 0,
      });

      // Séparation blanche juste après la zone remarques générales
      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPosition, 180, 8, 'F');
      yPosition += 8;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPosition, 180, 8, 'F');
      yPosition += 8;

      // Titre violet "Avis des médecins"
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(15, yPosition, 180, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Avis des médecins', 20, yPosition + 7);
      yPosition += 12;

      // Tableau horizontal "Avis des médecins"
      const avisHeaders = ['Promoteur', 'Rétracteur', 'Indécis'];
      const avisRow = [
        data.medecins.promoteur || 'Aucun',
        data.medecins.detracteur || 'Aucun',
        data.medecins.indecis || 'Aucun'
      ];
      // Largeur totale 180mm, 3 colonnes égales
      const avisColWidths = [60, 60, 60];
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
      pdf.setTextColor(50, 50, 50);
      let xAvisVal = 15;
      avisLinesArr.forEach((avisLines, i) => {
        pdf.setFillColor(i % 2 === 0 ? 245 : 235, 245, 245);
        pdf.rect(xAvisVal, yPosition, avisColWidths[i], maxAvisHeight, 'F');
        pdf.text(avisLines, xAvisVal + 3, yPosition + 6);
        xAvisVal += avisColWidths[i];
      });
      yPosition += maxAvisHeight;
    
    // yPosition += detracteurHeight + 5; // Removed undefined variable, already handled by maxAvisHeight above

    // Indécis
    const indecisText = data.medecins.indecis || 'Aucun';
    const indecisLines = pdf.splitTextToSize(indecisText, 170) as string[];
    yPosition = drawPaginatedGrayBox({
      pdf,
      drawHeader,
      y: yPosition,
      lines: indecisLines,
      title: 'Indécis',
      firstChunkTopPadding: 12,
      nextChunksTopPadding: 5,
      minChunkHeight: 12,
      chunkGap: 3,
      blockGap: 12,
    });

    // Ajouter les footers à la fin pour garantir une pagination correcte
    const totalPages = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      pdf.setPage(page);
      drawFooter(page, totalPages);
    }

    // Générer le fichier PDF
    const fileName = `Démo_${data.selectedDevice}_${data.clientInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;

    const pdfBlob = pdf.output("blob");
    pdf.save(fileName);

    // Envoyer un seul email avec tous les destinataires
    await sendEmail(
      data.selectedCommercialEmails,
      "Rapport de démonstration",
      data.emailBody,
      pdfBlob,
      data.selectedIAEmails // IAs en CC
    );

    document.body.removeChild(loadingDiv);

  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    alert("Une erreur s'est produite lors de la génération du PDF.");
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

