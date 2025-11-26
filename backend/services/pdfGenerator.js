/**
 * Service de génération PDF médical premium
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
  top: 60,      // Marge supérieure pour header
  bottom: 60,   // Marge inférieure pour footer
  left: 50,     // Marge gauche large (1.7cm)
  right: 50     // Marge droite large (1.7cm)
};

const COLORS = {
  // Palette médicale moderne
  primary: '#0A84FF',           // Bleu médical moderne
  primaryDark: '#0051D5',       // Bleu foncé pour contrastes
  success: '#34C759',           // Vert validation
  text: '#1C1C1E',              // Noir doux (iOS)
  textSecondary: '#4A4A4A',     // Sous-texte
  textMuted: '#8E8E93',         // Texte discret
  background: '#F2F2F2',        // Gris chaud
  backgroundCard: '#FFFFFF',    // Fond blanc cartes
  backgroundAlt: '#FAFAFA',      // Fond alterné
  border: '#E5E5E5',            // Bordure fine
  borderLight: '#F0F0F0',        // Bordure très légère
  white: '#FFFFFF',
  
  // Couleurs par section SOAPIE (pastels élégants)
  section: {
    s: '#E8F4FD',                // Bleu très clair Subjectif
    o: '#F0F9FF',                // Bleu ciel Objectif
    a: '#FFF4E6',                // Orange très clair Analyse
    i: '#F0FDF4',                // Vert très clair Intervention
    e: '#F5F3FF',                // Violet très clair Évaluation
    p: '#FEF3C7'                 // Jaune très clair Plan
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

const SECTION_DESCRIPTIONS = {
  S: 'Symptômes et observations rapportés par le patient',
  O: 'Données objectives mesurées et observées',
  A: 'Analyse clinique et évaluation',
  I: 'Interventions et soins prodigués',
  E: 'Évaluation de la réponse aux interventions',
  P: 'Plan de soins et recommandations'
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Sécurise une valeur et retourne "Non renseigné" si vide
 */
function safeValue(value) {
  if (value === null || value === undefined) return 'Non renseigné';
  if (typeof value === 'string' && value.trim() === '') return 'Non renseigné';
  if (typeof value === 'object' && Object.keys(value).length === 0) return 'Non renseigné';
  if (Array.isArray(value) && value.length === 0) return 'Non renseigné';
  return String(value).trim();
}

/**
 * Vérifie si une valeur est vide
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Calcule l'âge depuis une date de naissance
 */
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

/**
 * Formate une date en français
 */
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

/**
 * Formate une heure en français
 */
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

/**
 * Vérifie et gère les sauts de page
 */
function ensurePageSpace(doc, requiredHeight) {
  const remainingHeight = doc.page.height - doc.y - MARGINS.bottom;
  if (remainingHeight < requiredHeight) {
    doc.addPage();
    doc.y = MARGINS.top;
  }
}

// ============================================================================
// HEADER PROFESSIONNEL
// ============================================================================

/**
 * Rend le header premium avec logo et informations
 */
function renderHeader(doc, recordedAt, createdAt, contentWidth) {
  const headerHeight = 90;
  const dateTime = recordedAt || createdAt || new Date();
  
  // Bandeau principal bleu médical
  doc.rect(0, 0, doc.page.width, headerHeight)
     .fillColor(COLORS.primary)
     .fill();
  
  // Logo/Titre de l'application (à gauche)
  doc.fontSize(18)
     .fillColor(COLORS.white)
     .font(FONTS.title)
     .text('AI Medical Dictation', MARGINS.left, 25, {
       width: contentWidth * 0.6,
       align: 'left'
     });
  
  // Sous-titre
  doc.fontSize(11)
     .fillColor(COLORS.white)
     .font(FONTS.body)
     .opacity(0.9)
     .text('Rapport infirmier – Format SOAPIE', MARGINS.left, 48, {
       width: contentWidth * 0.6,
       align: 'left'
     })
     .opacity(1);
  
  // Date et heure (à droite)
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .font(FONTS.body)
     .text(formatDate(dateTime), doc.page.width - MARGINS.right - 200, 30, {
       width: 200,
       align: 'right'
     })
     .text(formatTime(dateTime), doc.page.width - MARGINS.right - 200, 50, {
       width: 200,
       align: 'right'
     });
  
  // Ligne séparatrice fine
  doc.moveTo(MARGINS.left, headerHeight - 2)
     .lineTo(doc.page.width - MARGINS.right, headerHeight - 2)
     .strokeColor(COLORS.white)
     .opacity(0.3)
     .lineWidth(0.5)
     .stroke()
     .opacity(1);
  
  doc.y = headerHeight + 30;
}

