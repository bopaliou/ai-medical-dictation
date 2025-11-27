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
  top: 50,      // Marge supérieure pour header (réduite)
  bottom: 40,   // Marge inférieure pour footer (réduite)
  left: 40,     // Marge gauche (réduite)
  right: 40     // Marge droite (réduite)
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
  const headerHeight = 65; // Réduit de 90 à 65
  const dateTime = recordedAt || createdAt || new Date();
  
  // Bandeau principal bleu médical
  doc.rect(0, 0, doc.page.width, headerHeight)
     .fillColor(COLORS.primary)
     .fill();
  
  // Logo/Titre de l'application (à gauche)
  doc.fontSize(16) // Réduit de 18 à 16
     .fillColor(COLORS.white)
     .font(FONTS.title)
     .text('AI Medical Dictation', MARGINS.left, 18, {
       width: contentWidth * 0.6,
       align: 'left'
     });
  
  // Sous-titre
  doc.fontSize(10) // Réduit de 11 à 10
     .fillColor(COLORS.white)
     .font(FONTS.body)
     .opacity(0.9)
     .text('Rapport infirmier – Format SOAPIE', MARGINS.left, 38, {
       width: contentWidth * 0.6,
       align: 'left'
     })
     .opacity(1);
  
  // Date et heure (à droite)
  doc.fontSize(9) // Réduit de 10 à 9
     .fillColor(COLORS.white)
     .font(FONTS.body)
     .text(formatDate(dateTime), doc.page.width - MARGINS.right - 200, 20, {
       width: 200,
       align: 'right'
     })
     .text(formatTime(dateTime), doc.page.width - MARGINS.right - 200, 38, {
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
  
  doc.y = headerHeight + 20; // Réduit de 30 à 20
}

// ============================================================================
// CARTE PATIENT MODERNE
// ============================================================================

/**
 * Rend la carte patient avec grille 2 colonnes
 */
function renderPatientCard(doc, patientData, patientId, noteId, contentWidth) {
  ensurePageSpace(doc, 100); // Réduit de 130 à 100
  
  const cardY = doc.y;
  const padding = 15; // Réduit de 20 à 15
  const columnWidth = (contentWidth - padding * 3) / 2;
  
  // Compter les champs non vides
  const fields = [];
  if (!isEmpty(patientData.full_name) && safeValue(patientData.full_name) !== 'Non renseigné') {
    fields.push({ label: 'Nom complet', value: patientData.full_name, side: 'left' });
  }
  if (!isEmpty(patientData.age) && safeValue(patientData.age) !== 'Non renseigné') {
    fields.push({ label: 'Âge', value: patientData.age, side: 'left' });
  }
  if (!isEmpty(patientData.gender) && safeValue(patientData.gender) !== 'Non renseigné') {
    fields.push({ label: 'Sexe', value: patientData.gender, side: 'left' });
  }
  if (!isEmpty(patientData.room_number) && safeValue(patientData.room_number) !== 'Non renseigné') {
    fields.push({ label: 'Chambre', value: patientData.room_number, side: 'right' });
  }
  if (!isEmpty(patientData.unit) && safeValue(patientData.unit) !== 'Non renseigné') {
    fields.push({ label: 'Unité / Service', value: patientData.unit, side: 'right' });
  }
  
  if (fields.length === 0) return; // Ne pas afficher si aucun champ
  
  const cardHeight = Math.max(80, Math.ceil(fields.length / 2) * 24 + 35); // Hauteur dynamique
  
  // Fond de la carte avec coins arrondis
  doc.roundedRect(MARGINS.left, cardY, contentWidth, cardHeight, 6)
     .fillColor(COLORS.backgroundCard)
     .fill()
     .strokeColor(COLORS.border)
     .lineWidth(1) // Augmenté de 0.5 à 1 pour plus de visibilité
     .stroke();
  
  // Titre de section
  doc.fontSize(11) // Augmenté de 10 à 11
     .fillColor(COLORS.textMuted)
     .font(FONTS.label)
     .text('INFORMATIONS PATIENT', MARGINS.left + padding, cardY + 12, {
       width: contentWidth,
       characterSpacing: 1.5
     });
  
  let leftY = cardY + 30;
  let rightY = cardY + 30;
  const leftX = MARGINS.left + padding;
  const rightX = MARGINS.left + padding + columnWidth + padding;
  
  // Répartir les champs
  fields.forEach(field => {
    if (field.side === 'left') {
      renderPatientField(doc, field.label, field.value, leftX, leftY, columnWidth);
      leftY += 24; // Réduit de 28 à 24
    } else {
      renderPatientField(doc, field.label, field.value, rightX, rightY, columnWidth);
      rightY += 24; // Réduit de 28 à 24
  }
  });
  
  doc.y = cardY + cardHeight + 15; // Réduit de 25 à 15
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
  doc.fontSize(12) // Réduit de 13 à 12 mais toujours visible
     .fillColor(COLORS.text)
     .font(FONTS.body)
     .text(value, x, y + 11, { width }); // Réduit de 12 à 11
}

// ============================================================================
// TABLEAU SIGNS VITAUX MODERNE
// ============================================================================

/**
 * Rend un tableau compact et élégant pour les signes vitaux
 */
function renderVitalsTable(doc, vitals, contentWidth) {
  if (!vitals || typeof vitals !== 'object') return;
  
  // Filtrer uniquement les signes vitaux renseignés
  const rows = [];
  if (!isEmpty(vitals.temperature)) {
    rows.push({ label: 'Température', value: vitals.temperature, unit: '°C' });
  }
  if (!isEmpty(vitals.blood_pressure)) {
    rows.push({ label: 'Tension', value: vitals.blood_pressure, unit: 'cmHg' });
  }
  if (!isEmpty(vitals.heart_rate)) {
    rows.push({ label: 'FC', value: vitals.heart_rate, unit: 'bpm' });
  }
  if (!isEmpty(vitals.respiratory_rate)) {
    rows.push({ label: 'FR', value: vitals.respiratory_rate, unit: '/min' });
  }
  if (!isEmpty(vitals.spo2)) {
    rows.push({ label: 'SpO₂', value: vitals.spo2, unit: '%' });
  }
  if (!isEmpty(vitals.glycemia)) {
    rows.push({ label: 'Glycémie', value: vitals.glycemia, unit: 'g/L' });
  }
  
  if (rows.length === 0) return; // Ne pas afficher si aucun signe vital
  
  const tableY = doc.y;
  const rowHeight = 20; // Réduit de 22 à 20
  const col1Width = contentWidth * 0.5;
  const col2Width = contentWidth * 0.5;
  
  const tableHeight = rows.length * rowHeight + 2;
  ensurePageSpace(doc, tableHeight + 15); // Réduit de 20 à 15
  
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
    doc.fontSize(11) // Augmenté de 10 à 11
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(row.label, MARGINS.left + 12, rowY + 5, { width: col1Width - 24 });
    
    // Valeur
    const valueText = `${row.value}${row.unit ? row.unit : ''}`;
    
    doc.fontSize(11) // Augmenté de 10 à 11
       .fillColor(COLORS.primary) // Changé pour plus de visibilité
       .font(FONTS.monospace)
       .text(valueText, MARGINS.left + col1Width + 12, rowY + 5, { 
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
  
  doc.y = tableY + tableHeight + 12; // Réduit de 15 à 12
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
  const sectionColor = COLORS.section[letter.toLowerCase()] || COLORS.backgroundAlt;
  
  // Estimation de la hauteur (réduite)
  const estimatedHeight = Array.isArray(content) 
    ? content.length * 14 + 60 
    : String(content).split('\n').length * 14 + 60;
  
  ensurePageSpace(doc, estimatedHeight);
  
  const cardY = doc.y;
  const padding = 15; // Réduit de 20 à 15
  let cardHeight = 50; // Réduit de 80 à 50
  
  // Barre latérale colorée (plus épaisse pour visibilité)
  doc.rect(MARGINS.left, cardY, 5, cardHeight) // Augmenté de 4 à 5
     .fillColor(COLORS.primary)
       .fill();

  // Fond de la carte
  doc.roundedRect(MARGINS.left + 5, cardY, contentWidth - 5, cardHeight, 6)
     .fillColor(COLORS.backgroundCard)
     .fill()
     .strokeColor(COLORS.border)
     .lineWidth(1) // Augmenté de 0.5 à 1
     .stroke();
  
  // Titre de section (plus visible)
  doc.fontSize(15) // Réduit de 16 à 15 mais toujours visible
     .fillColor(COLORS.primary)
     .font(FONTS.title)
     .text(title, MARGINS.left + padding + 5, cardY + 12, {
       width: contentWidth - padding * 2 - 5
     });
  
  // Contenu
  let contentY = cardY + 32; // Réduit de 60 à 32
  if (Array.isArray(content)) {
    // Filtrer les éléments vides
    const validItems = content.filter(item => item && String(item).trim());
    validItems.forEach((item) => {
      doc.fontSize(11) // Maintenu à 11 pour lisibilité
           .fillColor(COLORS.text)
           .font(FONTS.body)
         .text(`• ${String(item).trim()}`, MARGINS.left + padding + 5, contentY, {
           width: contentWidth - padding * 2 - 10 - 5,
             lineGap: 2
           });
      contentY = doc.y + 3; // Réduit de 4 à 3
    });
  } else {
    doc.fontSize(11) // Maintenu à 11 pour lisibilité
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(String(content), MARGINS.left + padding + 5, contentY, {
         width: contentWidth - padding * 2 - 10 - 5,
         lineGap: 2, // Réduit de 3 à 2
         align: 'justify'
       });
  }
  
  // Ajuster la hauteur de la carte
  cardHeight = Math.max(cardHeight, doc.y - cardY + 12); // Réduit de 15 à 12
  
  // Redessiner la carte avec la bonne hauteur
  doc.rect(MARGINS.left, cardY, 5, cardHeight)
     .fillColor(COLORS.primary)
     .fill();
  
  doc.roundedRect(MARGINS.left + 5, cardY, contentWidth - 5, cardHeight, 6)
     .fillColor(COLORS.backgroundCard)
       .fill()
     .strokeColor(COLORS.border)
     .lineWidth(1)
       .stroke();

  doc.y = cardY + cardHeight + 12; // Réduit de 20 à 12
}

/**
 * Rend la section Objectif complète avec sous-sections
 */
function renderObjectiveSection(doc, objective, contentWidth) {
  if (!objective || typeof objective !== 'object') return;
  
  const hasVitals = objective.vitals && Object.keys(objective.vitals).some(k => !isEmpty(objective.vitals[k]));
  const hasExam = !isEmpty(objective.exam);
  const hasLabs = !isEmpty(objective.labs);
  const hasMedications = Array.isArray(objective.medications) && objective.medications.some(m => !isEmpty(m));
  
  if (!hasVitals && !hasExam && !hasLabs && !hasMedications) return;
  
  // Titre de section O (compact)
  ensurePageSpace(doc, 200); // Réduit de 300 à 200
  renderSectionTitle(doc, 'O', SECTION_TITLES.O, contentWidth);
  
  // Signes vitaux (tableau)
  if (hasVitals) {
    renderVitalsTable(doc, objective.vitals, contentWidth);
  }
  
  // Examen physique
  if (hasExam) {
    doc.fontSize(12) // Maintenu pour visibilité
       .fillColor(COLORS.primary) // Changé pour plus de visibilité
       .font(FONTS.subtitle)
       .text('Examen physique', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 6; // Réduit de 8 à 6
    
      doc.fontSize(11)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(objective.exam.trim(), MARGINS.left, doc.y, {
         width: contentWidth,
         lineGap: 2, // Réduit de 3 à 2
         align: 'justify'
       });
    doc.y += 12; // Réduit de 20 à 12
  }
  
  // Laboratoires
  if (hasLabs) {
    doc.fontSize(12)
       .fillColor(COLORS.primary) // Changé pour plus de visibilité
       .font(FONTS.subtitle)
       .text('Résultats de laboratoire', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 6; // Réduit de 8 à 6
    
      doc.fontSize(11)
       .fillColor(COLORS.text)
       .font(FONTS.body)
       .text(objective.labs.trim(), MARGINS.left, doc.y, {
         width: contentWidth,
         lineGap: 2, // Réduit de 3 à 2
         align: 'justify'
       });
    doc.y += 12; // Réduit de 20 à 12
  }
  
  // Médicaments
  if (hasMedications) {
    doc.fontSize(12)
       .fillColor(COLORS.primary) // Changé pour plus de visibilité
       .font(FONTS.subtitle)
       .text('Médicaments', MARGINS.left, doc.y, { width: contentWidth });
    doc.y += 6; // Réduit de 8 à 6
    
    objective.medications.forEach((med) => {
      if (med && String(med).trim()) {
      doc.fontSize(11)
           .fillColor(COLORS.text)
           .font(FONTS.body)
           .text(`• ${String(med).trim()}`, MARGINS.left, doc.y, {
             width: contentWidth,
             lineGap: 2
           });
        doc.y += 12; // Réduit de 16 à 12
      }
    });
  }
  
  doc.y += 10; // Réduit de 15 à 10
}

/**
 * Rend le titre d'une section avec style moderne
 */
function renderSectionTitle(doc, letter, title, contentWidth) {
  doc.fontSize(16) // Réduit de 20 à 16
     .fillColor(COLORS.primary)
     .font(FONTS.title)
     .text(title, MARGINS.left, doc.y, { width: contentWidth });
  
  doc.moveTo(MARGINS.left, doc.y + 6) // Réduit de 8 à 6
     .lineTo(MARGINS.left + 50, doc.y + 6) // Réduit de 60 à 50
     .strokeColor(COLORS.primary)
     .lineWidth(2)
     .stroke();
  
  doc.y += 18; // Réduit de 25 à 18
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
    
    const footerY = doc.page.height - MARGINS.bottom + 5; // Réduit de 10 à 5
    
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
