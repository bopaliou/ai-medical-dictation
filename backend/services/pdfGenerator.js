/**
 * Service de génération PDF
 * Génère un PDF standardisé au format SOAPIE (notes infirmières)
 * Format A4, design moderne et professionnel
 * N'affiche que les données réellement présentes (pas de "Non mentionné")
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Nettoie un objet structuré en supprimant les valeurs vides, null, "Non mentionné", etc.
 * @param {Object} structured - Objet structuré avec patient et soapie
 * @returns {Object} - Objet nettoyé sans champs vides
 */
function cleanNoteFields(structured) {
  if (!structured || typeof structured !== 'object') {
    return {};
  }

  const cleaned = JSON.parse(JSON.stringify(structured)); // Deep clone

  // Fonction récursive pour nettoyer un objet
  function cleanObject(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (typeof obj === 'string') {
      // Supprimer les chaînes vides ou contenant "Non mentionné"
      if (obj.trim() === '' || obj.trim().toLowerCase() === 'non mentionné') {
        return null;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      // Nettoyer chaque élément et filtrer les null
      const cleaned = obj.map(item => cleanObject(item)).filter(item => item !== null && item !== undefined);
      return cleaned.length > 0 ? cleaned : null;
    }

    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          // Vérifier si c'est un objet vide
          if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue)) {
            if (Object.keys(cleanedValue).length > 0) {
              cleaned[key] = cleanedValue;
            }
          } else {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }

    return obj;
  }

  // Nettoyer patient
  if (cleaned.patient) {
    cleaned.patient = cleanObject(cleaned.patient) || {};
  }

  // Nettoyer soapie
  if (cleaned.soapie) {
    cleaned.soapie = cleanObject(cleaned.soapie) || {};
  }

  return cleaned;
}

/**
 * Nettoie une section en supprimant les lignes "Non mentionné" et vides
 * @param {string} sectionContent - Contenu de la section
 * @returns {string} - Section nettoyée
 */
function cleanSection(sectionContent) {
  if (!sectionContent || typeof sectionContent !== 'string') {
    return '';
  }

  const lines = sectionContent.split('\n');
  const cleanedLines = lines
    .map(line => line.trim())
    .filter(line => {
      // Exclure les lignes vides
      if (line === '') return false;
      
      // Exclure les lignes contenant "Non mentionné"
      if (line.toLowerCase().includes('non mentionné')) return false;
      
      // Exclure les lignes au format "• Label : Non mentionné" ou "Label: Non mentionné"
      if (line.match(/^[•\-\*]?\s*[^:]*:\s*Non mentionné\s*$/i)) return false;
      
      // Exclure les lignes qui ne sont que "Non mentionné"
      if (line.trim().toLowerCase() === 'non mentionné') return false;
      
      return true;
    });

  return cleanedLines.join('\n').trim();
}

/**
 * Extrait une section depuis la note formatée de manière stricte
 * @param {string} noteContent - Contenu de la note formatée
 * @param {string} startMarker - Marqueur de début de section (ex: "S — Subjectif")
 * @param {string|null} endMarker - Marqueur de fin de section (ex: "O — Objectif")
 * @returns {string} - Contenu de la section nettoyé
 */
