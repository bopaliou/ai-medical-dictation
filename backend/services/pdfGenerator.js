/**
 * Service de génération PDF médical KadduCare
 * Design "Silicon Valley" - Clean, Modern, Purposeful.
 * 
 * DESIGN SYSTEM:
 * - Font: Helvetica (Standard)
 * - Colors: Royal Blue (#258bef), Medical Green (#22c55e), Slate (#1e293b, #64748b)
 * - Layout: Invisible 12-column grid, ample whitespace
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// DESIGN CONFIGURATION
// ============================================================================

const CONFIG = {
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  width: 595.28, // A4 width in points
  height: 841.89, // A4 height in points
};

const COLORS = {
  primary: '#258bef',       // Royal Blue - Headers, Actions
  success: '#22c55e',       // Medical Green - Vitals, Plans
  text: {
    dark: '#1e293b',        // Slate 800 - Main Content
    base: '#334155',        // Slate 700 - Body Text
    light: '#64748b',       // Slate 500 - Metadata, Labels
    muted: '#94a3b8',       // Slate 400 - Footers
  },
  bg: {
    light: '#f8fafc',       // Slate 50 - Subtle Backgrounds
    white: '#ffffff',       // Pure White
  },
  border: '#e2e8f0',        // Slate 200 - Dividers
  sections: {
    S: '#258bef', // Subjectif (Blue)
    O: '#258bef', // Objectif (Blue)
    A: '#8b5cf6', // Analyse (Purple)
    P: '#22c55e', // Plan (Green)
    I: '#0ea5e9', // Intervention (Sky)
    E: '#64748b', // Evaluation (Slate)
  }
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  // Sizes
  xs: 8,
  sm: 9,
  base: 10,
  lg: 12,
  xl: 14,
  xxl: 22,
};

// ============================================================================
// UTILITIES
// ============================================================================

function safe(val) {
  if (val === null || val === undefined) return 'Non renseigné';
  if (typeof val === 'string' && val.trim() === '') return 'Non renseigné';
  return String(val).trim();
}

function isEmpty(val) {
  if (!val) return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === 'object' && Object.keys(val).length === 0) return true;
  return String(val).trim() === '';
}

function calculateAge(dob) {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " ans";
  } catch { return null; }
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });
}

// Ensure space for content, adding a page if needed
function ensureSpace(doc, height) {
  if (doc.y + height > CONFIG.height - CONFIG.margins.bottom) {
    doc.addPage();
    return true; // New page added
  }
  return false;
}

// ============================================================================
// RENDERING HELPERS (The "Engine" of the Design)
// ============================================================================

/**
 * Draws a clean, modern "Pill" tag
 */
function drawPill(doc, text, x, y, color = COLORS.primary) {
  doc.font(FONTS.bold).fontSize(FONTS.xs);
  const textWidth = doc.widthOfString(text);
  const paddingX = 8;
  const paddingY = 4;
  const height = FONTS.xs + paddingY * 2;
  const width = textWidth + paddingX * 2;

  // Background
  doc.roundedRect(x, y, width, height, height / 2) // Fully rounded
    .fillColor(color)
    .fillOpacity(0.1) // Subtle background
    .fill();

  doc.fillOpacity(1); // Reset opacity for text

  // Text
  doc.fillColor(color)
    .text(text, x + paddingX, y + paddingY + 1); // +1 mostly for vertical centering optical adjustment

  return { width, height };
}

/**
 * Draws a section header with a thin modern vertical bar
 */
function renderSectionHeader(doc, letter, title, color) {
  ensureSpace(doc, 40);

  const startY = doc.y + 10;

  // Thin vertical bar
  doc.rect(CONFIG.margins.left, startY, 2, 16)
    .fillColor(color)
    .fill();

  // Letter Code
  doc.font(FONTS.bold).fontSize(FONTS.lg)
    .fillColor(color)
    .text(letter, CONFIG.margins.left + 10, startY + 2);

  // Title
  doc.font(FONTS.bold).fontSize(FONTS.lg)
    .fillColor(COLORS.text.dark)
    .text(title, CONFIG.margins.left + 30, startY + 2);

  doc.y = startY + 30; // Margin after header
}

// ============================================================================
// COMPONENT RENDERERS
// ============================================================================

