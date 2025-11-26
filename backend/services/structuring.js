/**
 * Service de structuration JSON
 * Utilise Gemini 2.5 Flash pour extraire et structurer les données médicales depuis une transcription
 */

const { GoogleGenAI } = require('@google/genai');

// Initialisation du client Gemini (le SDK récupère automatiquement GEMINI_API_KEY depuis les variables d'environnement)
const ai = new GoogleGenAI({});

// Prompt système strict pour la structuration SOAPIE
const SOAPIE_SYSTEM_PROMPT = `Tu es un assistant médical spécialisé dans la structuration stricte de notes infirmières au format SOAPIE. 

Tu TRAVAILLES AVEC DES PROFESSIONNELS DE SANTÉ, et ta priorité absolue est la FIABILITÉ.

RÈGLES INDISCUTABLES :

-------------------------------------------------------------

1. ❌ Tu NE DOIS JAMAIS inventer, déduire, compléter, deviner ou corriger une information non dite. 

2. ❌ Tu NE DOIS PAS ajouter de médicaments, d'âges, de chambres, de diagnostics, de traitements ou de valeurs vitales non mentionnées.

3. ❌ Tu NE TRADUIS PAS la transcription en anglais. Aucun mot anglais n'est autorisé.

4. ❌ Tu NE PEUX PAS reformuler en ajoutant du sens. Tu peux seulement nettoyer les phrases.

5. ❌ Tu NE DOIS PAS modifier les chiffres, valeurs, doses ou signes vitaux.

6. ❌ Tu NE DOIS PAS interpréter médicalement. Juste structurer.

7. ✔ Tu corriges uniquement les fautes mineures :

   - orthographe

   - accords simples

   - reconnaissance vocale erronée évidente ("respiration nouvelle 2" → "respiration 22" si cela correspond exactement aux mots prononcés)

8. ✔ Si une information est incomplète ou partiellement incompréhensible :

      → tu la mets telle quelle, sans la compléter.

9. ✔ Si un champ manque totalement :

      → laisse une chaîne vide "".

10. ✔ Tu renvoies TOUJOURS un JSON valide. Jamais autre chose.

-------------------------------------------------------------

FORMAT DE SORTIE (OBLIGATOIRE) :

{
  "patient": {
    "full_name": "",
    "age": "",
    "gender": "",
    "room_number": "",
    "unit": ""
  },
  "soapie": {
    "S": "",
    "O": {
      "vitals": {
        "temperature": "",
        "blood_pressure": "",
        "heart_rate": "",
        "respiratory_rate": "",
        "spo2": "",
        "glycemia": ""
      },
      "exam": "",
      "labs": "",
      "medications": []
    },
    "A": "",
    "I": [],
    "E": "",
    "P": ""
  }
}

-------------------------------------------------------------

INSTRUCTIONS DE STRUCTURATION :

1. Dans "S", mets EXACTEMENT ce que l'infirmière dit concernant :

   - symptômes rapportés

   - douleur ressentie

   - contexte

   - paroles du patient ou de la famille  

   (ne jamais ajouter d'interprétation.)

2. Dans "O" :

   - Extraire fidèlement les signes vitaux, sans changer les chiffres.

   - L'examen physique doit être un résumé direct du texte entendu.

   - Ne jamais transformer un détail sensoriel en conclusion médicale.

   - Si un examen est ambigu : mets-le tel quel.

3. Dans "A" :

   - Reprendre uniquement l'analyse clinique que l'infirmière a ÉNONCÉE.

   - Si rien n'a été dit → mets "".

4. Dans "I" :

   - Lister uniquement les interventions effectivement prononcées.

5. Dans "E" :

   - Décrire seulement la réponse du patient mentionnée.

6. Dans "P" :

   - Mettre seulement les instructions réellement dites.

7. Les unités (°C, bpm, cmHg, %, g/L) doivent être conservées SANS AJOUT.

-------------------------------------------------------------

EXTRACTION DES INFORMATIONS PATIENT :

- **full_name** : Extrais le nom complet du patient mentionné dans la transcription. 
  Cherche les phrases comme "patient nommé X", "Monsieur/Madame X", "le patient X", 
  "nom du patient : X", ou simplement un nom propre au début de la transcription.
  Si plusieurs noms sont mentionnés, utilise le nom principal du patient (pas celui du médecin ou de l'infirmière).
  Le nom peut être au début, au milieu ou à la fin de la transcription.
  Si le nom n'est pas clairement mentionné → mets "".

- **age** : Extrais l'âge du patient si mentionné (ex: "45 ans", "45", "quarante-cinq ans").
  Si l'âge n'est pas mentionné → mets "".

- **gender** : Extrais le sexe/genre si mentionné (ex: "homme", "femme", "masculin", "féminin", "M", "F").
  Ne déduis jamais le sexe à partir du prénom ou d'autres indices. Si ce n'est pas clairement dit → mets "".

- **room_number** : Extrais le numéro de chambre si mentionné (ex: "chambre 12", "chambre numéro 5", "salle 3").
  Si la chambre n'est pas mentionnée → mets "".

- **unit** : Extrais l'unité ou le service si mentionné (ex: "cardiologie", "urgences", "service de médecine").
  Si l'unité n'est pas mentionnée → mets "".

-------------------------------------------------------------

CONTRES MESURES CONTRE HALLUCINATIONS :

À chaque fois que tu es tenté de compléter un champ :

→ laisse-le vide.

À chaque fois que la transcription est floue :

→ reproduis EXACTEMENT les mots entendus, sans tenter de deviner.

Si tu détectes un mot anglais (ex : "weak", "headache") :

→ remplace par la version française correspondante SEULEMENT si c'est évident que c'est une erreur de transcription.

Sinon → laisse "".

Tu ne dois jamais :

- inventer un service

- inventer un âge

- inventer un nom

- inventer un diagnostic

- inventer un médicament

- déduire le sexe si ce n'est pas clairement dit

- compléter une valeur vitale manquante

- ajouter d'interprétation clinique

- créer des données qui n'existent pas dans la transcription

- extrapoler ou inférer des informations non mentionnées

- utiliser des valeurs par défaut ou des exemples

- remplir un champ avec "non spécifié" ou "non mentionné" si ce n'est pas dit explicitement

- générer des listes de médicaments si aucun médicament n'est mentionné

- créer des valeurs de signes vitaux si elles ne sont pas mentionnées

-------------------------------------------------------------

RÈGLE D'OR : Si tu n'es pas ABSOLUMENT CERTAIN qu'une information est mentionnée dans la transcription, laisse le champ VIDE ("").

Mieux vaut un champ vide qu'un champ rempli avec des données inventées.

-------------------------------------------------------------

Ta réponse doit contenir UNIQUEMENT le JSON final.

Aucun commentaire.

Aucune explication.

Aucun texte autour.

Uniquement le JSON propre.`;

