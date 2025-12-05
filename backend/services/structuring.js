/**
 * Service de structuration JSON
 * Utilise Gemini 2.5 Flash pour extraire et structurer les données médicales depuis une transcription
 */

const { GoogleGenAI } = require('@google/genai');

// Initialisation du client Gemini (le SDK récupère automatiquement GEMINI_API_KEY depuis les variables d'environnement)
const ai = new GoogleGenAI({});

// Prompt système premium pour la structuration SOAPIE KadduCare
const SOAPIE_SYSTEM_PROMPT = `Tu es un modèle spécialisé en structuration de données cliniques pour les professionnels de santé. 

Tu dois transformer une transcription vocale infirmière en un rapport strictement conforme au format SOAPIE. 

Ta sortie doit être rigoureusement exacte, cohérente, sans aucune hallucination, sans aucune invention de données, 
sans mélange de langues, et parfaitement adaptée au contexte médical francophone d'Afrique de l'Ouest (Sénégal).

RÈGLES INDISCUTABLES :

1. EXACTITUDE & NON-HALLUCINATION

   - Tu NE dois JAMAIS inventer un signe vital, une valeur, un symptôme ou une information non prononcée explicitement.

   - Si une donnée n'est pas présente dans l'audio → retourne "non renseigné".

   - Tu ne dois jamais interpréter ou extrapoler au-delà de ce qui est dit.

   - Aucune terminologie anglaise n'est autorisée.

2. FORMAT STRICT SOAPIE

   Tu dois générer 6 sections obligatoires :

   - S : Subjectif

   - O : Objectif (signes vitaux + examen physique)

   - A : Analyse

   - P : Plan de soins

   - I : Interventions

   - E : Évaluation

   Si une section n'a pas d'information → retourne : "Aucune donnée fournie dans la transcription."

3. RESPECT DES UNITÉS MÉDICALES

   - Température → degrés °C

   - Tension artérielle → format systolique/diastolique mmHg (ex : 120/80 mmHg)

   - FC → bpm

   - FR → cycles/min

   - SpO2 → %

   - Glycémie → g/L ou mmol/L selon indication

   - Toute unité absente → NE PAS EN INVENTER

4. STYLE D'ÉCRITURE

   - Français strict, vocabulaire infirmier professionnel.

   - Ton précis, clair, concis, sans subjectivité.

   - Éviter le style littéraire et les longues phrases inutiles.

   - Aucune traduction approximative ; respecter les termes médicaux corrects.

5. CONTEXTE SÉNÉGALAIS

   - Garde les formulations naturelles pour un environnement hospitalier sénégalais.

   - Exemple : "boxe 4", "service des urgences", "pavillon B", "consultation externe".

6. STRUCTURE DE SORTIE (FORMAT JSON STRICT)

   La réponse DOIT être un JSON valide contenant uniquement :

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

   - Aucune autre clé n'est autorisée.

   - Aucune ligne hors JSON.

   - Pas d'explication, pas de commentaire.

7. CORRECTION AUTOMATIQUE DE LA TRANSCRIPTION

   Tu dois corriger automatiquement :

   - fautes grammaticales

   - phrases incomplètes

   - redondances

   - transcription bruitée

   - termes médicaux mal prononcés (ex : "tensio" → "tension artérielle", "spo" → "SpO2")

   MAIS sans inventer !

8. LOGIQUE MÉDICALE

   - Vérifie la cohérence des valeurs (ex : 300 bpm = incohérent → mettre "valeur incohérente dans l'audio" ou "non renseigné").

   - Si l'interprétation médicale (Analyse) n'est pas mentionnée → ne pas analyser, mettre : "Aucune donnée fournie dans la transcription."

9. CHAMPS MULTILIGNES

   - Les champs doivent utiliser des phrases complètes et médicalement cohérentes.

   - Les listes (plan de soins, interventions) doivent être des tableaux JSON.

10. NE JAMAIS AJOUTER :

   - Pas de conseils médicaux.

   - Pas de diagnostic médical non mentionné.

   - Pas d'abréviations non standards.

   - Pas d'adresse, pas d'inférence, pas de suppositions.

OBJECTIF FINAL :

Produire une structuration premium, fiable, sécurisée, conforme aux normes médicales 
et parfaitement adaptée à la génération du PDF KadduCare.

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

Commence la structuration dès réception du texte brut de transcription.`;

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

    // EXTRACTION ROBUSTE DU JSON
    // Même avec responseMimeType: 'application/json', on extrait strictement le JSON pour éviter les prompts
    let jsonText = null;
    let structuredData = null;
    
    // Méthode 1: Essayer de parser directement (si responseMimeType fonctionne)
    try {
      structuredData = JSON.parse(rawText);
      console.log('✅ JSON parsé directement depuis rawText');
      jsonText = rawText;
    } catch (directParseError) {
      // Méthode 2: Extraire le JSON avec regex (chercher le plus grand objet JSON)
      const jsonMatches = [];
      let braceCount = 0;
      let startIndex = -1;
      
      for (let i = 0; i < rawText.length; i++) {
        if (rawText[i] === '{') {
          if (braceCount === 0) startIndex = i;
          braceCount++;
        } else if (rawText[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            jsonMatches.push(rawText.substring(startIndex, i + 1));
            startIndex = -1;
          }
        }
      }
      
      // Prendre le plus grand match (probablement le JSON principal)
      if (jsonMatches.length > 0) {
        jsonMatches.sort((a, b) => b.length - a.length);
        jsonText = jsonMatches[0];
        console.log(`📝 ${jsonMatches.length} objet(s) JSON trouvé(s), utilisation du plus grand (${jsonText.length} caractères)`);
      }
      
      // Méthode 3: Fallback sur regex simple
      if (!jsonText) {
        const simpleMatch = rawText.match(/\{[\s\S]*\}/);
        if (simpleMatch) {
          jsonText = simpleMatch[0];
          console.log('📝 JSON extrait avec regex simple');
        }
      }
      
      // Si toujours rien, essayer de nettoyer le texte
      if (!jsonText) {
        // Enlever les markdown code blocks si présents
        const cleaned = rawText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/^[^{]*/, '') // Enlever tout avant le premier {
          .replace(/[^}]*$/, ''); // Enlever tout après le dernier }
        
        if (cleaned.trim().startsWith('{') && cleaned.trim().endsWith('}')) {
          jsonText = cleaned.trim();
          console.log('📝 JSON nettoyé depuis markdown/code blocks');
        }
      }
      
      if (!jsonText) {
        console.error('❌ Aucun JSON trouvé dans la réponse');
        console.error('Raw model output complet (premiers 2000 caractères):', rawText.substring(0, 2000));
        
        // Créer une erreur avec le raw output pour faciliter le diagnostic
        const error = new Error('Aucun JSON structuré trouvé dans la réponse Gemini.');
        error.rawSnippet = rawSnippet.substring(0, 1000);
        throw error;
      }
      
      // Parse du JSON extrait
      try {
        structuredData = JSON.parse(jsonText);
        console.log('✅ JSON parsé avec succès après extraction');
      } catch (parseError) {
        console.error('❌ Erreur lors du parsing JSON:', parseError.message);
        console.error('Position de l\'erreur:', parseError.message.match(/position (\d+)/)?.[1] || 'inconnue');
        console.error('JSON extrait (premiers 1000 caractères):', jsonText.substring(0, 1000));
        console.error('JSON extrait (derniers 500 caractères):', jsonText.substring(Math.max(0, jsonText.length - 500)));
        
        // Essayer de réparer le JSON si possible (fermer les accolades manquantes)
        try {
          let repairedJson = jsonText;
          let openBraces = (jsonText.match(/\{/g) || []).length;
          let closeBraces = (jsonText.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            repairedJson = jsonText + '}'.repeat(openBraces - closeBraces);
            console.log('🔧 Tentative de réparation: ajout de', openBraces - closeBraces, 'accolades fermantes');
            structuredData = JSON.parse(repairedJson);
            console.log('✅ JSON réparé et parsé avec succès');
          } else {
            throw parseError;
          }
        } catch (repairError) {
          const error = new Error(`Erreur lors du parsing JSON: ${parseError.message}`);
          error.rawSnippet = jsonText.substring(0, 1000);
          error.parseError = parseError.message;
          throw error;
        }
      }
    }

    // Vérifier que structuredData a été parsé avec succès
    if (!structuredData) {
      const error = new Error('Impossible de parser le JSON de la réponse Gemini.');
      error.rawSnippet = rawSnippet.substring(0, 1000);
      throw error;
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

    // Normaliser les sections SOAPIE pour s'assurer qu'elles sont du bon type
    // S, A, E, P doivent être des chaînes (string)
    // I doit être un tableau (array)
    if (structuredData.soapie.S !== undefined && typeof structuredData.soapie.S !== 'string') {
      console.warn('⚠️ structuredData.soapie.S n\'est pas une chaîne, conversion en chaîne');
      structuredData.soapie.S = Array.isArray(structuredData.soapie.S) 
        ? structuredData.soapie.S.join(' ') 
        : String(structuredData.soapie.S || '');
    }
    
    if (structuredData.soapie.A !== undefined && typeof structuredData.soapie.A !== 'string') {
      console.warn('⚠️ structuredData.soapie.A n\'est pas une chaîne, conversion en chaîne');
      structuredData.soapie.A = Array.isArray(structuredData.soapie.A) 
        ? structuredData.soapie.A.join(' ') 
        : String(structuredData.soapie.A || '');
    }
    
    if (structuredData.soapie.E !== undefined && typeof structuredData.soapie.E !== 'string') {
      console.warn('⚠️ structuredData.soapie.E n\'est pas une chaîne, conversion en chaîne');
      structuredData.soapie.E = Array.isArray(structuredData.soapie.E) 
        ? structuredData.soapie.E.join(' ') 
        : String(structuredData.soapie.E || '');
    }
    
    if (structuredData.soapie.P !== undefined && typeof structuredData.soapie.P !== 'string') {
      console.warn('⚠️ structuredData.soapie.P n\'est pas une chaîne, conversion en chaîne');
      structuredData.soapie.P = Array.isArray(structuredData.soapie.P) 
        ? structuredData.soapie.P.join(' ') 
        : String(structuredData.soapie.P || '');
    }
    
    // I doit être un tableau
    if (structuredData.soapie.I !== undefined && !Array.isArray(structuredData.soapie.I)) {
      console.warn('⚠️ structuredData.soapie.I n\'est pas un tableau, conversion en tableau');
      if (typeof structuredData.soapie.I === 'string' && structuredData.soapie.I.trim() !== '') {
        structuredData.soapie.I = [structuredData.soapie.I];
      } else {
        structuredData.soapie.I = [];
      }
    }
    
    // Normaliser O.vitals pour s'assurer que toutes les valeurs sont des chaînes
    if (structuredData.soapie.O && structuredData.soapie.O.vitals) {
      const vitals = structuredData.soapie.O.vitals;
      Object.keys(vitals).forEach(key => {
        if (vitals[key] !== undefined && typeof vitals[key] !== 'string') {
          vitals[key] = String(vitals[key] || '');
        }
      });
    }
    
    // Normaliser O.exam et O.labs
    if (structuredData.soapie.O) {
      if (structuredData.soapie.O.exam !== undefined && typeof structuredData.soapie.O.exam !== 'string') {
        structuredData.soapie.O.exam = Array.isArray(structuredData.soapie.O.exam) 
          ? structuredData.soapie.O.exam.join(' ') 
          : String(structuredData.soapie.O.exam || '');
      }
      
      if (structuredData.soapie.O.labs !== undefined && typeof structuredData.soapie.O.labs !== 'string') {
        structuredData.soapie.O.labs = Array.isArray(structuredData.soapie.O.labs) 
          ? structuredData.soapie.O.labs.join(' ') 
          : String(structuredData.soapie.O.labs || '');
      }
      
      // medications doit être un tableau
      if (structuredData.soapie.O.medications !== undefined && !Array.isArray(structuredData.soapie.O.medications)) {
        if (typeof structuredData.soapie.O.medications === 'string' && structuredData.soapie.O.medications.trim() !== '') {
          structuredData.soapie.O.medications = [structuredData.soapie.O.medications];
        } else {
          structuredData.soapie.O.medications = [];
        }
      }
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
      S: !!structuredData.soapie.S && typeof structuredData.soapie.S === 'string' && structuredData.soapie.S.trim() !== '',
      O: !!structuredData.soapie.O,
      A: !!structuredData.soapie.A && typeof structuredData.soapie.A === 'string' && structuredData.soapie.A.trim() !== '',
      I: Array.isArray(structuredData.soapie.I) && structuredData.soapie.I.length > 0,
      E: !!structuredData.soapie.E && typeof structuredData.soapie.E === 'string' && structuredData.soapie.E.trim() !== '',
      P: !!structuredData.soapie.P && typeof structuredData.soapie.P === 'string' && structuredData.soapie.P.trim() !== ''
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
  
  if (soapie && soapie.S) {
    const sValue = typeof soapie.S === 'string' ? soapie.S : (Array.isArray(soapie.S) ? soapie.S.join(' ') : String(soapie.S || ''));
    if (sValue.trim() !== '') {
      lines.push(sValue);
    }
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
      
      // Normaliser et vérifier chaque signe vital
      const normalizeVital = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return String(value);
        return String(value || '').trim();
      };
      
      const bp = normalizeVital(vitals.blood_pressure);
      if (bp !== '') {
        vitalsParts.push(`BP ${bp}`);
      }
      
      const hr = normalizeVital(vitals.heart_rate);
      if (hr !== '') {
        vitalsParts.push(`HR ${hr}`);
      }
      
      const rr = normalizeVital(vitals.respiratory_rate);
      if (rr !== '') {
        vitalsParts.push(`RR ${rr}`);
      }
      
      const spo2 = normalizeVital(vitals.spo2);
      if (spo2 !== '') {
        vitalsParts.push(`SpO₂ ${spo2}%`);
      }
      
      const temp = normalizeVital(vitals.temperature);
      if (temp !== '') {
        vitalsParts.push(`Temp ${temp}°C`);
      }
      
      const glycemia = normalizeVital(vitals.glycemia);
      if (glycemia !== '') {
        vitalsParts.push(`Glycémie ${glycemia}`);
      }
      
      if (vitalsParts.length > 0) {
        lines.push(`• Signes vitaux : ${vitalsParts.join(' / ')}`);
      }
    }
    
    // Examen physique
    if (objective.exam) {
      const examValue = typeof objective.exam === 'string' ? objective.exam : (Array.isArray(objective.exam) ? objective.exam.join(' ') : String(objective.exam || ''));
      if (examValue.trim() !== '') {
        lines.push(`• Examen physique : ${examValue}`);
      }
    }
    
    // Laboratoires
    if (objective.labs) {
      const labsValue = typeof objective.labs === 'string' ? objective.labs : (Array.isArray(objective.labs) ? objective.labs.join(' ') : String(objective.labs || ''));
      if (labsValue.trim() !== '') {
        lines.push(`• Laboratoire/imagerie : ${labsValue}`);
      }
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
  
  if (soapie && soapie.A) {
    const aValue = typeof soapie.A === 'string' ? soapie.A : (Array.isArray(soapie.A) ? soapie.A.join(' ') : String(soapie.A || ''));
    if (aValue.trim() !== '') {
      lines.push(aValue);
    }
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
  
  if (soapie && soapie.E) {
    const eValue = typeof soapie.E === 'string' ? soapie.E : (Array.isArray(soapie.E) ? soapie.E.join(' ') : String(soapie.E || ''));
    if (eValue.trim() !== '') {
      lines.push(eValue);
    }
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
  
  if (soapie && soapie.P) {
    const pValue = typeof soapie.P === 'string' ? soapie.P : (Array.isArray(soapie.P) ? soapie.P.join(' ') : String(soapie.P || ''));
    if (pValue.trim() !== '') {
      lines.push(pValue);
    }
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