// ============================================================================
// CARTE PATIENT MODERNE
// ============================================================================

/**
 * Rend la carte patient avec grille 2 colonnes
 */
function renderPatientCard(doc, patientData, patientId, noteId, contentWidth) {
  ensurePageSpace(doc, 130);
  
  const cardY = doc.y;
  const cardHeight = 120;
  const padding = 20;
  const columnWidth = (contentWidth - padding * 3) / 2;
  
  // Fond de la carte avec coins arrondis
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 8)
     .fillColor(COLORS.backgroundCard)
     .fill()
     .strokeColor(COLORS.border)
     .lineWidth(0.5)
     .stroke();
  
  // Titre de section
  doc.fontSize(10)
     .fillColor(COLORS.textMuted)
     .font(FONTS.label)
     .text('INFORMATIONS PATIENT', MARGINS.left + padding, cardY + 16, {
       width: contentWidth,
       characterSpacing: 1.5
     });
  
  let y = cardY + 38;
  const leftX = MARGINS.left + padding;
  const rightX = MARGINS.left + padding + columnWidth + padding;
  
  // Colonne gauche
  renderPatientField(doc, 'Nom complet', safeValue(patientData.full_name), leftX, y, columnWidth);
  y += 28;
  renderPatientField(doc, 'Âge', safeValue(patientData.age), leftX, y, columnWidth);
  y += 28;
  renderPatientField(doc, 'Sexe', safeValue(patientData.gender), leftX, y, columnWidth);
  
  // Colonne droite
  y = cardY + 38;
  renderPatientField(doc, 'Chambre', safeValue(patientData.room_number), rightX, y, columnWidth);
  y += 28;
  renderPatientField(doc, 'Unité / Service', safeValue(patientData.unit), rightX, y, columnWidth);
  y += 28;
  if (patientId) {
    renderPatientField(doc, 'ID Patient', patientId.substring(0, 8) + '...', rightX, y, columnWidth);
  }
  
  doc.y = cardY + cardHeight + 25;
}

/**
 * Rend un champ patient (label + valeur)
 */
function renderPatientField(doc, label, value, x, y, width) {
  // Label
  doc.fontSize(9)
     .fillColor(COLORS.textMuted)
     .font(FONTS.label)
     .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.5 });
  
  // Valeur
  doc.fontSize(13)
     .fillColor(COLORS.text)
     .font(FONTS.body)
     .text(value, x, y + 12, { width });
}

// ============================================================================
// TABLEAU SIGNS VITAUX MODERNE
// ============================================================================

/**
 * Rend un tableau compact et élégant pour les signes vitaux
 */
function renderVitalsTable(doc, vitals, contentWidth) {
  if (!vitals || typeof vitals !== 'object') return;
  
  const tableY = doc.y;
  const rowHeight = 22;
  const col1Width = contentWidth * 0.5;
  const col2Width = contentWidth * 0.5;
  
  // Données du tableau
  const rows = [
    { label: 'Température', value: vitals.temperature, unit: '°C' },
    { label: 'Tension', value: vitals.blood_pressure, unit: 'cmHg' },
    { label: 'FC', value: vitals.heart_rate, unit: 'bpm' },
    { label: 'FR', value: vitals.respiratory_rate, unit: '/min' },
    { label: 'SpO₂', value: vitals.spo2, unit: '%' },
    { label: 'Glycémie', value: vitals.glycemia, unit: 'g/L' }
  ];
  
  const tableHeight = rows.length * rowHeight + 2;
  ensurePageSpace(doc, tableHeight + 20);
  
  // Fond du tableau
  doc.roundedRect(MARGINS.left, tableY, contentWidth, tableHeight, 4)
     .fillColor(COLORS.backgroundCard)
     .fill()
     .strokeColor(COLORS.border)
     .lineWidth(0.5)
     .stroke();
  
  // Lignes du tableau
  rows.forEach((row, index) => {
    const rowY = tableY + (index * rowHeight) + 1;
    
    // Fond alterné
    if (index % 2 === 0) {
      doc.rect(MARGINS.left + 1, rowY, contentWidth - 2, rowHeight)
         .fillColor(COLORS.backgroundAlt)
         .fill();
    }
    
    // Label
    doc.fontSize(10)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(row.label, MARGINS.left + 12, rowY + 6, { width: col1Width - 24 });
    
    // Valeur
    const valueText = row.value 
      ? `${row.value}${row.unit ? row.unit : ''}` 
      : 'Non renseigné';
    
    doc.fontSize(10)
       .fillColor(row.value ? COLORS.text : COLORS.textMuted)
       .font(row.value ? FONTS.monospace : FONTS.body)
       .text(valueText, MARGINS.left + col1Width + 12, rowY + 6, { 
         width: col2Width - 24,
         align: 'right'
       });
    
    // Ligne séparatrice
    if (index < rows.length - 1) {
      doc.moveTo(MARGINS.left + 12, rowY + rowHeight)
         .lineTo(MARGINS.left + contentWidth - 12, rowY + rowHeight)
         .strokeColor(COLORS.borderLight)
         .lineWidth(0.5)
         .stroke();
    }
  });
  
  doc.y = tableY + tableHeight + 15;
}