function renderHeader(doc, recordedAt, createdAt) {
  const contentWidth = CONFIG.width - CONFIG.margins.left - CONFIG.margins.right;
  const y = CONFIG.margins.top;

  // 1. Logo Logic
  const possiblePaths = [
    path.join(__dirname, '../../mobile/mobile-app/assets/images/logo-kadducare.png'),
    path.join(process.cwd(), 'mobile/mobile-app/assets/images/logo-kadducare.png'),
    // Fallback if needed
  ];
  let logoPath = possiblePaths.find(p => fs.existsSync(p));

  if (logoPath) {
    doc.image(logoPath, CONFIG.margins.left, y, { width: 32, height: 32 });
  }

  // 2. Brand Name
  doc.font(FONTS.bold).fontSize(FONTS.xxl)
    .fillColor(COLORS.text.dark)
    .text('KadduCare', CONFIG.margins.left + (logoPath ? 42 : 0), y - 2, { characterSpacing: -0.5 }); // Tighter spacing

  // 3. Document Badge (Right Aligned)
  const badgeText = "RAPPORT MÉDICAL";
  doc.font(FONTS.bold).fontSize(FONTS.xs);
  const badgeWidth = doc.widthOfString(badgeText) + 20;
  const badgeX = CONFIG.width - CONFIG.margins.right - badgeWidth;

  drawPill(doc, badgeText, badgeX, y + 4, COLORS.text.dark);

  // 4. Metadata Line (Date)
  doc.y = y + 40;
  const dateStr = formatDate(recordedAt || createdAt);
  const timeStr = formatTime(recordedAt || createdAt);

  doc.font(FONTS.regular).fontSize(FONTS.sm)
    .fillColor(COLORS.text.light)
    .text(`${dateStr} à ${timeStr}`, CONFIG.margins.left, doc.y);

  // 5. Divider
  doc.moveTo(CONFIG.margins.left, doc.y + 15)
    .lineTo(CONFIG.width - CONFIG.margins.right, doc.y + 15)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  doc.y += 30;
}

function renderPatientInfo(doc, patient) {
  const startY = doc.y;
  const colWidth = (CONFIG.width - CONFIG.margins.left - CONFIG.margins.right) / 4;

  // Helper to draw a data point
  const drawStat = (label, value, colIndex) => {
    const x = CONFIG.margins.left + (colIndex * colWidth);

    doc.font(FONTS.bold).fontSize(FONTS.xs)
      .fillColor(COLORS.text.light)
      .text(label.toUpperCase(), x, startY);

    doc.font(FONTS.bold).fontSize(FONTS.lg)
      .fillColor(COLORS.text.dark)
      .text(value, x, startY + 14);
  };

  const name = safe(patient.full_name);
  const age = safe(patient.age || calculateAge(patient.dob)); // Fallback
  const gender = safe(patient.gender);
  const location = patient.unit
    ? `${patient.unit}${patient.room_number ? ` / ${patient.room_number}` : ''}`
    : safe(patient.room_number);

  drawStat("PATIENT", name, 0);
  drawStat("ÂGE", age, 1.5); // Offset column
  drawStat("SEXE", gender, 2.2);
  drawStat("SERVICE", location, 3);

  doc.y = startY + 45; // Space after patient info
}

function renderVitals(doc, vitals) {
  if (isEmpty(vitals)) return;

  renderSectionHeader(doc, 'O', 'Signes Vitaux & Objectif', COLORS.sections.O);

  const contentWidth = CONFIG.width - CONFIG.margins.left - CONFIG.margins.right;
  const rowHeight = 24;

  // Table Header (Minimal)
  // No drawn header, just list

  const items = [
    { label: "Tension Artérielle", value: vitals.blood_pressure, unit: "mmHg" },
    { label: "Fréquence Cardiaque", value: vitals.heart_rate, unit: "bpm" },
    { label: "Fréquence Respiratoire", value: vitals.respiratory_rate, unit: "rpm" },
    { label: "Température", value: vitals.temperature, unit: "°C" },
    { label: "SpO2", value: vitals.spo2, unit: "%" },
    { label: "Glycémie", value: vitals.glycemia, unit: "g/L" },
  ];

  const validItems = items.filter(i => !isEmpty(i.value));

  if (validItems.length === 0) {
    doc.font(FONTS.regular).fontSize(FONTS.base)
      .fillColor(COLORS.text.light)
      .text("Aucun signe vital enregistré.", CONFIG.margins.left);
    doc.y += 20;
    return;
  }

  // Draw Grid
  validItems.forEach(item => {
    const y = doc.y;

    // Label
    doc.font(FONTS.regular).fontSize(FONTS.base)
      .fillColor(COLORS.text.base)
      .text(item.label, CONFIG.margins.left, y + 6);

    // Value (Right Aligned)
    const valueText = `${item.value} ${item.unit}`;
    doc.font(FONTS.bold).fontSize(FONTS.base)
      .fillColor(COLORS.text.dark)
      .text(valueText, CONFIG.margins.left, y + 6, {
        align: 'right',
        width: contentWidth
      });

    // Divider
    doc.moveTo(CONFIG.margins.left, y + rowHeight)
      .lineTo(CONFIG.width - CONFIG.margins.right, y + rowHeight)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    doc.y += rowHeight;
  });

  doc.y += 20; // Margin after vitals

  // Exam Note if exists
  if (vitals.exam && !isEmpty(vitals.exam)) {
    doc.font(FONTS.bold).fontSize(FONTS.sm)
      .fillColor(COLORS.text.light)
      .text("EXAMEN PHYSIQUE", CONFIG.margins.left, doc.y);

    doc.moveDown(0.5);
    doc.font(FONTS.regular).fontSize(FONTS.base)
      .fillColor(COLORS.text.base)
      .text(vitals.exam, { align: 'justify', lineGap: 4 });

    doc.y += 20;
  }
}

