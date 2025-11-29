/**
 * Service de génération PDF médical KadduCare
 * Design pixel-perfect basé sur le mockup officiel
 * Structure : Header → Info Patient → S → O → A → P → I → E → Footer
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// CONFIGURATION DESIGN STRICT (Basé sur le mockup)
// ============================================================================

const MARGINS = { top: 0, bottom: 60, left: 40, right: 40 };

// Couleurs exactes du mockup KadduCare
const COLORS = {
  // Bleu KadduCare (bannière header)
  primary: '#0A84FF',           // Bleu principal KadduCare
  primaryLight: '#E8F1FF',      // Bleu très clair (fond info patient)
  
  // Textes
  text: '#1B1B1D',             // Noir principal
  textSecondary: '#4A4A4A',     // Gris moyen
  textMuted: '#8E8E93',         // Gris clair
  
  // Backgrounds
  background: '#FFFFFF',         // Blanc pur
  backgroundTinted: '#F5F9FF',   // Fond teinté info patient (bleu très léger)
  
  // Bordures
  border: '#E5E5EA',            // Bordure standard
  borderLight: '#F0F0F0',       // Bordure très légère
  
  // Sections SOAPIE (labels colorés)
  sectionLabels: {
    S: '#0A84FF',               // Bleu pour Subjectif
    O: '#0A84FF',               // Bleu pour Objectif
    A: '#0A84FF',               // Bleu pour Analyse
    P: '#0A84FF',               // Bleu pour Plan
    I: '#0A84FF',               // Bleu pour Intervention
    E: '#0A84FF',               // Bleu pour Évaluation
  }
};

// Typographie médicale (Inter/SF Pro/Roboto équivalents)
const FONTS = {
  title: 'Helvetica-Bold',
  subtitle: 'Helvetica-Bold',
  body: 'Helvetica',
  bodyBold: 'Helvetica-Bold',
  mono: 'Courier'
};

// ============================================================================
// UTILITAIRES DE FORMATAGE
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
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch { return ''; }
}

function formatTime(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch { return ''; }
}

function ensurePageSpace(doc, height) {
  if (doc.page.height - doc.y - MARGINS.bottom < height) {
    doc.addPage();
    doc.y = MARGINS.top;
  }
}

/**
 * Formate strictement les unités médicales
 */
function formatVital(value, type) {
  if (!value) return '--';
  const v = String(value).replace(',', '.').trim();
  const num = parseFloat(v);

  if (isNaN(num)) return v;

  switch (type) {
    case 'temp':
      return `${num.toLocaleString('fr-FR')} °C`;
    case 'hr':
      return `${Math.round(num)} bpm`;
    case 'rr':
      return `${Math.round(num)} / min`;
    case 'spo2':
      return `${Math.round(num)} %`;
    case 'bp':
      return `${v} mmHg`;
    case 'glycemia':
      return `${v} g/L`;
    default:
      return v;
  }
}

// ============================================================================
// COMPOSANTS LAYOUT (Reproduction exacte du mockup)
// ============================================================================

/**
 * Header avec logo KadduCare + bannière bleue
 */
function renderHeader(doc, recordedAt, createdAt) {
  const dateTime = recordedAt || createdAt || new Date();
  const pageWidth = doc.page.width;
  
  // Bannière bleue en haut (hauteur ~50px)
  const bannerHeight = 50;
  doc.rect(0, 0, pageWidth, bannerHeight)
    .fillColor(COLORS.primary)
    .fill();
  
  // Logo KadduCare (texte stylisé en blanc sur bannière bleue)
  doc.fontSize(20)
    .fillColor('#FFFFFF')
    .font(FONTS.title)
    .text('KadduCare', MARGINS.left, 15);
  
  // Titre du rapport (blanc sur bannière)
  doc.fontSize(11)
    .fillColor('#FFFFFF')
    .font(FONTS.body)
    .text('Rapport Infirmier (Format SOAPIE)', MARGINS.left, 35);
  
  // Date et Heure (blanc, aligné droite)
  const dateStr = formatDate(dateTime);
  const timeStr = formatTime(dateTime);
  const rightX = pageWidth - MARGINS.right;
  
  doc.fontSize(10)
    .fillColor('#FFFFFF')
    .font(FONTS.body)
    .text(dateStr, rightX, 15, { align: 'right', width: 200 });
  
  doc.fontSize(10)
    .fillColor('#FFFFFF')
    .font(FONTS.body)
    .text(timeStr, rightX, 30, { align: 'right', width: 200 });
  
  // Position de départ pour le contenu
  doc.y = bannerHeight + 20;
}