// ============================================================================
// SECTIONS SOAPIE AVEC CARTES ÉLÉGANTES
// ============================================================================

/**
 * Rend une section SOAPIE avec carte moderne
 */
function renderSection(doc, letter, content, contentWidth) {
  if (isEmpty(content)) return;
  
  const title = SECTION_TITLES[letter] || letter;
  const description = SECTION_DESCRIPTIONS[letter] || '';
  const sectionColor = COLORS.section[letter.toLowerCase()] || COLORS.backgroundAlt;
  
  // Estimation de la hauteur
  const estimatedHeight = Array.isArray(content) 
    ? content.length * 18 + 100 
    : String(content).split('\n').length * 16 + 100;
  
  ensurePageSpace(doc, estimatedHeight);
  
  const cardY = doc.y;
  const padding = 20;
  let cardHeight = 80;
  
  // Barre latérale colorée
  doc.rect(MARGINS.left, cardY, 4, cardHeight)
     .fillColor(COLORS.primary)
       .fill();

  // Fond de la carte
  doc.roundedRect(MARGINS.left + 4, cardY, contentWidth - 4, cardHeight, 6)
     .fillColor(COLORS.backgroundCard)
     .fill()
     .strokeColor(COLORS.border)
     .lineWidth(0.5)
     .stroke();
  
  // Titre de section
  doc.fontSize(16)
     .fillColor(COLORS.primary)
     .font(FONTS.title)
     .text(title, MARGINS.left + padding + 4, cardY + 18, {
       width: contentWidth - padding * 2 - 4
     });
  
  // Description (optionnelle, discrète)
  if (description) {
    doc.fontSize(9)
       .fillColor(COLORS.textMuted)
       .font(FONTS.body)
       .text(description, MARGINS.left + padding + 4, cardY + 40, {
         width: contentWidth - padding * 2 - 4
       });
  }
  
  // Contenu
  let contentY = cardY + 60;
  if (Array.isArray(content)) {
    content.forEach((item, index) => {
      if (item && String(item).trim()) {
        doc.fontSize(11)
           .fillColor(COLORS.text)
           .font(FONTS.body)
           .text(`• ${String(item).trim()}`, MARGINS.left + padding + 4, contentY, {
             width: contentWidth - padding * 2 - 8 - 4,
             lineGap: 2
           });
        contentY = doc.y + 4;
      }
    });
  } else {
    doc.fontSize(11)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(String(content), MARGINS.left + padding + 4, contentY, {
         width: contentWidth - padding * 2 - 8 - 4,
         lineGap: 3,
         align: 'justify'
       });
  }
  
  // Ajuster la hauteur de la carte
  cardHeight = Math.max(cardHeight, doc.y - cardY + 15);
  
  // Redessiner la carte avec la bonne hauteur
  doc.rect(MARGINS.left, cardY, 4, cardHeight)
     .fillColor(COLORS.primary)
     .fill();
  
  doc.roundedRect(MARGINS.left + 4, cardY, contentWidth - 4, cardHeight, 6)
     .fillColor(COLORS.backgroundCard)
       .fill()
     .strokeColor(COLORS.border)
     .lineWidth(0.5)
       .stroke();

  doc.y = cardY + cardHeight + 20;
}

/**
 * Rend la section Objectif complète avec sous-sections
 */