function extractSection(noteContent, startMarker, endMarker) {
  if (!noteContent || typeof noteContent !== 'string') {
    return '';
  }
  
  // Trouver le début de la section
  const startIndex = noteContent.indexOf(startMarker);
  if (startIndex === -1) {
    return '';
  }
  
  // Trouver le contenu après le ":" du marqueur
  const contentStart = noteContent.indexOf(':', startIndex);
  if (contentStart === -1) {
    return '';
  }
  
  // Trouver la fin de la section de manière stricte
  let contentEnd;
  if (endMarker) {
    // Chercher le marqueur de fin, mais s'assurer qu'il s'agit bien d'un nouveau titre de section
    // (commence par une lettre suivie de " —")
    const endIndex = noteContent.indexOf(endMarker, contentStart + 1);
    if (endIndex === -1) {
      // Si le marqueur de fin n'est pas trouvé, prendre jusqu'à la fin
      contentEnd = noteContent.length;
    } else {
      // Vérifier que c'est bien un nouveau titre de section (pas juste du texte contenant le mot)
      // Les sections commencent par "X — Titre" en début de ligne
      const beforeEnd = noteContent.substring(Math.max(0, endIndex - 5), endIndex);
      if (beforeEnd.match(/\n\s*$/)) {
        // C'est bien un nouveau titre de section
        contentEnd = endIndex;
      } else {
        // Ce n'est qu'une occurrence dans le texte, continuer la recherche
        const nextEndIndex = noteContent.indexOf(endMarker, endIndex + endMarker.length);
        if (nextEndIndex === -1) {
          contentEnd = noteContent.length;
        } else {
          contentEnd = nextEndIndex;
        }
      }
    }
  } else {
    // Dernière section, prendre jusqu'à la fin
    contentEnd = noteContent.length;
  }
  
  // Extraire le contenu
  let sectionContent = noteContent.substring(contentStart + 1, contentEnd).trim();
  
  // Nettoyer la section pour supprimer toute trace de "Non mentionné" et autres sections
  sectionContent = cleanSection(sectionContent);
  
  // Supprimer toute ligne qui commence par un autre marqueur de section (sécurité)
  const allSectionMarkers = [
    'S — Subjectif',
    'O — Objectif',
    'A — Analyse',
    'I — Intervention',
    'E — Évaluation',
    'P — Plan'
  ];
  
  const lines = sectionContent.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    // Exclure les lignes qui sont des titres de sections
    for (const marker of allSectionMarkers) {
      if (trimmed.startsWith(marker)) {
        return false;
      }
    }
    return true;
  });
  
  return cleanedLines.join('\n').trim();
}

/**
 * Génère un PDF moderne et professionnel au format SOAPIE
 * @param {Object} options - Options de génération
 * @param {Object} options.patient - Informations du patient
 * @param {string} options.transcriptionText - Texte transcrit
 * @param {Object} options.structuredJson - Données structurées JSON
 * @param {Date} options.recordedAt - Date d'enregistrement
 * @param {Date} options.createdAt - Date de création
 * @param {Object} options.user - Informations de l'infirmière
 * @returns {Promise<string>} - Chemin du fichier PDF généré
 */