/**
 * Bloc Informations Patient avec fond teinté
 */
function renderPatientInfo(doc, patientData, contentWidth) {
  ensurePageSpace(doc, 100);
  
  const startY = doc.y;
  const blockHeight = 80;
  const blockPadding = 15;
  
  // Rectangle avec fond teinté (bleu très léger)
  doc.rect(MARGINS.left, startY, contentWidth, blockHeight)
    .fillColor(COLORS.backgroundTinted)
    .fill();
  
  // Bordure légère
  doc.rect(MARGINS.left, startY, contentWidth, blockHeight)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();
  
  const colWidth = (contentWidth - blockPadding * 3) / 2;
  const textY = startY + blockPadding;
  
  // Colonne 1 : Nom et Âge
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('NOM COMPLET', MARGINS.left + blockPadding, textY);
  
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.bodyBold)
    .text(safeValue(patientData.full_name), MARGINS.left + blockPadding, textY + 12);
  
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('ÂGE', MARGINS.left + blockPadding, textY + 35);
  
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(safeValue(patientData.age || '--'), MARGINS.left + blockPadding, textY + 47);
  
  // Colonne 2 : Sexe et Unité/Service
  const col2X = MARGINS.left + blockPadding + colWidth + blockPadding;
  
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('SEXE', col2X, textY);
  
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(safeValue(patientData.gender || '--'), col2X, textY + 12);
  
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('UNITÉ / SERVICE', col2X, textY + 35);
  
  const unitText = `${safeValue(patientData.unit || '--')}${patientData.room_number ? ` - Ch. ${patientData.room_number}` : ''}`;
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(unitText, col2X, textY + 47, { width: colWidth });
  
  doc.y = startY + blockHeight + 25;
}

/**
 * En-tête de section SOAPIE avec label coloré
 */
function renderSOAPIESectionHeader(doc, letter, title) {
  ensurePageSpace(doc, 30);
  
  const sectionY = doc.y;
  
  // Label coloré (lettre + titre en bleu)
  doc.fontSize(11)
    .fillColor(COLORS.sectionLabels[letter] || COLORS.primary)
    .font(FONTS.bodyBold)
    .text(`${letter} – ${title}`, MARGINS.left, sectionY);
  
  // Ligne de séparation sous le titre
  doc.moveTo(MARGINS.left, sectionY + 12)
    .lineTo(doc.page.width - MARGINS.right, sectionY + 12)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();
  
  doc.y = sectionY + 20;
}

/**
 * Section Subjectif (S) - Texte avec puces
 */