function renderObjectiveSection(doc, objective, contentWidth) {
  if (!objective || typeof objective !== 'object') return;
  
  const hasVitals = objective.vitals && Object.keys(objective.vitals).some(k => objective.vitals[k]);
  const hasExam = !isEmpty(objective.exam);
  const hasLabs = !isEmpty(objective.labs);
  const hasMedications = Array.isArray(objective.medications) && objective.medications.length > 0;
  
  if (!hasVitals && !hasExam && !hasLabs && !hasMedications) return;
  
  // Titre de section O
  ensurePageSpace(doc, 300);
  renderSectionTitle(doc, 'O', SECTION_TITLES.O, contentWidth);
  
  // Signes vitaux (tableau)
  if (hasVitals) {
    renderVitalsTable(doc, objective.vitals, contentWidth);
  }
  
  // Examen physique
  if (hasExam) {
    doc.fontSize(12)
       .fillColor(COLORS.text)
       .font(FONTS.subtitle)
       .text('Examen physique', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 8;
    
      doc.fontSize(11)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(safeValue(objective.exam), MARGINS.left, doc.y, {
         width: contentWidth,
         lineGap: 3,
         align: 'justify'
       });
    doc.y += 20;
  }
  
  // Laboratoires
  if (hasLabs) {
    doc.fontSize(12)
       .fillColor(COLORS.text)
       .font(FONTS.subtitle)
       .text('Résultats de laboratoire', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 8;
    
      doc.fontSize(11)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(safeValue(objective.labs), MARGINS.left, doc.y, {
         width: contentWidth,
         lineGap: 3,
         align: 'justify'
       });
    doc.y += 20;
  }
  
  // Médicaments
  if (hasMedications) {
    doc.fontSize(12)
       .fillColor(COLORS.text)
       .font(FONTS.subtitle)
       .text('Médicaments', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 8;
    
    objective.medications.forEach((med) => {
      if (med && String(med).trim()) {
      doc.fontSize(11)
           .fillColor(COLORS.text)
           .font(FONTS.body)
           .text(`• ${String(med).trim()}`, MARGINS.left, doc.y, {
             width: contentWidth,
             lineGap: 2
           });
        doc.y += 16;
      }
    });
  }
  
  doc.y += 15;
}

/**
 * Rend le titre d'une section avec style moderne
 */
function renderSectionTitle(doc, letter, title, contentWidth) {
  doc.fontSize(20)
     .fillColor(COLORS.primary)
     .font(FONTS.title)
     .text(title, MARGINS.left, doc.y, { width: contentWidth });
  
  doc.moveTo(MARGINS.left, doc.y + 8)
     .lineTo(MARGINS.left + 60, doc.y + 8)
     .strokeColor(COLORS.primary)
     .lineWidth(2)
     .stroke();
  
  doc.y += 25;
}

// ============================================================================
// FOOTER PROFESSIONNEL
// ============================================================================

/**
 * Rend le footer avec pagination et mentions
 */
function renderFooter(doc, user, dateTime) {
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  const startPage = pageRange.start || 0;
  const contentWidth = doc.page.width - MARGINS.left - MARGINS.right;
  
  for (let i = startPage; i < startPage + pageCount; i++) {
    doc.switchToPage(i);
    
    const footerY = doc.page.height - MARGINS.bottom + 10;
    
    // Ligne séparatrice
    doc.moveTo(MARGINS.left, footerY - 20)
       .lineTo(doc.page.width - MARGINS.right, footerY - 20)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    // Infirmière
    if (user && user.full_name) {
      doc.fontSize(9)
         .fillColor(COLORS.textMuted)
         .font(FONTS.body)
         .text(`Infirmière : ${user.full_name}`, MARGINS.left, footerY - 10, {
           width: contentWidth * 0.5
         });
    }
    
    // Date de génération
    doc.fontSize(9)
       .fillColor(COLORS.textMuted)
       .font(FONTS.body)
       .text(`Généré le ${formatDate(dateTime)} à ${formatTime(dateTime)}`, 
         doc.page.width - MARGINS.right - 200, footerY - 10, {
         width: 200,
         align: 'right'
       });
    
    // Pagination
    const pageNumber = i - startPage + 1;
    doc.fontSize(9)
       .fillColor(COLORS.textMuted)
       .font(FONTS.body)
       .text(`Page ${pageNumber} / ${pageCount}`, 
         doc.page.width / 2 - 30, footerY - 10, {
         width: 60,
         align: 'center'
       });
    
    // Mention légale
    doc.fontSize(8)
       .fillColor(COLORS.textMuted)
       .font(FONTS.body)
       .opacity(0.7)
       .text('Document généré automatiquement – AI Medical Dictation', 
         MARGINS.left, footerY + 5, {
         width: contentWidth,
         align: 'center'
       })
       .opacity(1);
  }
}

// ============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION
// ============================================================================

/**
 * Génère un PDF professionnel au format SOAPIE
 * @param {Object} options - Options de génération
 * @param {Object} options.patient - Données du patient
 * @param {string} options.transcriptionText - Texte de transcription
 * @param {Object} options.structuredJson - Données structurées SOAPIE
 * @param {Date} options.recordedAt - Date d'enregistrement
 * @param {Date} options.createdAt - Date de création
 * @param {Object} options.user - Informations de l'utilisateur
 * @param {string} options.mode - Mode de génération (complet/minimal)
 * @param {string} options.noteId - ID de la note
 * @param {string} options.patientId - ID du patient
 * @returns {Promise<string>} - Chemin du fichier PDF généré
 */
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
    // Validation des données
    if (!patient || !patient.full_name) {
      throw new Error('Données patient incomplètes : full_name requis');
    }
    
    // Préparation des données patient
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
    
    // Extraction des données SOAPIE
    const soapie = structuredJson?.soapie || {};
    const dateTime = recordedAt || createdAt || new Date();
    
    console.log('📄 Génération PDF premium');
    console.log('   Patient:', patientData.full_name);
    console.log('   Sections SOAPIE:', {
      S: !isEmpty(soapie.S),
      O: !isEmpty(soapie.O),
      A: !isEmpty(soapie.A),
      I: Array.isArray(soapie.I) && soapie.I.length > 0,
      E: !isEmpty(soapie.E),
      P: !isEmpty(soapie.P)
    });
    
    // Création du fichier temporaire
    const tempDir = os.tmpdir();
    const sanitizedName = patientData.full_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const dateStr = new Date().toISOString().replace(/[-:]/g, '').substring(0, 15);
    const fileName = `${sanitizedName}-${dateStr}-note.pdf`;
    const filePath = path.join(tempDir, fileName);
    
    // Création du document PDF A4
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    
    // Stream vers le fichier
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Calcul de la largeur du contenu
    const contentWidth = doc.page.width - MARGINS.left - MARGINS.right;
    
    // ========== HEADER ==========
    renderHeader(doc, recordedAt, createdAt, contentWidth);
    
    // ========== CARTE PATIENT ==========
    renderPatientCard(doc, patientData, patientId, noteId, contentWidth);
    
    // ========== SECTIONS SOAPIE ==========
    
    // Section S — Subjectif
    if (!isEmpty(soapie.S)) {
      renderSection(doc, 'S', soapie.S, contentWidth);
    }
    
    // Section O — Objectif
    if (soapie.O && typeof soapie.O === 'object') {
      renderObjectiveSection(doc, soapie.O, contentWidth);
      }
      
      // Section A — Analyse
    if (!isEmpty(soapie.A)) {
      renderSection(doc, 'A', soapie.A, contentWidth);
      }
      
      // Section I — Intervention
      if (Array.isArray(soapie.I) && soapie.I.length > 0) {
      renderSection(doc, 'I', soapie.I, contentWidth);
      }
      
      // Section E — Évaluation
    if (!isEmpty(soapie.E)) {
      renderSection(doc, 'E', soapie.E, contentWidth);
      }
      
      // Section P — Plan
    if (!isEmpty(soapie.P)) {
      renderSection(doc, 'P', soapie.P, contentWidth);
    }
    
    // ========== FOOTER ==========
    renderFooter(doc, user, dateTime);

    // Finalisation du PDF
    doc.end();

    // Attente de l'écriture du fichier
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        try {
          const stats = fs.statSync(filePath);
          const fileSizeInKB = stats.size / 1024;

          console.log(`✅ PDF premium généré: ${filePath} (${fileSizeInKB.toFixed(2)} KB)`);
          resolve(filePath);
        } catch (error) {
          reject(new Error(`Erreur lors de la vérification du PDF: ${error.message}`));
        }
      });

      stream.on('error', (error) => {
        reject(new Error(`Erreur lors de la génération du PDF: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur de génération PDF: ${error.message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generatePDF
};
