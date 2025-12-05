/**
 * Service de génération PDF médical KadduCare
 * Design pixel-perfect basé sur la maquette officielle
 * Reproduction exacte du design premium KadduCare
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// CONFIGURATION DESIGN (Basée sur la maquette officielle)
// ============================================================================

const MARGINS = { top: 50, bottom: 60, left: 45, right: 45 };

// Couleurs exactes de la maquette
const COLORS = {
  // Sections SOAPIE (couleurs exactes de la maquette)
  sectionS: '#007BFF',        // Bleu pour Subjectif
  sectionO: '#007BFF',        // Bleu pour Objectif
  sectionA: '#009b5a',        // Vert foncé pour Analyse
  sectionP: '#00C853',        // Vert pour Plan
  sectionI: '#0057A3',        // Bleu foncé pour Intervention
  sectionE: '#5A6C7A',        // Bleu-gris pour Évaluation

  // Textes
  text: '#1B1B1D',           // Noir principal
  textSecondary: '#4A4A4A',   // Gris moyen
  textMuted: '#8E8E93',       // Gris clair
  textWhite: '#FFFFFF',       // Blanc

  // Backgrounds
  background: '#FFFFFF',      // Blanc pur
  cardBg: '#F7F9FC',         // Fond carte patient (bleu très clair)
  tableBg: '#F2F6FC',        // Fond tableau (bleu très clair)
  tableAlt: '#FAFBFD',       // Fond alterné tableau

  // Bordures
  border: '#E0E0E0',         // Bordure standard
  borderLight: '#F0F0F0',     // Bordure légère

  // KadduCare brand
  primary: '#1A73E8',        // Bleu KadduCare
};

// Typographie (Inter/SF Pro/Roboto)
const FONTS = {
  title: 'Helvetica-Bold',
  body: 'Helvetica',
  bodyBold: 'Helvetica-Bold',
};

// Espacements (basés sur la maquette)
const SPACING = {
  sectionGap: 24,            // Espace entre sections
  blockPadding: 16,          // Padding interne
  lineGap: 6,                // Interligne (1.45)
  paragraphGap: 12,          // Entre paragraphes
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function safeValue(value) {
  if (value === null || value === undefined) return 'Non renseigné';
  if (typeof value === 'string' && value.trim() === '') return 'Non renseigné';
  return String(value).trim();
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function calculateAge(dob) {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} ans`;
  } catch { return null; }
}

function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    const day = d.getDate();
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch { return ''; }
}

function formatTime(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch { return ''; }
}

function ensurePageSpace(doc, height) {
  if (doc.page.height - doc.y - MARGINS.bottom < height) {
    doc.addPage();
    doc.y = MARGINS.top;
  }
}

function formatVital(value, type) {
  if (!value) return '--';
  const v = String(value).replace(',', '.').trim();
  const num = parseFloat(v);
  if (isNaN(num)) return v;

  switch (type) {
    case 'temp': return `${num.toLocaleString('fr-FR')}°C`;
    case 'hr': return `${Math.round(num)} bpm`;
    case 'rr': return `${Math.round(num)} cycles/min`;
    case 'spo2': return `${Math.round(num)}%`;
    case 'bp': return `${v} mmHg`;
    case 'glycemia': return `${v} g/L`;
    default: return v;
  }
}

// ============================================================================
// HEADER (Reproduction exacte de la maquette)
// ============================================================================

function renderHeader(doc, recordedAt, createdAt) {
  const dateTime = recordedAt || createdAt || new Date();
  const pageWidth = doc.page.width;

  // Bannière bleue premium (hauteur 60px pour plus d'espace)
  const bannerHeight = 60;
  const bannerY = 0;
  
  // Bannière avec dégradé simulé (couleur principale)
  doc.rect(0, bannerY, pageWidth, bannerHeight)
    .fillColor(COLORS.primary)
    .fill();
  
  // Chemin du logo (depuis le backend, relatif au projet)
  const possiblePaths = [
    path.join(__dirname, '../../mobile/mobile-app/assets/images/logo-kadducare.png'),
    path.join(__dirname, '../../../mobile/mobile-app/assets/images/logo-kadducare.png'),
    path.join(process.cwd(), 'mobile/mobile-app/assets/images/logo-kadducare.png'),
  ];
  
  let logoPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      logoPath = possiblePath;
      break;
    }
  }
  
  const headerY = bannerY + 14; // Position verticale dans le header (centré verticalement)
  let currentX = MARGINS.left;
  
  // Logo KadduCare Pro (32px pour un look premium)
  if (logoPath) {
    try {
      const logoSize = 32;
      const logoY = bannerY + (bannerHeight - logoSize) / 2; // Centré verticalement
      doc.image(logoPath, currentX, logoY, { 
        width: logoSize, 
        height: logoSize,
        fit: [logoSize, logoSize]
      });
      currentX += logoSize + 12; // Espacement après le logo
    } catch (logoError) {
      console.warn('⚠️ Impossible de charger le logo:', logoError.message);
    }
  }
  
  // Texte "KadduCare" Pro (22px, Bold, blanc, letter-spacing -0.5px)
  doc.fontSize(22)
    .fillColor(COLORS.textWhite)
    .font(FONTS.title)
    .text('KadduCare', currentX, headerY, {
      characterSpacing: -0.5
    });
  
  // Mesurer la largeur du texte "KadduCare" pour positionner le titre
  const kadduCareWidth = doc.widthOfString('KadduCare', { font: FONTS.title, fontSize: 22 });
  const subtitleX = currentX + kadduCareWidth + 10;
  
  // Titre "Rapport Infirmier (Format SOAPIE)" (12px, blanc, opacity simulée avec gris très clair)
  doc.fontSize(12)
    .fillColor('#F5F5F5') // Simule opacity 0.95
    .font(FONTS.body)
    .text('Rapport Infirmier (Format SOAPIE)', subtitleX, headerY + 2);

  // Date et Heure (10px, blanc, opacity 0.9, aligné droite)
  const dateStr = formatDate(dateTime);
  const timeStr = formatTime(dateTime);
  const dateTimeStr = `${dateStr} | ${timeStr}`;
  const rightX = pageWidth - MARGINS.right;
  
  doc.fontSize(10)
    .fillColor('#E8E8E8') // Simule opacity 0.9
    .font(FONTS.body)
    .text(dateTimeStr, rightX, headerY + 3, { align: 'right', width: 250 });

  // Position de départ pour le contenu (après la bannière + marge)
  doc.y = bannerY + bannerHeight + 20;

  // Ligne de séparation fine
  doc.moveTo(MARGINS.left, doc.y - 5)
    .lineTo(pageWidth - MARGINS.right, doc.y - 5)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc.y = MARGINS.top + 30;
}

// ============================================================================
// BLOC PATIENT (Carte arrondie avec fond #F7F9FC)
// ============================================================================

function renderPatientCard(doc, patientData, contentWidth) {
  ensurePageSpace(doc, 100);

  const cardY = doc.y;
  const cardHeight = 80;
  const cardPadding = 16;
  const borderRadius = 12;

  // Carte arrondie avec fond #F7F9FC
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, borderRadius)
    .fillColor(COLORS.cardBg)
    .fill();

  // Bordure subtile
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, borderRadius)
    .strokeColor(COLORS.borderLight)
    .lineWidth(1)
    .stroke();

  const colWidth = (contentWidth - cardPadding * 3) / 2;
  const textY = cardY + cardPadding;

  // Colonne 1 : Nom complet et Âge
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('Nom complet:', MARGINS.left + cardPadding, textY);

  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.bodyBold)
    .text(safeValue(patientData.full_name), MARGINS.left + cardPadding, textY + 12);

  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('Âge:', MARGINS.left + cardPadding, textY + 36);

  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(safeValue(patientData.age || '--'), MARGINS.left + cardPadding, textY + 48);

  // Colonne 2 : Sexe et Unité/Service
  const col2X = MARGINS.left + cardPadding + colWidth + cardPadding;

  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('Sexe:', col2X, textY);

  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(safeValue(patientData.gender || '--'), col2X, textY + 12);

  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('Unité / Service:', col2X, textY + 36);

  const unitText = `${safeValue(patientData.unit || '--')}${patientData.room_number ? ` - Aile ${patientData.room_number}` : ''}`;
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(unitText, col2X, textY + 48, { width: colWidth });

  doc.y = cardY + cardHeight + SPACING.sectionGap;
}

// ============================================================================
// EN-TÊTE DE SECTION SOAPIE (Lettre colorée + barre verticale)
// ============================================================================

function renderSectionHeader(doc, letter, title, color) {
  ensurePageSpace(doc, 40);

  const sectionY = doc.y;
  const barWidth = 4;
  const barHeight = 24;

  // Barre verticale colorée à gauche
  doc.rect(MARGINS.left, sectionY, barWidth, barHeight)
    .fillColor(color)
    .fill();

  // Lettre + Titre (ex: "S – Subjectif")
  doc.fontSize(16)
    .fillColor(color)
    .font(FONTS.title)
    .text(`${letter} – ${title}`, MARGINS.left + barWidth + 10, sectionY + 2);

  doc.y = sectionY + barHeight + 12;
}

// ============================================================================
// SECTION S - SUBJECTIF
// ============================================================================

function renderSubjective(doc, content, contentWidth) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, 'S', 'Subjectif', COLORS.sectionS);

  // Texte dans une carte légère
  const cardY = doc.y;
  const textPadding = 12;

  // Calculer la hauteur nécessaire
  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font(FONTS.body);

  const textContent = Array.isArray(content) ? content.join('. ') : String(content).trim();
  const textHeight = doc.heightOfString(textContent, {
    width: contentWidth - textPadding * 2,
    lineGap: SPACING.lineGap
  });

  const cardHeight = textHeight + textPadding * 2;

  // Carte arrondie
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
    .fillColor('#FAFBFD')
    .fill();

  // Texte
  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(textContent, MARGINS.left + textPadding, cardY + textPadding, {
      width: contentWidth - textPadding * 2,
      align: 'left',
      lineGap: SPACING.lineGap
    });

  doc.y = cardY + cardHeight + SPACING.sectionGap;
}

// ============================================================================
// SECTION O - OBJECTIF (Tableau + Examen physique)
// ============================================================================

function renderObjective(doc, objective, contentWidth) {
  if (!objective) return;

  renderSectionHeader(doc, 'O', 'Objectif', COLORS.sectionO);

  const vitals = objective.vitals || {};

  // Tableau des signes vitaux
  const tableY = doc.y;
  const col1Width = contentWidth * 0.45;
  const col2Width = contentWidth * 0.55;
  const rowHeight = 22;

  // En-tête du tableau (fond bleu clair)
  doc.rect(MARGINS.left, tableY, contentWidth, 24)
    .fillColor(COLORS.tableBg)
    .fill();

  doc.fontSize(10)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.bodyBold)
    .text('Mesure', MARGINS.left + 8, tableY + 8);

  doc.text('Valeur / Observations', MARGINS.left + col1Width + 8, tableY + 8);

  let currentY = tableY + 24;

  // Lignes du tableau
  const vitalsList = [
    { label: 'Tension Artérielle (TA)', value: formatVital(vitals.blood_pressure, 'bp') },
    { label: 'Fréquence Cardiaque (FC)', value: formatVital(vitals.heart_rate, 'hr') },
    { label: 'Température', value: formatVital(vitals.temperature, 'temp') },
    { label: 'Fréquence Respiratoire (FR)', value: formatVital(vitals.respiratory_rate, 'rr') },
    { label: 'Saturation en Oxygène (SpO2)', value: formatVital(vitals.spo2, 'spo2') },
  ];

  vitalsList.forEach((vital, index) => {
    if (vital.value !== '--') {
      // Fond alterné
      if (index % 2 === 0) {
        doc.rect(MARGINS.left, currentY, contentWidth, rowHeight)
          .fillColor(COLORS.tableAlt)
          .fill();
      }

      // Label
      doc.fontSize(10)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(vital.label, MARGINS.left + 8, currentY + 6, { width: col1Width - 16 });

      // Valeur
      doc.fontSize(10)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(vital.value, MARGINS.left + col1Width + 8, currentY + 6, {
          width: col2Width - 16,
          align: 'left'
        });

      currentY += rowHeight;
    }
  });

  doc.y = currentY + 12;

  // Examen Physique (carte)
  if (!isEmpty(objective.exam)) {
    const examY = doc.y;
    const examPadding = 12;

    // Titre
    doc.fontSize(12)
      .fillColor(COLORS.sectionO)
      .font(FONTS.bodyBold)
      .text('Examen Physique', MARGINS.left, examY);

    doc.y += 8;

    // Carte
    const textContent = String(objective.exam).trim();
    const textHeight = doc.heightOfString(textContent, {
      width: contentWidth - examPadding * 2,
      lineGap: SPACING.lineGap
    });

    const cardHeight = textHeight + examPadding * 2;
    const cardY = doc.y;

    doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
      .fillColor('#FAFBFD')
      .fill();

    doc.fontSize(11)
      .fillColor(COLORS.text)
      .font(FONTS.body)
      .text(textContent, MARGINS.left + examPadding, cardY + examPadding, {
        width: contentWidth - examPadding * 2,
        align: 'left',
        lineGap: SPACING.lineGap
      });

    doc.y = cardY + cardHeight + 12;
  }

  doc.y += SPACING.sectionGap;
}

// ============================================================================
// SECTION A - ANALYSE
// ============================================================================

function renderAnalysis(doc, content, contentWidth) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, 'A', 'Analyse', COLORS.sectionA);

  const cardY = doc.y;
  const textPadding = 12;

  const textContent = String(content).trim();
  const textHeight = doc.heightOfString(textContent, {
    width: contentWidth - textPadding * 2,
    lineGap: SPACING.lineGap
  });

  const cardHeight = textHeight + textPadding * 2;

  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
    .fillColor('#FAFBFD')
    .fill();

  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(textContent, MARGINS.left + textPadding, cardY + textPadding, {
      width: contentWidth - textPadding * 2,
      align: 'left',
      lineGap: SPACING.lineGap
    });

  doc.y = cardY + cardHeight + SPACING.sectionGap;
}

// ============================================================================
// SECTION P - PLAN DE SOINS (Checkboxes vertes)
// ============================================================================

function renderPlan(doc, content, contentWidth) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, 'P', 'Plan de soins', COLORS.sectionP);

  const items = Array.isArray(content)
    ? content
    : String(content).trim().split(/[.!?]+/).filter(s => s.trim());

  items.forEach(item => {
    if (item && String(item).trim()) {
      const itemY = doc.y;

      // Checkbox verte (carré avec checkmark)
      const checkSize = 12;
      doc.rect(MARGINS.left, itemY + 2, checkSize, checkSize)
        .fillColor(COLORS.sectionP)
        .fill();

      // Checkmark blanc
      doc.fontSize(10)
        .fillColor('#FFFFFF')
        .font(FONTS.bodyBold)
        .text('✓', MARGINS.left + 2, itemY + 1);

      // Texte
      doc.fontSize(11)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(String(item).trim(), MARGINS.left + checkSize + 8, itemY, {
          width: contentWidth - checkSize - 8,
          align: 'left',
          lineGap: SPACING.lineGap
        });

      doc.y += 8;
    }
  });

  doc.y += SPACING.sectionGap;
}

// ============================================================================
// SECTION I - INTERVENTIONS (Puces bleues)
// ============================================================================

function renderIntervention(doc, content, contentWidth) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, 'I', 'Interventions réalisées', COLORS.sectionI);

  const items = Array.isArray(content)
    ? content
    : String(content).trim().split(/[.!?]+/).filter(s => s.trim());

  items.forEach(item => {
    if (item && String(item).trim()) {
      const itemY = doc.y;

      // Puce bleue ronde
      doc.circle(MARGINS.left + 4, itemY + 6, 3)
        .fillColor(COLORS.sectionI)
        .fill();

      // Texte
      doc.fontSize(11)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(String(item).trim(), MARGINS.left + 14, itemY, {
          width: contentWidth - 14,
          align: 'left',
          lineGap: SPACING.lineGap
        });

      doc.y += 8;
    }
  });

  doc.y += SPACING.sectionGap;
}

// ============================================================================
// SECTION E - ÉVALUATION
// ============================================================================

function renderEvaluation(doc, content, contentWidth) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, 'E', 'Évaluation', COLORS.sectionE);

  const cardY = doc.y;
  const textPadding = 12;

  const textContent = String(content).trim();
  const textHeight = doc.heightOfString(textContent, {
    width: contentWidth - textPadding * 2,
    lineGap: SPACING.lineGap
  });

  const cardHeight = textHeight + textPadding * 2;

  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
    .fillColor('#FAFBFD')
    .fill();

  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(textContent, MARGINS.left + textPadding, cardY + textPadding, {
      width: contentWidth - textPadding * 2,
      align: 'left',
      lineGap: SPACING.lineGap
    });

  doc.y = cardY + cardHeight + SPACING.sectionGap;
}

// ============================================================================
// FOOTER
// ============================================================================

function renderFooter(doc, user) {
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  const startPage = pageRange.start || 0;

  for (let i = startPage; i < startPage + pageCount; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - MARGINS.bottom + 20;

    // Ligne fine grise
    doc.moveTo(MARGINS.left, footerY - 10)
      .lineTo(doc.page.width - MARGINS.right, footerY - 10)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();

    // Gauche : Mention
    doc.fontSize(8)
      .fillColor(COLORS.textMuted)
      .font(FONTS.body)
      .text('Document généré automatiquement — KadduCare', MARGINS.left, footerY);

    // Centre : Pagination
    doc.fontSize(8)
      .fillColor(COLORS.textMuted)
      .text(`Page ${i - startPage + 1} sur ${pageCount}`, MARGINS.left, footerY, {
        width: doc.page.width - MARGINS.left - MARGINS.right,
        align: 'center'
      });

    // Droite : Infirmière
    if (user && user.full_name) {
      doc.fontSize(8)
        .fillColor(COLORS.textMuted)
        .text(`Infirmier(ère): ${user.full_name}`, MARGINS.left, footerY, {
          width: doc.page.width - MARGINS.left - MARGINS.right,
          align: 'right'
        });
    }
  }
}

// ============================================================================
// GÉNÉRATEUR PRINCIPAL
// ============================================================================

async function generatePDF({
  patient,
  transcriptionText,
  structuredJson,
  recordedAt,
  createdAt,
  user,
  mode = 'complet',
  noteId = null,
  patientId = null
}) {
  try {
    if (!structuredJson || !structuredJson.soapie) {
      throw new Error('Missing structured data');
    }

    const patientFromForm = structuredJson?.patient || {};
    const patientFromParam = patient || {};

    const isValid = (v) => v && String(v).trim() !== '';

    const patientData = {
      full_name: isValid(patientFromForm.full_name)
        ? patientFromForm.full_name
        : (isValid(patientFromParam.full_name) ? patientFromParam.full_name : 'Patient Inconnu'),
      age: isValid(patientFromForm.age)
        ? patientFromForm.age
        : (isValid(patientFromParam.age) ? patientFromParam.age : (patientFromParam.dob ? calculateAge(patientFromParam.dob) : '')),
      gender: isValid(patientFromForm.gender)
        ? patientFromForm.gender
        : (patientFromParam.gender || ''),
      room_number: isValid(patientFromForm.room_number)
        ? patientFromForm.room_number
        : (patientFromParam.room_number || ''),
      unit: isValid(patientFromForm.unit)
        ? patientFromForm.unit
        : (patientFromParam.unit || '')
    };

    const soapie = structuredJson.soapie;

    const tempDir = os.tmpdir();
    const fileName = `KADDU-${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const contentWidth = doc.page.width - MARGINS.left - MARGINS.right;

    // 1. Header
    renderHeader(doc, recordedAt, createdAt);

    // 2. Carte Patient
    renderPatientCard(doc, patientData, contentWidth);

    // 3. Sections SOAPIE
    if (!isEmpty(soapie.S)) renderSubjective(doc, soapie.S, contentWidth);
    if (soapie.O) renderObjective(doc, soapie.O, contentWidth);
    if (!isEmpty(soapie.A)) renderAnalysis(doc, soapie.A, contentWidth);
    if (!isEmpty(soapie.P)) renderPlan(doc, soapie.P, contentWidth);
    if (!isEmpty(soapie.I)) renderIntervention(doc, soapie.I, contentWidth);
    if (!isEmpty(soapie.E)) renderEvaluation(doc, soapie.E, contentWidth);

    // 4. Footer
    renderFooter(doc, user);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });

  } catch (error) {
    console.error('PDF Gen Error:', error);
    throw error;
  }
}

module.exports = { generatePDF };