function renderSubjective(doc, content, contentWidth) {
  if (isEmpty(content)) return;
  
  renderSOAPIESectionHeader(doc, 'S', 'SUBJECTIF');
  
  const textWidth = contentWidth;
  
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item && String(item).trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${String(item).trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  } else {
    // Si c'est une chaîne, on peut la diviser en phrases
    const sentences = String(content).trim().split(/[.!?]+/).filter(s => s.trim());
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${sentence.trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  }
  
  doc.y += 15;
}

/**
 * Section Objectif (O) - Tableau 2 colonnes + Examen physique
 */
function renderObjective(doc, objective, contentWidth) {
  if (!objective) return;
  
  renderSOAPIESectionHeader(doc, 'O', 'OBJECTIF');
  
  const vitals = objective.vitals || {};
  
  // Tableau des signes vitaux (2 colonnes : Mesure / Valeur)
  const tableY = doc.y;
  const col1Width = contentWidth * 0.5; // Colonne "Mesure"
  const col2Width = contentWidth * 0.5;  // Colonne "Valeur / Observations"
  const rowHeight = 18;
  
  // En-têtes du tableau
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.bodyBold)
    .text('Mesure', MARGINS.left, tableY);
  
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.bodyBold)
    .text('Valeur / Observations', MARGINS.left + col1Width, tableY);
  
  // Ligne de séparation sous les en-têtes
  doc.moveTo(MARGINS.left, tableY + 12)
    .lineTo(doc.page.width - MARGINS.right, tableY + 12)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();
  
  let currentY = tableY + 18;
  
  // Lignes du tableau (alignement à droite pour les valeurs)
  const vitalsList = [
    { label: 'Tension Artérielle (TA)', value: formatVital(vitals.blood_pressure, 'bp') },
    { label: 'Fréquence Cardiaque (FC)', value: formatVital(vitals.heart_rate, 'hr') },
    { label: 'Température', value: formatVital(vitals.temperature, 'temp') },
    { label: 'Fréquence Respiratoire (FR)', value: formatVital(vitals.respiratory_rate, 'rr') },
    { label: 'Saturation en Oxygène (SpO₂)', value: formatVital(vitals.spo2, 'spo2') },
  ];
  
  vitalsList.forEach(vital => {
    if (vital.value !== '--') {
      doc.fontSize(10)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(vital.label, MARGINS.left, currentY, { width: col1Width });
      
      doc.fontSize(10)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(vital.value, MARGINS.left + col1Width, currentY, { 
          width: col2Width, 
          align: 'right' 
        });
      
      currentY += rowHeight;
    }
  });
  
  doc.y = currentY + 15;
  
  // Examen Physique (sous-section)
  if (!isEmpty(objective.exam)) {
    doc.fontSize(10)
      .fillColor(COLORS.primary)
      .font(FONTS.bodyBold)
      .text('Examen Physique', MARGINS.left, doc.y);
    
    doc.y += 8;
    
    doc.fontSize(10)
      .fillColor(COLORS.text)
      .font(FONTS.body)
      .text(String(objective.exam).trim(), MARGINS.left, doc.y, { 
        width: contentWidth, 
        align: 'left', 
        lineGap: 4 
      });
    
    doc.y += 10;
  }
  
  // Résultats de laboratoire (si présent)
  if (!isEmpty(objective.labs)) {
    doc.fontSize(10)
      .fillColor(COLORS.primary)
      .font(FONTS.bodyBold)
      .text('Résultats de laboratoire', MARGINS.left, doc.y);
    
    doc.y += 8;
    
    doc.fontSize(10)
      .fillColor(COLORS.text)
      .font(FONTS.body)
      .text(String(objective.labs).trim(), MARGINS.left, doc.y, { 
        width: contentWidth, 
        align: 'left', 
        lineGap: 4 
      });
    
    doc.y += 10;
  }
  
  doc.y += 10;
}

/**
 * Section Analyse (A) - Texte
 */
function renderAnalysis(doc, content, contentWidth) {
  if (isEmpty(content)) return;
  
  renderSOAPIESectionHeader(doc, 'A', 'ANALYSE');
  
  const textWidth = contentWidth;
  
  doc.fontSize(10)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(String(content).trim(), MARGINS.left, doc.y, { 
      width: textWidth, 
      align: 'left', 
      lineGap: 4 
    });
  
  doc.y += 20;
}

/**
 * Section Plan (P) - Liste avec puces
 */
function renderPlan(doc, content, contentWidth) {
  if (isEmpty(content)) return;
  
  renderSOAPIESectionHeader(doc, 'P', 'PLAN DE SOINS');
  
  const textWidth = contentWidth;
  
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item && String(item).trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${String(item).trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  } else {
    // Diviser en phrases si c'est une chaîne
    const sentences = String(content).trim().split(/[.!?]+/).filter(s => s.trim());
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${sentence.trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  }
  
  doc.y += 15;
}

/**
 * Section Intervention (I) - Liste avec puces
 */
function renderIntervention(doc, content, contentWidth) {
  if (isEmpty(content)) return;
  
  renderSOAPIESectionHeader(doc, 'I', 'INTERVENTIONS RÉALISÉES');
  
  const textWidth = contentWidth;
  
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item && String(item).trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${String(item).trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  } else {
    const sentences = String(content).trim().split(/[.!?]+/).filter(s => s.trim());
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        doc.fontSize(10)
          .fillColor(COLORS.text)
          .font(FONTS.body)
          .text(`•  ${sentence.trim()}`, MARGINS.left, doc.y, { 
            width: textWidth, 
            align: 'left', 
            lineGap: 3 
          });
        doc.y += 3;
      }
    });
  }
  
  doc.y += 15;
}