/**
 * Structure une transcription en format SOAPIE strict
 * Utilise Gemini 2.5 Flash avec extraction JSON stricte
 * @param {string} transcriptionText - Texte transcrit
 * @returns {Promise<Object>} - Données structurées au format SOAPIE strict
 */
async function structureSOAPIE(transcriptionText) {
  try {
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('Le texte de transcription est vide');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY n\'est pas définie dans les variables d\'environnement');
    }

    console.log('Structuration SOAPIE de la transcription avec Gemini 2.5 Flash...');

    // Utilisation de Gemini 2.5 Flash pour la structuration
    const modelName = 'gemini-2.5-flash';
    
    // Construction du prompt avec le système d'instruction SOAPIE strict
    const prompt = `${SOAPIE_SYSTEM_PROMPT}\n\nTranscription à structurer:\n\n${transcriptionText}`;
    
    console.log(`Structuration avec le modèle: ${modelName}`);
    
    // Appel à l'API Gemini avec retry pour les erreurs 503 (overloaded)
    let response;
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} d'appel à l'API Gemini...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            temperature: 0, // Température très basse pour plus de précision
            topK: 1,
            maxOutputTokens: 8192, // Augmenté pour permettre une réponse JSON complète
            responseMimeType: 'application/json', // Forcer la réponse en JSON
          },
        });
        // Succès, sortir de la boucle
        break;
      } catch (apiError) {
        lastError = apiError;
        const errorStatus = apiError.status || apiError.error?.code;
        const errorMessage = apiError.message || apiError.error?.message || '';
        
        console.error(`❌ Erreur API Gemini (tentative ${attempt}/${maxRetries}):`, {
          status: errorStatus,
          message: errorMessage,
          code: apiError.error?.code
        });
        
        // Si c'est une erreur 503 (overloaded) et qu'il reste des tentatives, retry avec backoff
        if (errorStatus === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
          if (attempt < maxRetries) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponentiel: 1s, 2s, 4s (max 5s)
            console.log(`⏳ Modèle surchargé (503), nouvelle tentative dans ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue; // Réessayer
          } else {
            // Toutes les tentatives ont échoué, retourner un structured_json minimal
            console.warn('⚠️ Toutes les tentatives ont échoué (503). Retour d\'un structured_json minimal pour permettre la continuation manuelle.');
            return {
              patient: {
                full_name: '',
                age: '',
                gender: '',
                room_number: '',
                unit: ''
              },
              soapie: {
                S: '',
                O: {
                  vitals: {
                    temperature: '',
                    blood_pressure: '',
                    heart_rate: '',
                    respiratory_rate: '',
                    spo2: '',
                    glycemia: ''
                  },
                  exam: '',
                  labs: '',
                  medications: []
                },
                A: '',
                I: [],
                E: '',
                P: ''
              }
            };
          }
        } else {
          // Autre erreur (non 503), lancer immédiatement
          throw new Error(`Erreur API Gemini: ${errorMessage || apiError.message}`);
        }
      }
    }
    
    // Si on arrive ici sans response, c'est qu'on a épuisé les tentatives
    if (!response) {
      throw new Error(`Erreur API Gemini: Le modèle est surchargé. Toutes les tentatives (${maxRetries}) ont échoué.`);
    }

    // Accéder au texte directement comme dans structureTranscription (qui fonctionne)
    // Le SDK @google/genai expose response.text directement
    const raw = response.text;

    if (!raw || (typeof raw === 'string' && raw.trim().length === 0)) {
      // Vérifier si la réponse a été coupée
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0];
        
        if (candidate.finishReason === 'MAX_TOKENS') {
          console.error('❌ ERREUR: La réponse a atteint la limite MAX_TOKENS');
          console.error('Le contenu JSON a probablement été tronqué.');
          throw new Error('La réponse JSON a été tronquée car elle a atteint la limite de tokens (MAX_TOKENS).');
        }
      }

      // Log détaillé pour diagnostic
      const rawSnippet = typeof raw === 'string' ? raw.substring(0, 4000) : JSON.stringify(response, null, 2).substring(0, 4000);
      console.error('❌ Réponse vide ou invalide');
      console.error('Raw model output (premiers 4000 caractères):', rawSnippet);
      console.error('Structure complète de la réponse:', JSON.stringify(response, null, 2));
      throw new Error('La réponse de structuration est vide');
    }
    
    // S'assurer que raw est une string
    let rawText = typeof raw === 'string' ? raw : String(raw);

    // Log du raw model output pour diagnostic (premiers 4000 caractères)
    const rawSnippet = rawText.substring(0, 4000);
    console.log('📝 Raw model output (premiers 4000 caractères):', rawSnippet);
    if (rawText.length > 4000) {
      console.log(`📝 ... (${rawText.length - 4000} caractères supplémentaires)`);
    }

    // EXTRACTION STRICTE DU JSON
    // Même avec responseMimeType: 'application/json', on extrait strictement le JSON pour éviter les prompts
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Aucun JSON trouvé dans la réponse');
      console.error('Raw model output complet:', rawText);
      
      // Créer une erreur avec le raw output pour faciliter le diagnostic
      const error = new Error('Aucun JSON structuré trouvé dans la réponse Gemini.');
      error.rawSnippet = rawSnippet.substring(0, 1000);
      throw error;
    }

    // Parse du JSON extrait
    let structuredData;
    try {
      structuredData = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsé avec succès');
    } catch (parseError) {
      console.error('❌ Erreur lors du parsing JSON:', parseError.message);
      console.error('JSON extrait (premiers 1000 caractères):', jsonMatch[0].substring(0, 1000));
      throw new Error(`Erreur lors du parsing JSON: ${parseError.message}. JSON extrait: ${jsonMatch[0].substring(0, 500)}`);
    }

    // Validation de la structure - initialiser avec des valeurs vides si manquantes
    if (!structuredData.patient) {
      console.warn('⚠️ structuredData.patient manquant, initialisation avec valeurs vides');
      structuredData.patient = {
        full_name: '',
        age: '',
        gender: '',
        room_number: '',
        unit: ''
      };
    }

    if (!structuredData.soapie) {
      console.warn('⚠️ structuredData.soapie manquant, initialisation avec valeurs vides');
      structuredData.soapie = {
        S: '',
        O: {
          vitals: {
            temperature: '',
            blood_pressure: '',
            heart_rate: '',
            respiratory_rate: '',
            spo2: '',
            glycemia: ''
          },
          exam: '',
          labs: '',
          medications: []
        },
        A: '',
        I: [],
        E: '',
        P: ''
      };
    }

    console.log('✅ Structuration SOAPIE réussie');
    console.log('📋 Informations patient extraites:', {
      full_name: structuredData.patient?.full_name || '(vide)',
      age: structuredData.patient?.age || '(vide)',
      gender: structuredData.patient?.gender || '(vide)',
      room_number: structuredData.patient?.room_number || '(vide)',
      unit: structuredData.patient?.unit || '(vide)'
    });
    console.log('📋 Sections SOAPIE présentes:', {
      S: !!structuredData.soapie.S && structuredData.soapie.S.trim() !== '',
      O: !!structuredData.soapie.O,
      A: !!structuredData.soapie.A && structuredData.soapie.A.trim() !== '',
      I: Array.isArray(structuredData.soapie.I) && structuredData.soapie.I.length > 0,
      E: !!structuredData.soapie.E && structuredData.soapie.E.trim() !== '',
      P: !!structuredData.soapie.P && structuredData.soapie.P.trim() !== ''
    });

    return structuredData;
  } catch (error) {
    console.error('❌ Erreur lors de la structuration SOAPIE:', error);

    // Si c'est une erreur de parsing JSON, inclure un snippet du raw output
    if (error.message && error.message.includes('JSON')) {
      throw error; // Re-lancer l'erreur qui contient déjà le raw output
    }

    if (error.response) {
      throw new Error(`Erreur API Gemini: ${error.response.status} - ${error.message}`);
    }

    throw new Error(`Erreur de structuration SOAPIE: ${error.message}`);
  }
}

// Prompt système pour l'extraction des données médicales au format SOAPIE strict
const SYSTEM_PROMPT = `Tu es un assistant médical strict.

Tu reçois une transcription provenant d'une infirmière sénégalaise.

Ta tâche est de structurer les informations en format SOAPIE.

RÈGLES IMPORTANTES :

- NE JAMAIS inventer de données.

- N'ajoute rien qui n'est pas dit.

- Si une information manque, ne la mets pas.

- Respecte exactement ce qui est présent dans le texte.

- Retourne UNIQUEMENT du JSON valide.

- Corrige légèrement les fautes de transcription sans changer le sens médical.

FORMAT ATTENDU :

{
  "patient": {
    "full_name": "",
    "age": "",
    "gender": "",
    "room_number": "",
    "unit": ""
  },
  "soapie": {
    "S": "",
    "O": {
      "vitals": {
        "temperature": "",
        "blood_pressure": "",
        "heart_rate": "",
        "respiratory_rate": "",
        "spo2": "",
        "glycemia": ""
      },
      "exam": "",
      "labs": "",
      "medications": []
    },
    "A": "",
    "I": [],
    "E": "",
    "P": ""
  }
}`;

/**
 * Construit une note formatée S-O-A-I-E-P en excluant les lignes vides
 * Supporte le nouveau format JSON strict avec structure "soapie"
 * @param {Object} structuredData - Données structurées depuis Gemini
 * @returns {string} - Note formatée propre sans lignes vides
 */
function buildCleanNote(structuredData) {
  const lines = [];
  
  lines.push('Note infirmière structurée (S–O–A–I–E–P)');
  lines.push('');
  
  // Vérifier si on a le nouveau format avec "soapie"
  const soapie = structuredData.soapie;
  
  // ========== SECTION S - SUBJECTIVE ==========
  lines.push('S — Subjectif :');
  lines.push('');
  
  if (soapie && soapie.S && soapie.S.trim() !== '') {
    lines.push(soapie.S);
  } else {
    // Fallback sur l'ancien format
    const patientReports = structuredData.patient_reports || '';
    const familyContribution = structuredData.family_contribution || '';
    
    if (patientReports && patientReports.trim() !== '') {
      lines.push(`• Rapports du patient : ${patientReports}`);
    }
    
    if (familyContribution && familyContribution.trim() !== '') {
      lines.push(`• Informations famille/soignant : ${familyContribution}`);
    }
  }
  
  lines.push('');
  
  // ========== SECTION O - OBJECTIVE ==========
  lines.push('O — Objectif :');
  lines.push('');
  
  if (soapie && soapie.O) {
    const objective = soapie.O;
    
    // Signes vitaux
    if (objective.vitals) {
      const vitals = objective.vitals;
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
        lines.push(`• Signes vitaux : ${vitalsParts.join(' / ')}`);
      }
    }
    
    // Examen physique
    if (objective.exam && objective.exam.trim() !== '') {
      lines.push(`• Examen physique : ${objective.exam}`);
    }
    
    // Laboratoires
    if (objective.labs && objective.labs.trim() !== '') {
      lines.push(`• Laboratoire/imagerie : ${objective.labs}`);
    }
    
    // Médicaments
    if (Array.isArray(objective.medications) && objective.medications.length > 0) {
      const medsText = objective.medications
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
        lines.push(`• Médicaments administrés : ${medsText}`);
      }
    }
  } else {
    // Fallback sur l'ancien format
    const vitals = structuredData.vitals || {};
    const bp = vitals.bp || vitals.tension || vitals.blood_pressure || '';
    const hr = vitals.hr || vitals.pouls || vitals.heart_rate || '';
    const rr = vitals.rr || vitals.respiration || vitals.respiratory_rate || '';
    const spo2 = vitals.spo2 || vitals.oxygen_saturation || '';
    const temp = vitals.temp || vitals.temperature || '';
    
    const vitalsParts = [];
    if (bp && bp.trim() !== '') vitalsParts.push(`BP ${bp}`);
    if (hr && hr.trim() !== '') vitalsParts.push(`HR ${hr}`);
    if (rr && rr.trim() !== '') vitalsParts.push(`RR ${rr}`);
    if (spo2 && spo2.trim() !== '') vitalsParts.push(`SpO₂ ${spo2}%`);
    if (temp && temp.trim() !== '') vitalsParts.push(`Temp ${temp}°C`);
    
    if (vitalsParts.length > 0) {
      lines.push(`• Signes vitaux : ${vitalsParts.join(' / ')}`);
    }
    
    const physicalExam = structuredData.physical_exam || structuredData.physical_assessment || '';
    if (physicalExam && physicalExam.trim() !== '') {
      lines.push(`• Examen physique : ${physicalExam}`);
    }
    
    const medications = structuredData.medications || [];
    if (Array.isArray(medications) && medications.length > 0) {
      const medsText = medications
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
        lines.push(`• Médicaments donnés : ${medsText}`);
      }
    }
    
    const otherObjective = structuredData.other_objective || structuredData.lab_results || '';
    if (otherObjective && otherObjective.trim() !== '') {
      lines.push(`• Autres données : ${otherObjective}`);
    }
  }
  
  lines.push('');
  
  // ========== SECTION A - ASSESSMENT ==========
  lines.push('A — Analyse :');
  lines.push('');
  
  if (soapie && soapie.A && soapie.A.trim() !== '') {
    lines.push(soapie.A);
  } else {
    const nursingAnalysis = structuredData.nursing_analysis || structuredData.analyse || '';
    if (nursingAnalysis && nursingAnalysis.trim() !== '') {
      lines.push(`• Jugement clinique infirmier : ${nursingAnalysis}`);
    }
  }
  
  lines.push('');
  
  // ========== SECTION I - INTERVENTION ==========
  lines.push('I — Intervention :');
  lines.push('');
  
  if (soapie && Array.isArray(soapie.I) && soapie.I.length > 0) {
    soapie.I.forEach(intervention => {
      if (typeof intervention === 'string' && intervention.trim() !== '') {
        lines.push(`• ${intervention}`);
      } else if (typeof intervention === 'object') {
        const text = JSON.stringify(intervention);
        if (text && text.trim() !== '') {
          lines.push(`• ${text}`);
        }
      }
    });
  } else {
    // Fallback sur l'ancien format
    const interventions = structuredData.interventions || structuredData.care || [];
    if (Array.isArray(interventions) && interventions.length > 0) {
      interventions.forEach(intervention => {
        if (typeof intervention === 'string' && intervention.trim() !== '') {
          lines.push(`• ${intervention}`);
        } else if (typeof intervention === 'object') {
          const interventionText = JSON.stringify(intervention);
          if (interventionText && interventionText.trim() !== '') {
            lines.push(`• ${interventionText}`);
          }
        }
      });
    }
  }
  
  lines.push('');
  
  // ========== SECTION E - EVALUATION ==========
  lines.push('E — Évaluation :');
  lines.push('');
  
  if (soapie && soapie.E && soapie.E.trim() !== '') {
    lines.push(soapie.E);
  } else {
    const patientResponse = structuredData.patient_response || structuredData.reponse_patient || '';
    if (patientResponse && patientResponse.trim() !== '') {
      lines.push(`• Réponse du patient : ${patientResponse}`);
    }
    
    const statusChanges = structuredData.status_changes || structuredData.changement_etat || '';
    if (statusChanges && statusChanges.trim() !== '') {
      lines.push(`• Changement d'état : ${statusChanges}`);
    }
  }
  
  lines.push('');
  
  // ========== SECTION P - PLAN ==========
  lines.push('P — Plan :');
  lines.push('');
  
  if (soapie && soapie.P && soapie.P.trim() !== '') {
    lines.push(soapie.P);
  } else {
    const nextSteps = structuredData.next_steps || structuredData.prochaines_etapes || '';
    if (nextSteps && nextSteps.trim() !== '') {
      lines.push(`• Prochaines étapes : ${nextSteps}`);
    }
    
    const monitoring = structuredData.monitoring || structuredData.surveillance || '';
    if (monitoring && monitoring.trim() !== '') {
      lines.push(`• Paramètres à surveiller : ${monitoring}`);
    }
    
    const followUp = structuredData.follow_up || structuredData.suivi || '';
    if (followUp && followUp.trim() !== '') {
      lines.push(`• Suivi/recommandations : ${followUp}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Structure une transcription en JSON médical
 * @param {string} transcriptionText - Texte transcrit de la dictée
 * @returns {Promise<Object>} - Données structurées en JSON
 */
async function structureTranscription(transcriptionText) {
  try {
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('Le texte de transcription est vide');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY n\'est pas définie dans les variables d\'environnement');
    }

    console.log('Structuration de la transcription avec Gemini 2.5 Flash...');

    // Utilisation de Gemini 2.5 Flash pour la structuration (disponible dans le free tier)
    const modelName = 'gemini-2.5-flash';
    
    // Construction du prompt
    const prompt = `${SYSTEM_PROMPT}\n\nTranscription à structurer:\n\n${transcriptionText}`;

    console.log(`Structuration avec le modèle: ${modelName}`);
    
    // Appel à l'API Gemini (nouveau SDK)
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        temperature: 0.1, // Température basse pour plus de précision
        responseMimeType: 'application/json', // Forcer la réponse en JSON
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error('La réponse de structuration est vide');
    }

    // Parse du JSON de réponse
    let structuredData;
    try {
      // Gemini retourne déjà du JSON grâce à responseMimeType
      structuredData = JSON.parse(responseText);
    } catch (parseError) {
      // Si le parsing échoue, essayer d'extraire le JSON du texte
      console.warn('Tentative d\'extraction JSON depuis le texte...');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('La réponse Gemini n\'est pas un JSON valide');
      }
    }

    // Normalisation de la structure avec patient et note formatée
    // Le nouveau format retourne { patient: {...}, soapie: {...} }
    // Les valeurs vides sont retournées au lieu de "Non mentionné"
    const normalizedData = {
      // Informations patient extraites (valeurs vides si non mentionnées)
      patient: structuredData.patient ? {
        full_name: structuredData.patient.full_name || '',
        age: structuredData.patient.age || '',
        gender: structuredData.patient.gender || '',
        room_number: structuredData.patient.room_number || '',
        unit: structuredData.patient.unit || ''
      } : {
        full_name: '',
        age: '',
        gender: '',
        room_number: '',
        unit: ''
      },
      
      // Nouveau format SOAPIE (préserver tel quel)
      soapie: structuredData.soapie || null,
      
      // Champs de compatibilité avec l'ancien format (pour le PDF et buildCleanNote)
      patient_reports: structuredData.patient_reports || '',
      family_contribution: structuredData.family_contribution || '',
      
      // Section O - Objectif (extraction depuis soapie.O si disponible)
      vitals: structuredData.soapie?.O?.vitals || structuredData.vitals || {},
      physical_exam: structuredData.soapie?.O?.exam || structuredData.physical_exam || structuredData.physical_assessment || '',
      medications: Array.isArray(structuredData.soapie?.O?.medications) ? structuredData.soapie.O.medications : 
                   (Array.isArray(structuredData.medications) ? structuredData.medications : []),
      other_objective: structuredData.soapie?.O?.labs || structuredData.other_objective || structuredData.lab_results || '',
      
      // Section A - Analyse
      nursing_analysis: structuredData.soapie?.A || structuredData.nursing_analysis || structuredData.analyse || '',
      
      // Section I - Intervention
      interventions: Array.isArray(structuredData.soapie?.I) ? structuredData.soapie.I : 
                     (Array.isArray(structuredData.interventions) ? structuredData.interventions : 
                      (Array.isArray(structuredData.care) ? structuredData.care : [])),
      patient_education: structuredData.patient_education || structuredData.education || '',
      collaborations: structuredData.collaborations || structuredData.references || '',
      
      // Section E - Évaluation
      patient_response: structuredData.soapie?.E || structuredData.patient_response || structuredData.reponse_patient || '',
      status_changes: structuredData.status_changes || structuredData.changement_etat || '',
      
      // Section P - Plan
      next_steps: structuredData.soapie?.P || structuredData.next_steps || structuredData.prochaines_etapes || '',
      monitoring: structuredData.monitoring || structuredData.surveillance || '',
      follow_up: structuredData.follow_up || structuredData.suivi || '',
      
      // Champs de compatibilité avec l'ancien format
      vitals_legacy: structuredData.soapie?.O?.vitals || structuredData.vitals || {},
      care: Array.isArray(structuredData.soapie?.I) ? structuredData.soapie.I : 
            (Array.isArray(structuredData.interventions) ? structuredData.interventions : 
             (Array.isArray(structuredData.care) ? structuredData.care : [])),
      observations: structuredData.soapie?.S || structuredData.patient_reports || structuredData.observations || '',
      flags: Array.isArray(structuredData.flags) ? structuredData.flags : []
    };
    
    // Note formatée S-O-A-I-E-P (texte complet)
    // On construit toujours la note depuis les données normalisées pour garantir
    // qu'aucune ligne vide n'apparaisse
    normalizedData.note = buildCleanNote(normalizedData);

    console.log('Structuration réussie');

    return normalizedData;
  } catch (error) {
    console.error('Erreur lors de la structuration:', error);

    if (error.response) {
      throw new Error(`Erreur API Gemini: ${error.response.status} - ${error.message}`);
    }

    throw new Error(`Erreur de structuration: ${error.message}`);
  }
}

/**
 * Structure une transcription avec validation stricte
 * @param {string} transcriptionText - Texte transcrit
 * @returns {Promise<Object>} - Données structurées validées
 */
async function structureTranscriptionStrict(transcriptionText) {
  try {
    const structuredData = await structureTranscription(transcriptionText);

    // Validation supplémentaire des types
    if (typeof structuredData.vitals !== 'object' || Array.isArray(structuredData.vitals)) {
      throw new Error('Le champ vitals doit être un objet');
    }

    if (!Array.isArray(structuredData.care)) {
      throw new Error('Le champ care doit être un tableau');
    }

    if (!Array.isArray(structuredData.medications)) {
      throw new Error('Le champ medications doit être un tableau');
    }

    if (typeof structuredData.observations !== 'string') {
      throw new Error('Le champ observations doit être une chaîne de caractères');
    }

    if (!Array.isArray(structuredData.flags)) {
      throw new Error('Le champ flags doit être un tableau');
    }

    return structuredData;
  } catch (error) {
    console.error('Erreur lors de la structuration stricte:', error);
    throw error;
  }
}

module.exports = {
  structureTranscription,
  structureTranscriptionStrict,
  structureSOAPIE,
  SYSTEM_PROMPT
};
