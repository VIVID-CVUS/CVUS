import { jsPDF } from 'jspdf';
import logoPng from '../assets/GE_HealthCare_logo_2023.png'
// import autoTable from 'jspdf-autotable';
// import emailjs from 'emailjs-com';

// Define your color constants
const primaryColor = [87, 41, 139]; // GE Healthcare Violet
const accentColor = [87, 41, 139]; // Or another appropriate color

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
export const exportToExcel = (data: PreparedData) => {


  //const commercial = data.commercial;
  
  // Use type assertion to handle the incompatible types
  const pdf = new jsPDF('p', 'mm', 'a4') as unknown as ExtendedJsPDF;

  // Fonctionnalités pour créer un PDF
  const drawHeader = () => {
    // 1️⃣ Fond violet
    pdf.setFillColor(87, 41, 139);
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
      `Date: ${data.clientInfo.demoDate || new Date().toLocaleDateString()}`,
      105,
      31,
      { align: 'center' }
    );
  };


  const drawFooter = (pageNumber: number) => {
    const totalPages = pdf.internal.getNumberOfPages();
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 287, 210, 10, 'F');
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    pdf.text(`GE Healthcare - Rapport de démonstration - Page ${pageNumber}/${totalPages}`, 105, 293, { align: 'center' });
  };

  const drawSectionTitle = (title: string, yPos: number) => {
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
    // Largeur totale 180mm, aligné à 15mm
    const colCount = headers.length;
    const colWidths = Array(colCount).fill(Math.floor(180 / colCount));
    let y = startY;

    // En-têtes du tableau
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.rect(15, y, 180, 8, 'F');

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
      if (y + 7 > maxY) {
        // Ajouter les footers à la page actuelle
        drawFooter(pdf.internal.getNumberOfPages());
        // Ajouter une nouvelle page
        pdf.addPage();
        // Dessiner le header de la nouvelle page
        drawHeader();
        // Réinitialiser la position Y
        y = 40;
        // Redessiner les en-têtes du tableau
        pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        pdf.rect(15, y, 180, 8, 'F');

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
      pdf.rect(15, y, 180, 7, 'F');

      // Texte des cellules
      pdf.setTextColor(50, 50, 50);
      let xPos = 15;
      rows[i].forEach((cell: string | number | boolean | undefined, idx: number) => {
        if (cell !== undefined) {
          pdf.text(cell.toString(), xPos + cellPadding, y + 5);
        }
        xPos += colWidths[idx];
      });

      y += 7;
    }

    return y + 5;
  };

  const addCommentBox = (comment: string | undefined, y: number) => {
    if (!comment) return y;

    pdf.setFillColor(245, 245, 245);
    const boxHeight = Math.ceil(comment.length / 75) * 5 + 10; // Estimation de la hauteur nécessaire
    pdf.rect(15, y, 180, boxHeight, 'F');

    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);

    const commentLines = pdf.splitTextToSize(comment, 170);
    pdf.text(commentLines, 20, y + 5);

    return y + boxHeight + 5;
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
    ['Date de démonstration', data.clientInfo.demoDate || 'Non spécifiée']
  ];
  // Largeur du tableau informations client = 180mm, aligné à 15mm
  const infoHeaders = ['Information', 'Détail'];
  const infoColWidths = [90, 90];
  // En-tête violet
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
  // Lignes infos
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  clientInfoTable.forEach((row, idx) => {
    pdf.setFillColor(idx % 2 === 0 ? 245 : 245, 245, 245);
    pdf.rect(15, yPosition, 180, 8, 'F');
    pdf.text(row[0], 18, yPosition + 5);
    pdf.text(row[1], 105, yPosition + 5);
    yPosition += 8;
  });

  // Séparation blanche juste après le tableau infos client
  pdf.setFillColor(255, 255, 255);
  pdf.rect(15, yPosition, 180, 8, 'F');
  yPosition += 8;

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

  // Séparation blanche
  pdf.setFillColor(255, 255, 255);
  pdf.rect(15, yPosition, 180, 8, 'F');
  yPosition += 8;
  // Remarques générales en zone grise
  yPosition += 5;
  pdf.setFillColor(245, 245, 245);
  const remarquesText = data.clientInfo.generalRemarks || 'Aucune';
  const remarquesLines = pdf.splitTextToSize(remarquesText, 170);
  const remarquesHeight = remarquesLines.length * 5 + 10;
  pdf.rect(15, yPosition, 180, remarquesHeight, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(10);
  pdf.text('Remarques générales', 20, yPosition + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(9);
  pdf.text(remarquesLines, 20, yPosition + 12);
  yPosition += remarquesHeight + 5;

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
    drawFooter(1);
    pdf.addPage();
    drawHeader();
    yPosition = 45;
  }

  // Fonctionnalités
  yPosition = drawSectionTitle('Options Sofwares', yPosition);

  const featuresHeaders = ['Options Sofwares', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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
    featuresRows.push(['Aucune Option Sofware sélectionnée', '', '', '']);
  }

  yPosition = drawTable(featuresHeaders, featuresRows, yPosition);
  yPosition = addCommentBox(data.features.comments, yPosition);

  // Ajouter la deuxième page pour les options matérielles et connexion
  drawFooter(1);
  pdf.addPage();
  drawHeader();
  yPosition = 45;

  // Options matérielles
  yPosition = drawSectionTitle('Options Hardwares', yPosition);

  const hardwareHeaders = ['Options Hardwares', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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
    hardwareRows.push(['Aucune Options Hardwares sélectionnée', '', '', '']);
  }

  yPosition = drawTable(hardwareHeaders, hardwareRows, yPosition);
  yPosition = addCommentBox(data.hardware.comments, yPosition);
  yPosition += 10;

  // Options de connexion
  yPosition = drawSectionTitle('Connectivités et imprimantes', yPosition);

  const connexHeaders = ['Connectivités et imprimantes', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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

  // Ajouter le footer à la dernière page
  drawFooter(pdf.internal.getNumberOfPages());

  // Générer le fichier PDF
  const fileName = `Démo_${data.selectedDevice}_${data.clientInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;


  pdf.save(fileName);
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
      pdf.setFillColor(87, 41, 139);
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
        `Date: ${data.clientInfo.demoDate || new Date().toLocaleDateString()}`,
        105,
        29,
        { align: 'center' }
      );
    };


    const drawFooter = (pageNumber: number) => {
      const totalPages = pdf.internal.getNumberOfPages();
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 287, 210, 10, 'F');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.text(`GE Healthcare - Rapport de démonstration - Page ${pageNumber}/${totalPages}`, 105, 293, { align: 'center' });
    };

    const drawSectionTitle = (title: string, yPos: number) => {
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
      // const lineHeight = fontSize * 0.5;
      const colWidths = [80, 30, 30, 30]; // Ajustez selon vos besoins
      let y = startY;

      // En-têtes du tableau
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.rect(15, y, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

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
        if (y + 7 > maxY) {
          // Ajouter les footers à la page actuelle
          drawFooter(pdf.internal.getNumberOfPages());
          // Ajouter une nouvelle page
          pdf.addPage();
          // Dessiner le header de la nouvelle page
          drawHeader();
          // Réinitialiser la position Y
          y = 40;
          // Redessiner les en-têtes du tableau
          pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          pdf.rect(15, y, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

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
        pdf.rect(15, y, colWidths.reduce((a, b) => a + b, 0), 7, 'F');

        // Texte des cellules
        pdf.setTextColor(50, 50, 50);
        let xPos = 15;
        rows[i].forEach((cell: string | number | boolean | undefined, idx: number) => {
          if (cell !== undefined) {
            pdf.text(cell.toString(), xPos + cellPadding, y + 5);
          }
          xPos += colWidths[idx];
        });

        y += 7;
      }

      return y + 5;
    };

    const addCommentBox = (comment: string | undefined, y: number) => {
      if (!comment) return y;

      pdf.setFillColor(245, 245, 245);
      const boxHeight = Math.ceil(comment.length / 75) * 5 + 10; // Estimation de la hauteur nécessaire
      pdf.rect(15, y, 180, boxHeight, 'F');

      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);

      const commentLines = pdf.splitTextToSize(comment, 170);
      pdf.text(commentLines, 20, y + 5);

      return y + boxHeight + 5;
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
      ['Date de démonstration', data.clientInfo.demoDate || 'Non spécifiée']
    ];

    yPosition = drawTable(['Information', 'Détail'], clientInfoTable, yPosition);
    
    // Remarques générales avec hauteur dynamique
    yPosition += 5;
    pdf.setFillColor(245, 245, 245);
    const remarquesText = data.clientInfo.generalRemarks || 'Aucune';
    const remarquesLines = pdf.splitTextToSize(remarquesText, 170);
    const remarquesHeight = remarquesLines.length * 5 + 10;
    pdf.rect(15, yPosition, 180, remarquesHeight, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.text('Remarques générales', 20, yPosition + 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);
    pdf.text(remarquesLines, 20, yPosition + 12);
    
    yPosition += remarquesHeight + 10; // Ajoute un espace blanc supplémentaire (5 de plus)

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
      drawFooter(1);
      pdf.addPage();
      drawHeader();
      yPosition = 45;
    }

    // Fonctionnalités
    yPosition = drawSectionTitle('Options Sofwares', yPosition);

    const featuresHeaders = ['Options Sofwares', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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
      featuresRows.push(['Aucune Option Sofware sélectionnée', '', '', '']);
    }

    yPosition = drawTable(featuresHeaders, featuresRows, yPosition);
    yPosition = addCommentBox(data.features.comments, yPosition);

    // Ajouter la deuxième page pour les options matérielles et connexion
    drawFooter(1);
    pdf.addPage();
    drawHeader();
    yPosition = 45;

    // Options matérielles
    yPosition = drawSectionTitle('Options Hardwares', yPosition);

    const hardwareHeaders = ['Options Hardwares', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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
      hardwareRows.push(['Aucune Options Hardwares sélectionnée', '', '', '']);
    }

    yPosition = drawTable(hardwareHeaders, hardwareRows, yPosition);
    yPosition = addCommentBox(data.hardware.comments, yPosition);
    yPosition += 10;

    // Options de connexion
    yPosition = drawSectionTitle('Connectivités et imprimantes', yPosition);

    const connexHeaders = ['Connectivités et imprimantes', 'Présentée', 'Souhaitée', 'Non Souhaitée'];
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
      drawFooter(pdf.internal.getNumberOfPages());
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
      // Zone grise
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition, 180, remarquesHeight || 10, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);
      pdf.text(remarquesLines, 20, yPosition + 8);
      yPosition += (remarquesHeight || 10);

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
    pdf.setFillColor(245, 245, 245);
    const indecisText = data.medecins.indecis || 'Aucun';
    const indecisLines = pdf.splitTextToSize(indecisText, 170);
    const indecisHeight = indecisLines.length * 5 + 10;
    pdf.rect(15, yPosition, 180, indecisHeight, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(10);
    pdf.text('Indécis', 20, yPosition + 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);
    pdf.text(indecisLines, 20, yPosition + 12);
    
    yPosition += indecisHeight + 15;

    // Ajouter le footer à la dernière page
    drawFooter(pdf.internal.getNumberOfPages());

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