/**
 * Section Évaluation (E) - Texte
 */
function renderEvaluation(doc, content, contentWidth) {
  if (isEmpty(content)) return;
  
  renderSOAPIESectionHeader(doc, 'E', 'ÉVALUATION');
  
  const textWidth = contentWidth;
  
  doc.fontSize(10)
    .fillColor(COLORS.text)
    .font(FONTS.body)
    .text(String(content).trim(), MARGINS.left, doc.y, { 
      width: textWidth, 
      align: 'left', 
      lineGap: 4 
    });
  
  doc.y += 20;
}

/**
 * Footer avec ligne, mentions et pagination
 */
function renderFooter(doc, user) {
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  const startPage = pageRange.start || 0;

  for (let i = startPage; i < startPage + pageCount; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - MARGINS.bottom + 20;

    // Ligne de séparation
    doc.moveTo(MARGINS.left, footerY - 10)
      .lineTo(doc.page.width - MARGINS.right, footerY - 10)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    // Gauche : Mention automatique
    doc.fontSize(8)
      .fillColor(COLORS.textMuted)
      .font(FONTS.body)
      .text('Document généré automatiquement via KadduCare', MARGINS.left, footerY);

    // Centre : Pagination
    doc.fontSize(8)
      .fillColor(COLORS.textMuted)
      .font(FONTS.body)
      .text(`Page ${i - startPage + 1} sur ${pageCount}`, MARGINS.left, footerY, { 
        width: doc.page.width - MARGINS.left - MARGINS.right, 
        align: 'center' 
      });

    // Droite : Nom de l'infirmière
    if (user && user.full_name) {
      doc.fontSize(8)
        .fillColor(COLORS.textMuted)
        .font(FONTS.body)
        .text(user.full_name, MARGINS.left, footerY, { 
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
    // Préparation Données
    const patientFromDB = patient || {};
    const patientFromAI = structuredJson?.patient || {};
    const isValid = (v) => v && String(v).trim() !== '';

    const patientData = {
      full_name: isValid(patientFromAI.full_name) ? patientFromAI.full_name : (patientFromDB.full_name || 'Patient Inconnu'),
      age: isValid(patientFromAI.age) ? patientFromAI.age : calculateAge(patientFromDB.dob),
      gender: isValid(patientFromAI.gender) ? patientFromAI.gender : patientFromDB.gender,
      room_number: isValid(patientFromAI.room_number) ? patientFromAI.room_number : patientFromDB.room_number,
      unit: isValid(patientFromAI.unit) ? patientFromAI.unit : patientFromDB.unit
    };

    const soapie = structuredJson?.soapie || {};

    // Setup PDF
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

    // 1. Header avec bannière bleue
    renderHeader(doc, recordedAt, createdAt);

    // 2. Informations Patient (fond teinté)
    renderPatientInfo(doc, patientData, contentWidth);

    // 3. S - Subjectif
    if (!isEmpty(soapie.S)) renderSubjective(doc, soapie.S, contentWidth);

    // 4. O - Objectif (tableau + examen physique)
    if (soapie.O) renderObjective(doc, soapie.O, contentWidth);

    // 5. A - Analyse
    if (!isEmpty(soapie.A)) renderAnalysis(doc, soapie.A, contentWidth);

    // 6. P - Plan de soins
    if (!isEmpty(soapie.P)) renderPlan(doc, soapie.P, contentWidth);

    // 7. I - Interventions réalisées
    if (!isEmpty(soapie.I)) renderIntervention(doc, soapie.I, contentWidth);

    // 8. E - Évaluation
    if (!isEmpty(soapie.E)) renderEvaluation(doc, soapie.E, contentWidth);

    // Footer
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