async function generatePDF({ patient, transcriptionText, structuredJson, recordedAt, createdAt, user }) {
  // Nettoyer les données structurées avant génération PDF
  // Cela supprime tous les champs vides, null, "Non mentionné", etc.
  const cleanedStructured = cleanNoteFields(structuredJson || {});
  
  console.log('📄 Génération PDF avec données nettoyées');
  console.log('Patient:', cleanedStructured.patient ? cleanedStructured.patient.full_name || '(vide)' : 'absent');
  console.log('SOAPIE sections:', {
    S: !!(cleanedStructured.soapie && cleanedStructured.soapie.S),
    O: !!(cleanedStructured.soapie && cleanedStructured.soapie.O),
    A: !!(cleanedStructured.soapie && cleanedStructured.soapie.A),
    I: !!(cleanedStructured.soapie && Array.isArray(cleanedStructured.soapie.I) && cleanedStructured.soapie.I.length > 0),
    E: !!(cleanedStructured.soapie && cleanedStructured.soapie.E),
    P: !!(cleanedStructured.soapie && cleanedStructured.soapie.P)
  });

  // Création du nom de fichier temporaire
  const tempDir = os.tmpdir();
  const fileName = `note-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
  const filePath = path.join(tempDir, fileName);

  try {
    // Création du document PDF A4 avec marges
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Stream vers le fichier
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Palette de couleurs médicales modernes
    const colors = {
      primary: '#0d47a1',      // Bleu médical profond
      primaryLight: '#1976d2', // Bleu clair
      text: '#212121',         // Gris foncé pour texte
      textLight: '#757575',   // Gris moyen pour labels
      background: '#fafafa',  // Fond clair
      border: '#e0e0e0',      // Bordure grise
      white: '#ffffff',
      soapie: {
        s: '#e3f2fd',  // Bleu très clair pour Subjectif
        o: '#f1f8e9',  // Vert très clair pour Objectif
        a: '#fff3e0',  // Orange très clair pour Analyse
        i: '#fce4ec',  // Rose très clair pour Intervention
        e: '#e8eaf6',  // Indigo très clair pour Évaluation
        p: '#e0f2f1'   // Cyan très clair pour Plan
      }
    };

    // Marges et dimensions
    const marginX = 50;
    const marginY = 50;
    const contentWidth = doc.page.width - (marginX * 2);

    // ========== EN-TÊTE ==========
    doc.rect(0, 0, doc.page.width, 80)
       .fillColor(colors.primary)
       .fill();

    // Logo et titre
    doc.fontSize(20)
       .fillColor(colors.white)
       .font('Helvetica-Bold')
       .text('⚕', marginX, 20, { width: 30 })
       .text('NOTE INFIRMIÈRE – Format SOAPIE', marginX + 35, 20, { width: contentWidth - 200 });

    // Date et heure
    const dateTime = new Date(recordedAt || createdAt || new Date());
    const dateStr = dateTime.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = dateTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.fontSize(10)
       .fillColor(colors.white)
       .font('Helvetica')
       .text(`Date : ${dateStr}`, doc.page.width - marginX - 150, 25, { width: 150, align: 'right' })
       .text(`Heure : ${timeStr}`, doc.page.width - marginX - 150, 40, { width: 150, align: 'right' });

    // Position Y après l'en-tête
    doc.y = 100;

    // ========== INFORMATIONS PATIENT ET INFIRMIÈRE ==========
    // Utiliser exclusivement cleanedStructured.patient (déjà nettoyé, sans champs vides ni "Non mentionné")
    // NE JAMAIS utiliser transcriptionText pour remplir les informations patient
    const extractedPatient = cleanedStructured.patient || {};
    const patientInfo = {
      full_name: extractedPatient.full_name && extractedPatient.full_name.trim() !== '' 
        ? extractedPatient.full_name 
        : (patient.full_name && patient.full_name !== 'Patient non identifié' ? patient.full_name : null),
      age: extractedPatient.age && extractedPatient.age.trim() !== '' 
        ? extractedPatient.age 
        : (patient.dob ? calculateAge(patient.dob) : null),
      gender: extractedPatient.gender && extractedPatient.gender.trim() !== '' 
        ? extractedPatient.gender 
        : (patient.gender || null),
      room_number: extractedPatient.room_number && extractedPatient.room_number.trim() !== '' 
        ? extractedPatient.room_number 
        : (patient.room_number || null),
      unit: extractedPatient.unit && extractedPatient.unit.trim() !== '' 
        ? extractedPatient.unit 
        : (patient.unit || null)
    };

    // Compter les champs présents pour ajuster la hauteur
    const patientFieldsCount = Object.values(patientInfo).filter(v => v !== null && v !== undefined).length;
    const infoBoxHeight = Math.max(60, patientFieldsCount * 20 + 20);

    const infoBoxY = doc.y;
    
    // Fond de la boîte d'information
    doc.roundedRect(marginX, infoBoxY, contentWidth, infoBoxHeight, 5)
       .fillColor(colors.background)
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();

    let infoY = infoBoxY + 15;
    const leftColumnX = marginX + 20;
    const rightColumnX = marginX + contentWidth / 2 + 20;

    // Informations patient (gauche)
    doc.fontSize(9)
       .fillColor(colors.textLight)
       .font('Helvetica');

    if (patientInfo.full_name) {
      doc.text('Nom du patient :', leftColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(patientInfo.full_name, leftColumnX + 100, infoY, { width: 200 });
      infoY += 18;
      doc.fontSize(9).fillColor(colors.textLight).font('Helvetica');
    }

    if (patientInfo.age) {
      doc.text('Âge :', leftColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(patientInfo.age, leftColumnX + 50, infoY, { width: 100 });
      infoY += 18;
      doc.fontSize(9).fillColor(colors.textLight).font('Helvetica');
    }

    if (patientInfo.gender) {
      doc.text('Genre :', leftColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(patientInfo.gender, leftColumnX + 60, infoY, { width: 100 });
      infoY += 18;
      doc.fontSize(9).fillColor(colors.textLight).font('Helvetica');
    }

    if (patientInfo.room_number) {
      doc.text('Chambre :', leftColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(patientInfo.room_number, leftColumnX + 80, infoY, { width: 100 });
    }

    // Informations infirmière (droite)
    infoY = infoBoxY + 15;
    doc.fontSize(9)
       .fillColor(colors.textLight)
       .font('Helvetica');

    if (user?.full_name) {
      doc.text('Infirmière :', rightColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(user.full_name, rightColumnX + 80, infoY, { width: 200 });
      infoY += 18;
    }

    if (patientInfo.unit || user?.service) {
      doc.fontSize(9).fillColor(colors.textLight).font('Helvetica');
      doc.text('Unité/Région :', rightColumnX, infoY);
      doc.fontSize(11)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(patientInfo.unit || user?.service || '', rightColumnX + 100, infoY, { width: 200 });
    }

    // Position Y après les informations
    doc.y = infoBoxY + infoBoxHeight + 28;

    // ========== NOTE STRUCTURÉE S-O-A-I-E-P ==========
    // Utiliser exclusivement cleanedStructured.soapie (déjà nettoyé, sans champs vides ni "Non mentionné")
    // NE JAMAIS utiliser transcriptionText ou prompt système pour remplir les sections
    const soapie = cleanedStructured.soapie || null;
    
    if (soapie) {
      // Section S — Subjectif
      if (soapie.S && soapie.S.trim() !== '') {
        drawSOAPIESection(doc, 'S', 'SUBJECTIF', colors.soapie.s, colors, marginX, contentWidth, soapie.S);
        doc.moveDown(2);
      }
      
      // Section O — Objectif
      if (soapie.O) {
        const objectiveLines = [];
        
        // Signes vitaux
        if (soapie.O.vitals) {
          const vitals = soapie.O.vitals;
          const vitalsParts = [];
          
          if (vitals.blood_pressure && vitals.blood_pressure.trim() !== '') {
            vitalsParts.push(`BP ${vitals.blood_pressure}`);
          }
          if (vitals.heart_rate && vitals.heart_rate.trim() !== '') {
            vitalsParts.push(`HR ${vitals.heart_rate}`);
          }
          if (vitals.respiratory_rate && vitals.respiratory_rate.trim() !== '') {
            vitalsParts.push(`RR ${vitals.respiratory_rate}`);
          }
          if (vitals.spo2 && vitals.spo2.trim() !== '') {
            vitalsParts.push(`SpO₂ ${vitals.spo2}%`);
          }
          if (vitals.temperature && vitals.temperature.trim() !== '') {
            vitalsParts.push(`Temp ${vitals.temperature}°C`);
          }
          if (vitals.glycemia && vitals.glycemia.trim() !== '') {
            vitalsParts.push(`Glycémie ${vitals.glycemia}`);
          }
          
          if (vitalsParts.length > 0) {
            objectiveLines.push(`Signes vitaux : ${vitalsParts.join(' / ')}`);
          }
        }
        
        // Examen physique
        if (soapie.O.exam && soapie.O.exam.trim() !== '') {
          objectiveLines.push(`Examen physique : ${soapie.O.exam}`);
        }
        
        // Laboratoires
        if (soapie.O.labs && soapie.O.labs.trim() !== '') {
          objectiveLines.push(`Laboratoire/imagerie : ${soapie.O.labs}`);
        }
        
        // Médicaments
        if (Array.isArray(soapie.O.medications) && soapie.O.medications.length > 0) {
          const medsText = soapie.O.medications
            .map(m => {
              if (typeof m === 'object' && m.name) {
                const parts = [m.name];
                if (m.dose) parts.push(m.dose);
                if (m.route) parts.push(m.route);
                return parts.join(' - ');
              }
              return typeof m === 'string' ? m : JSON.stringify(m);
            })
            .filter(m => m && m.trim() !== '')
            .join(', ');
          
          if (medsText) {
            objectiveLines.push(`Médicaments administrés : ${medsText}`);
          }
        }
        
        if (objectiveLines.length > 0) {
          drawSOAPIESection(doc, 'O', 'OBJECTIF', colors.soapie.o, colors, marginX, contentWidth, objectiveLines.join('\n'));
          doc.moveDown(2);
        }
      }
      
      // Section A — Analyse
      if (soapie.A && soapie.A.trim() !== '') {
        drawSOAPIESection(doc, 'A', 'ANALYSE', colors.soapie.a, colors, marginX, contentWidth, soapie.A);
        doc.moveDown(2);
      }
      
      // Section I — Intervention
      if (Array.isArray(soapie.I) && soapie.I.length > 0) {
        const interventionLines = soapie.I
          .map(i => typeof i === 'string' ? i : JSON.stringify(i))
          .filter(i => i && i.trim() !== '');
        
        if (interventionLines.length > 0) {
          drawSOAPIESection(doc, 'I', 'INTERVENTION', colors.soapie.i, colors, marginX, contentWidth, interventionLines.join('\n'));
          doc.moveDown(2);
        }
      }
      
      // Section E — Évaluation
      if (soapie.E && soapie.E.trim() !== '') {
        drawSOAPIESection(doc, 'E', 'ÉVALUATION', colors.soapie.e, colors, marginX, contentWidth, soapie.E);
        doc.moveDown(2);
      }
      
      // Section P — Plan
      if (soapie.P && soapie.P.trim() !== '') {
        drawSOAPIESection(doc, 'P', 'PLAN', colors.soapie.p, colors, marginX, contentWidth, soapie.P);
        doc.moveDown(2);
      }
    } else {
      // Si aucune donnée SOAPIE n'est disponible, ne rien afficher (pas de fallback avec transcription brute)
      console.warn('⚠️ Aucune donnée SOAPIE disponible pour le PDF');
      doc.fontSize(12)
         .fillColor(colors.textLight)
         .font('Helvetica')
         .text('Aucune donnée structurée disponible.', marginX, doc.y, { width: contentWidth });
      doc.moveDown(2);
    }

    // ========== SIGNATURE (ligne propre, toujours après toutes les sections) ==========
    // S'assurer qu'on a assez d'espace avant la signature
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
      doc.y = marginY;
    }

    // Ligne de séparation avant la signature
    doc.moveTo(marginX, doc.y)
       .lineTo(marginX + contentWidth, doc.y)
       .strokeColor(colors.border)
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(1);

    // Ligne de signature
    doc.fontSize(12)
       .fillColor(colors.text)
       .font('Helvetica')
       .text('Signature :', marginX, doc.y, { underline: true });

    // Espace pour la signature (toujours vide sauf si fournie dans structuredJson)
    const signatureValue = cleanedStructured.signature || '';
    if (signatureValue && signatureValue.trim() !== '') {
      doc.fontSize(11)
         .font('Helvetica')
         .text(signatureValue, marginX + 80, doc.y, { width: 200 });
    } else {
      // Ligne vide pour la signature
      doc.fontSize(10)
         .fillColor(colors.border)
         .text('___________________', marginX + 80, doc.y, { width: 200 });
    }

    doc.fontSize(10)
       .fillColor(colors.text)
       .text('RN/LPN', marginX + 200, doc.y)
       .text('Heure :', marginX + 280, doc.y)
       .text(timeStr, marginX + 330, doc.y);

    // ========== PIED DE PAGE ==========
    const totalPages = doc.bufferedPageRange().count;
    const startPage = doc.bufferedPageRange().start || 0;
    
    for (let i = startPage; i < startPage + totalPages; i++) {
      doc.switchToPage(i);
      
      const footerY = doc.page.height - 30;
      
      // Ligne de séparation
      doc.moveTo(marginX, footerY - 5)
         .lineTo(doc.page.width - marginX, footerY - 5)
         .strokeColor(colors.border)
         .lineWidth(0.5)
         .stroke();
      
      // Texte du pied de page
      const pageNumber = i - startPage + 1;
      doc.fontSize(7)
         .fillColor(colors.textLight)
         .text(
           `Page ${pageNumber} sur ${totalPages} | Document généré automatiquement | AI Medical Dictation - Format SOAPIE`,
           marginX,
           footerY,
           {
             width: doc.page.width - (marginX * 2),
             align: 'center'
           }
         );
    }

    // Finalisation du PDF
    doc.end();

    // Attente de l'écriture du fichier
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        try {
          // Vérification de la taille du fichier
          const stats = fs.statSync(filePath);
          const fileSizeInKB = stats.size / 1024;

          if (fileSizeInKB > 150) {
            console.warn(`Attention: Le PDF généré fait ${fileSizeInKB.toFixed(2)} KB (> 150 KB)`);
          }

          console.log(`PDF généré: ${filePath} (${fileSizeInKB.toFixed(2)} KB)`);
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
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur de génération PDF: ${error.message}`);
  }
}