function renderTextSection(doc, letter, title, content, color) {
  if (isEmpty(content)) return;

  renderSectionHeader(doc, letter, title, color);

  doc.font(FONTS.regular).fontSize(FONTS.base)
    .fillColor(COLORS.text.base)
    .text(Array.isArray(content) ? content.join('\n') : content, {
      align: 'justify',
      lineGap: 4
    });

  doc.y += 20;
}

function renderListSection(doc, letter, title, items, color, type = 'bullet') {
  if (isEmpty(items)) return;
  const list = Array.isArray(items) ? items : [items];
  if (list.length === 0) return;

  renderSectionHeader(doc, letter, title, color);

  list.forEach(item => {
    if (type === 'pill') {
      // Just list them roughly? No, renderList usually expects lines.
      // Let's stick to bullets for Plans/Interventions as they are often sentences
    }

    const startY = doc.y;

    // Custom Bullet
    if (type === 'check') {
      doc.font(FONTS.bold).fontSize(FONTS.base).fillColor(COLORS.success).text("✓", CONFIG.margins.left, startY);
    } else {
      doc.circle(CONFIG.margins.left + 3, startY + 6, 2).fillColor(color).fill();
    }

    // Text
    doc.font(FONTS.regular).fontSize(FONTS.base)
      .fillColor(COLORS.text.base)
      .text(item, CONFIG.margins.left + 15, startY, {
        width: CONFIG.width - CONFIG.margins.left - CONFIG.margins.right - 15,
        lineGap: 4
      });

    doc.y += 6; // item gap
  });

  doc.y += 20;
}

function renderFooter(doc, user) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    const bottomY = CONFIG.height - CONFIG.margins.bottom + 20;

    doc.moveTo(CONFIG.margins.left, bottomY - 10)
      .lineTo(CONFIG.width - CONFIG.margins.right, bottomY - 10)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    doc.font(FONTS.regular).fontSize(FONTS.xs)
      .fillColor(COLORS.text.muted)
      .text("Généré par KadduCare AI", CONFIG.margins.left, bottomY);

    if (user && user.full_name) {
      doc.text(`Praticien: ${user.full_name}`, CONFIG.margins.left, bottomY, {
        align: 'right',
        width: CONFIG.width - CONFIG.margins.left - CONFIG.margins.right
      });
    }

    doc.text(`${i + 1} / ${pages.count}`, CONFIG.margins.left, bottomY, {
      align: 'center',
      width: CONFIG.width - CONFIG.margins.left - CONFIG.margins.right
    });
  }
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generatePDF({
  patient,
  structuredJson,
  recordedAt,
  createdAt,
  user
}) {
  return new Promise((resolve, reject) => {
    try {
      if (!structuredJson || !structuredJson.soapie) {
        throw new Error("Données structurées manquantes");
      }

      const soapie = structuredJson.soapie;
      const patientData = { ...patient, ...structuredJson.patient };

      const tempDir = os.tmpdir();
      const fileName = `KADDU-${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margins: CONFIG.margins,
        bufferPages: true,
        autoFirstPage: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // 1. Header
      renderHeader(doc, recordedAt, createdAt);

      // 2. Patient
      renderPatientInfo(doc, patientData);

      // 3. SOAPIE Body
      renderTextSection(doc, 'S', 'Subjectif', soapie.S, COLORS.sections.S);

      // 4. Objectif (Special Handling)
      if (soapie.O) {
        renderVitals(doc, soapie.O);
        // Note: Exam physique handled inside renderVitals for O section context
      }

      renderTextSection(doc, 'A', 'Analyse', soapie.A, COLORS.sections.A);
      renderListSection(doc, 'P', 'Plan de Soins', soapie.P, COLORS.sections.P, 'check');
      renderListSection(doc, 'I', 'Interventions', soapie.I, COLORS.sections.I, 'bullet');
      renderTextSection(doc, 'E', 'Évaluation', soapie.E, COLORS.sections.E);

      // 5. Footer
      renderFooter(doc, user);

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', (err) => reject(err));

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDF };
