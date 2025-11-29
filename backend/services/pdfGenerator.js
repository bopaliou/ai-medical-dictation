/**
 * Service de génération PDF médical premium - KadduCare
 * Design moderne, élégant et professionnel adapté aux environnements hospitaliers
 * Standards : Mayo Clinic, Meditech, Epic Systems, Johns Hopkins
 * Compatible impression A4 et consultation mobile
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// CONSTANTES ET CONFIGURATION DESIGN PREMIUM
// ============================================================================

const MARGINS = {
  top: 50,      // Marge supérieure pour header
  bottom: 40,   // Marge inférieure pour footer
  left: 40,     // Marge gauche
  right: 40     // Marge droite
};

const COLORS = {
  // Palette KadduCare
  primary: '#0A84FF',           // KadduCare Blue
  primaryDark: '#0051D5',       // Bleu foncé pour contrastes
  success: '#34C759',           // Vert validation
  text: '#1B1B1D',              // Noir doux (Design System)
  textSecondary: '#8E8E93',     // Gris secondaire
  textMuted: '#AEAEB2',         // Gris discret
  background: '#F2F2F7',        // Gris système iOS
  backgroundCard: '#FFFFFF',    // Fond blanc cartes
  backgroundAlt: '#F9F9FA',     // Fond alterné très léger
  border: '#E5E5EA',            // Bordure fine
  borderLight: '#F2F2F7',       // Bordure très légère
  white: '#FFFFFF',

  // Couleurs par section SOAPIE (Pastels médicaux)
  section: {
    s: '#EBF5FF',                // Subjectif (Bleu très pâle)
    o: '#F0F9FF',                // Objectif (Ciel très pâle)
    a: '#FFF9F0',                // Analyse (Orange très pâle)
    i: '#F2FCF5',                // Intervention (Vert très pâle)
    e: '#F5F3FF',                // Évaluation (Violet très pâle)
    p: '#FFFBE6'                 // Plan (Jaune très pâle)
  },
  sectionBorder: {
    s: '#0A84FF',
    o: '#00C7BE',
    a: '#FF9500',
    i: '#34C759',
    e: '#AF52DE',
    p: '#FFCC00'
  }
};

const FONTS = {
  title: 'Helvetica-Bold',       // Titres principaux
  subtitle: 'Helvetica-Bold',    // Sous-titres
  body: 'Helvetica',             // Corps de texte
  label: 'Helvetica',            // Labels
  monospace: 'Courier'           // Valeurs chiffrées
};

const SECTION_TITLES = {
  S: 'SUBJECTIF',
  O: 'OBJECTIF',
  A: 'ANALYSE',
  I: 'INTERVENTION',
  E: 'ÉVALUATION',
  P: 'PLAN'
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function safeValue(value) {
  if (value === null || value === undefined) return 'Non renseigné';
  if (typeof value === 'string' && value.trim() === '') return 'Non renseigné';
  if (typeof value === 'object' && Object.keys(value).length === 0) return 'Non renseigné';
  if (Array.isArray(value) && value.length === 0) return 'Non renseigné';
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
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ans`;
  } catch {
    return null;
  }
}

function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

function formatTime(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function ensurePageSpace(doc, requiredHeight) {
  const remainingHeight = doc.page.height - doc.y - MARGINS.bottom;
  if (remainingHeight < requiredHeight) {
    doc.addPage();
    doc.y = MARGINS.top;
  }
}

// ============================================================================
// HEADER KADDUCARE
// ============================================================================

function renderHeader(doc, recordedAt, createdAt, contentWidth) {
  const headerHeight = 70;
  const dateTime = recordedAt || createdAt || new Date();

  // Fond blanc pur pour le header (style papier à en-tête)
  // Logo KadduCare (Texte stylisé faute d'image)
  doc.fontSize(22)
    .fillColor(COLORS.primary)
    .font(FONTS.title)
    .text('KadduCare', MARGINS.left, 25, {
      width: contentWidth * 0.5,
      align: 'left'
    });

  // Sous-titre "Medical Intelligence"
  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text('Medical Intelligence', MARGINS.left, 50, {
      width: contentWidth * 0.5,
      align: 'left',
      characterSpacing: 1
    });

  // Bloc Date/Heure à droite avec fond léger
  const dateBlockWidth = 180;
  const dateBlockX = doc.page.width - MARGINS.right - dateBlockWidth;

  doc.roundedRect(dateBlockX, 20, dateBlockWidth, 40, 4)
    .fillColor(COLORS.section.s) // Fond bleu très pâle
    .fill();

  doc.fontSize(9)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.label)
    .text('DATE DU RAPPORT', dateBlockX + 10, 26, {
      width: dateBlockWidth - 20,
      align: 'left'
    });

  doc.fontSize(11)
    .fillColor(COLORS.primary)
    .font(FONTS.title)
    .text(formatDate(dateTime), dateBlockX + 10, 40, {
      width: dateBlockWidth - 20,
      align: 'left'
    });

  // Ligne de séparation dégradée (simulée par ligne fine)
  doc.moveTo(MARGINS.left, headerHeight + 10)
    .lineTo(doc.page.width - MARGINS.right, headerHeight + 10)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc.y = headerHeight + 30;
}

// ============================================================================
// CARTE PATIENT PREMIUM
// ============================================================================

function renderPatientCard(doc, patientData, patientId, noteId, contentWidth) {
  ensurePageSpace(doc, 110);

  const cardY = doc.y;
  const padding = 20;
  const cardHeight = 90;

  // Fond de la carte patient (Gris très léger pour détacher du fond blanc)
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
    .fillColor(COLORS.backgroundAlt)
    .fill()
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();

  // Avatar placeholder (Cercle avec initiales)
  const avatarSize = 50;
  const avatarX = MARGINS.left + padding;
  const avatarY = cardY + (cardHeight - avatarSize) / 2;

  doc.circle(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2)
    .fillColor(COLORS.primary)
    .fill();

  const initials = patientData.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  doc.fontSize(18)
    .fillColor(COLORS.white)
    .font(FONTS.title)
    .text(initials, avatarX, avatarY + 16, {
      width: avatarSize,
      align: 'center'
    });

  // Informations Patient
  const infoX = avatarX + avatarSize + 20;
  const infoY = cardY + 20;

  // Nom
  doc.fontSize(16)
    .fillColor(COLORS.text)
    .font(FONTS.title)
    .text(patientData.full_name, infoX, infoY);

  // Détails (Âge, Sexe)
  const details = [
    patientData.age || 'Âge inconnu',
    patientData.gender || 'Sexe inconnu'
  ].join(' • ');

  doc.fontSize(11)
    .fillColor(COLORS.textSecondary)
    .font(FONTS.body)
    .text(details, infoX, infoY + 22);

  // Localisation (Droite)
  if (patientData.room_number || patientData.unit) {
    const locX = doc.page.width - MARGINS.right - 150;

    doc.fontSize(9)
      .fillColor(COLORS.textMuted)
      .font(FONTS.label)
      .text('LOCALISATION', locX, infoY, { align: 'right' });

    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font(FONTS.body)
      .text(patientData.room_number ? `Ch. ${patientData.room_number}` : '', locX, infoY + 14, { align: 'right' });

    doc.fontSize(10)
      .fillColor(COLORS.textSecondary)
      .font(FONTS.body)
      .text(patientData.unit || '', locX, infoY + 30, { align: 'right' });
  }

  doc.y = cardY + cardHeight + 25;
}

// ============================================================================
// SECTIONS SOAPIE - DESIGN CARTE
// ============================================================================

function renderSection(doc, letter, content, contentWidth) {
  if (isEmpty(content)) return;

  const title = SECTION_TITLES[letter] || letter;
  const bgColor = COLORS.section[letter.toLowerCase()] || COLORS.backgroundAlt;
  const borderColor = COLORS.sectionBorder[letter.toLowerCase()] || COLORS.primary;

  // Estimation hauteur
  const estimatedHeight = Array.isArray(content)
    ? content.length * 16 + 60
    : String(content).split('\n').length * 16 + 60;

  ensurePageSpace(doc, estimatedHeight);

  const cardY = doc.y;
  const padding = 15;
  let cardHeight = 40; // Hauteur min initiale

  // Titre de la section (Badge style)
  const titleWidth = 120;
  doc.roundedRect(MARGINS.left, cardY, titleWidth, 24, 4)
    .fillColor(borderColor)
    .fill();

  doc.fontSize(10)
    .fillColor(COLORS.white)
    .font(FONTS.title)
    .text(`${letter}  •  ${title}`, MARGINS.left, cardY + 7, {
      width: titleWidth,
      align: 'center'
    });

  // Contenu
  let contentY = cardY + 35;

  // Barre verticale de continuité
  const barX = MARGINS.left + 15;

  if (Array.isArray(content)) {
    const validItems = content.filter(item => item && String(item).trim());
    validItems.forEach((item) => {
      // Puce stylisée
      doc.circle(barX, contentY + 6, 2)
        .fillColor(borderColor)
        .fill();

      doc.fontSize(11)
        .fillColor(COLORS.text)
        .font(FONTS.body)
        .text(String(item).trim(), barX + 15, contentY, {
          width: contentWidth - 40,
          lineGap: 4,
          align: 'justify'
        });
      contentY = doc.y + 8;
    });
  } else {
    doc.fontSize(11)
      .fillColor(COLORS.text)
      .font(FONTS.body)
      .text(String(content), MARGINS.left, contentY, {
        width: contentWidth,
        lineGap: 4,
        align: 'justify'
      });
    contentY = doc.y + 8;
  }

  doc.y = contentY + 15;
}

function renderVitalsTable(doc, vitals, contentWidth) {
  if (!vitals || typeof vitals !== 'object') return;

  // Filtrer
  const rows = [];
  if (!isEmpty(vitals.temperature)) rows.push({ label: 'Température', value: vitals.temperature, unit: '°C' });
  if (!isEmpty(vitals.blood_pressure)) rows.push({ label: 'Tension', value: vitals.blood_pressure, unit: 'cmHg' });
  if (!isEmpty(vitals.heart_rate)) rows.push({ label: 'Fréquence Cardiaque', value: vitals.heart_rate, unit: 'bpm' });
  if (!isEmpty(vitals.respiratory_rate)) rows.push({ label: 'Fréquence Respi.', value: vitals.respiratory_rate, unit: '/min' });
  if (!isEmpty(vitals.spo2)) rows.push({ label: 'SpO₂', value: vitals.spo2, unit: '%' });
  if (!isEmpty(vitals.glycemia)) rows.push({ label: 'Glycémie', value: vitals.glycemia, unit: 'g/L' });

  if (rows.length === 0) return;

  ensurePageSpace(doc, 100);

  const tableY = doc.y;

  // Titre "Signes Vitaux"
  doc.fontSize(12)
    .fillColor(COLORS.text)
    .font(FONTS.subtitle)
    .text('Signes Vitaux', MARGINS.left, tableY);

  let currentY = tableY + 20;

  // Grille de signes vitaux (3 colonnes)
  const colWidth = contentWidth / 3;

  rows.forEach((row, index) => {
    const colIndex = index % 3;
    const rowIndex = Math.floor(index / 3);

    if (colIndex === 0 && rowIndex > 0) currentY += 45;

    const x = MARGINS.left + (colIndex * colWidth);

    // Carte signe vital
    doc.roundedRect(x, currentY, colWidth - 10, 40, 6)
      .fillColor(COLORS.backgroundAlt)
      .fill()
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(9)
      .fillColor(COLORS.textSecondary)
      .font(FONTS.label)
      .text(row.label.toUpperCase(), x + 10, currentY + 8, { width: colWidth - 30 });

    doc.fontSize(12)
      .fillColor(COLORS.primary)
      .font(FONTS.title)
      .text(`${row.value} ${row.unit}`, x + 10, currentY + 22, { width: colWidth - 30 });
  });

  doc.y = currentY + 55;
}

function renderObjectiveSection(doc, objective, contentWidth) {
  if (!objective || typeof objective !== 'object') return;

  const hasVitals = objective.vitals && Object.keys(objective.vitals).some(k => !isEmpty(objective.vitals[k]));
  const hasExam = !isEmpty(objective.exam);
  const hasLabs = !isEmpty(objective.labs);
  const hasMedications = Array.isArray(objective.medications) && objective.medications.some(m => !isEmpty(m));

  if (!hasVitals && !hasExam && !hasLabs && !hasMedications) return;

  ensurePageSpace(doc, 100);

  // Titre Section O
  const cardY = doc.y;
  doc.roundedRect(MARGINS.left, cardY, 120, 24, 4)
    .fillColor(COLORS.sectionBorder.o)
    .fill();

  doc.fontSize(10)
    .fillColor(COLORS.white)
    .font(FONTS.title)
    .text(`O  •  OBJECTIF`, MARGINS.left, cardY + 7, {
      width: 120,
      align: 'center'
    });

  doc.y += 40;

  if (hasVitals) renderVitalsTable(doc, objective.vitals, contentWidth);

  if (hasExam) {
    ensurePageSpace(doc, 60);
    doc.fontSize(11).fillColor(COLORS.primary).font(FONTS.subtitle).text('Examen Physique', MARGINS.left, doc.y);
    doc.y += 5;
    doc.fontSize(11).fillColor(COLORS.text).font(FONTS.body).text(objective.exam.trim(), MARGINS.left, doc.y, { width: contentWidth, align: 'justify' });
    doc.y += 15;
  }

  if (hasLabs) {
    ensurePageSpace(doc, 60);
    doc.fontSize(11).fillColor(COLORS.primary).font(FONTS.subtitle).text('Laboratoire', MARGINS.left, doc.y);
    doc.y += 5;
    doc.fontSize(11).fillColor(COLORS.text).font(FONTS.body).text(objective.labs.trim(), MARGINS.left, doc.y, { width: contentWidth, align: 'justify' });
    doc.y += 15;
  }

  if (hasMedications) {
    ensurePageSpace(doc, 60);
    doc.fontSize(11).fillColor(COLORS.primary).font(FONTS.subtitle).text('Médicaments', MARGINS.left, doc.y);
    doc.y += 5;
    objective.medications.forEach(med => {
      if (med && String(med).trim()) {
        doc.fontSize(11).fillColor(COLORS.text).font(FONTS.body).text(`• ${String(med).trim()}`, MARGINS.left + 10, doc.y);
        doc.y += 5;
      }
    });
    doc.y += 15;
  }
}

// ============================================================================
// FOOTER
// ============================================================================

function renderFooter(doc, user, dateTime) {
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  const startPage = pageRange.start || 0;
  const contentWidth = doc.page.width - MARGINS.left - MARGINS.right;

  for (let i = startPage; i < startPage + pageCount; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - MARGINS.bottom + 10;

    doc.moveTo(MARGINS.left, footerY - 15)
      .lineTo(doc.page.width - MARGINS.right, footerY - 15)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    // Gauche : Infirmière
    if (user && user.full_name) {
      doc.fontSize(8)
        .fillColor(COLORS.textMuted)
        .font(FONTS.body)
        .text(`Généré par ${user.full_name}`, MARGINS.left, footerY - 5);
    }

    // Centre : Page
    doc.fontSize(8)
      .fillColor(COLORS.textMuted)
      .text(`Page ${i - startPage + 1} / ${pageCount}`, MARGINS.left, footerY - 5, {
        width: contentWidth,
        align: 'center'
      });

    // Droite : KadduCare
    doc.fontSize(8)
      .fillColor(COLORS.primary)
      .font(FONTS.subtitle)
      .text('KadduCare', MARGINS.left, footerY - 5, {
        width: contentWidth,
        align: 'right'
      });
  }
}

// ============================================================================
// MAIN GENERATOR
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
    if (!patient || !patient.full_name) {
      throw new Error('Données patient incomplètes : full_name requis');
    }

    const patientFromDB = patient || {};
    const patientFromAI = structuredJson?.patient || {};

    const isValidValue = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    };

    const patientData = {
      full_name: (isValidValue(patientFromAI.full_name) && patientFromAI.full_name.trim() !== 'Patient non identifié')
        ? patientFromAI.full_name.trim()
        : (isValidValue(patientFromDB.full_name) && patientFromDB.full_name.trim() !== 'Patient non identifié')
          ? patientFromDB.full_name.trim()
          : 'Patient Inconnu',
      age: isValidValue(patientFromAI.age)
        ? patientFromAI.age.trim()
        : (patientFromDB.dob ? calculateAge(patientFromDB.dob) : null),
      gender: isValidValue(patientFromAI.gender)
        ? patientFromAI.gender.trim()
        : (isValidValue(patientFromDB.gender) ? patientFromDB.gender : null),
      room_number: isValidValue(patientFromAI.room_number)
        ? patientFromAI.room_number.trim()
        : (isValidValue(patientFromDB.room_number) ? patientFromDB.room_number : null),
      unit: isValidValue(patientFromAI.unit)
        ? patientFromAI.unit.trim()
        : (isValidValue(patientFromDB.unit) ? patientFromDB.unit : null)
    };

    const soapie = structuredJson?.soapie || {};
    const dateTime = recordedAt || createdAt || new Date();

    console.log('📄 Génération PDF KadduCare Premium pour:', patientData.full_name);

    const tempDir = os.tmpdir();
    const sanitizedName = patientData.full_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const dateStr = new Date().toISOString().replace(/[-:]/g, '').substring(0, 15);
    const fileName = `${sanitizedName}-${dateStr}-kadducare.pdf`;
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
    renderHeader(doc, recordedAt, createdAt, contentWidth);

    // 2. Patient Card
    renderPatientCard(doc, patientData, patientId, noteId, contentWidth);

    // 3. SOAPIE Sections
    if (!isEmpty(soapie.S)) renderSection(doc, 'S', soapie.S, contentWidth);
    if (soapie.O && typeof soapie.O === 'object') renderObjectiveSection(doc, soapie.O, contentWidth);
    if (!isEmpty(soapie.A)) renderSection(doc, 'A', soapie.A, contentWidth);
    if (Array.isArray(soapie.I) && soapie.I.length > 0) renderSection(doc, 'I', soapie.I, contentWidth);
    if (!isEmpty(soapie.E)) renderSection(doc, 'E', soapie.E, contentWidth);
    if (!isEmpty(soapie.P)) renderSection(doc, 'P', soapie.P, contentWidth);

    // 4. Footer
    renderFooter(doc, user, dateTime);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    throw error;
  }
}

module.exports = { generatePDF };