/**
 * Dessine une section SOAPIE avec style moderne
 * Utilise doc.y pour la position actuelle et la met à jour automatiquement
 * @param {PDFDocument} doc - Document PDF
 * @param {string} letter - Lettre de la section (S, O, A, I, E, P)
 * @param {string} title - Titre de la section
 * @param {string} bgColor - Couleur de fond
 * @param {Object} colors - Palette de couleurs
 * @param {number} marginX - Marge horizontale
 * @param {number} width - Largeur du contenu
 * @param {string} content - Contenu de la section (déjà nettoyé)
 */
function drawSOAPIESection(doc, letter, title, bgColor, colors, marginX, width, content) {
  if (!content || content.trim() === '') {
    return;
  }

  // Vérifier si on a assez d'espace sur la page actuelle
  const minSectionHeight = 80; // Hauteur minimum pour une section
  if (doc.y + minSectionHeight > doc.page.height - 50) {
    doc.addPage();
    doc.y = 50; // Retour au début de la nouvelle page
  }

  const sectionY = doc.y;
  const headerHeight = 28;
  const padding = 16;
  
  // En-tête de section
  doc.roundedRect(marginX, sectionY, width, headerHeight, 5)
     .fillColor(bgColor)
     .fill()
     .strokeColor(colors.border)
     .lineWidth(1)
     .stroke();

  // Lettre et titre
  doc.fontSize(16)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(letter, marginX + 12, sectionY + 6)
     .fontSize(12)
     .fillColor(colors.text)
     .font('Helvetica-Bold')
     .text(title, marginX + 35, sectionY + 8, { width: width - 50 });

  // Contenu de la section
  const contentY = sectionY + headerHeight + padding;
  
  // Calculer la hauteur nécessaire pour le contenu
  const lines = content.split('\n');
  const lineHeight = 14;
  const estimatedHeight = Math.max(40, lines.length * lineHeight + padding * 2);
  
  // Vérifier si on a assez d'espace sur la page actuelle
  if (contentY + estimatedHeight > doc.page.height - 50) {
    doc.addPage();
    doc.y = 50;
    // Redessiner l'en-tête sur la nouvelle page
    const newSectionY = doc.y;
    doc.roundedRect(marginX, newSectionY, width, headerHeight, 5)
       .fillColor(bgColor)
       .fill()
       .strokeColor(colors.border)
       .lineWidth(1)
       .stroke();
    
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(letter, marginX + 12, newSectionY + 6)
       .fontSize(12)
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(title, marginX + 35, newSectionY + 8, { width: width - 50 });
    
    doc.y = newSectionY + headerHeight + padding;
  } else {
    doc.y = contentY;
  }

  // Fond du contenu (on estime la hauteur d'abord)
  const contentStartY = doc.y;
  
  // Dessiner le fond du contenu
  doc.roundedRect(marginX, contentStartY - padding / 2, width, estimatedHeight, 3)
     .fillColor(colors.white)
     .fill()
     .strokeColor(colors.border)
     .lineWidth(0.5)
     .stroke();

  // Texte du contenu
  doc.fontSize(11)
     .fillColor(colors.text)
     .font('Helvetica')
     .text(content, marginX + padding, contentStartY, {
       width: width - (padding * 2),
       align: 'left',
       lineGap: 4
     });

  // Mettre à jour la position Y après la section (le texte a déjà mis à jour doc.y)
  doc.y = doc.y + padding;
}

/**
 * Calcule l'âge à partir d'une date de naissance
 * @param {string|Date} dob - Date de naissance
 * @returns {string} - Âge en années
 */
function calculateAge(dob) {
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} ans`;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generatePDF,
  cleanNoteFields: () => ({}) // Fonction de compatibilité, non utilisée
};

