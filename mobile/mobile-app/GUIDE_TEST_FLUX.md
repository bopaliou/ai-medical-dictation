# 🧪 Guide de Test - Flux "Nouvelle Dictée"

## ✅ Checklist de Tests Manuels

### Test 1 : Patient Existant Sélectionné

**Objectif** : Vérifier le flux complet avec un patient existant

**Étapes** :
1. [ ] Se connecter à l'application
2. [ ] Aller sur le Dashboard (Home)
3. [ ] Cliquer sur "NOUVELLE DICTÉE"
4. [ ] Vérifier que le modal s'ouvre avec animation slide-up
5. [ ] Vérifier l'onglet "Rechercher" actif par défaut
6. [ ] Taper un nom de patient dans la barre de recherche
7. [ ] Vérifier que les suggestions apparaissent (autocomplete)
8. [ ] Sélectionner un patient de la liste
9. [ ] Vérifier que le modal se ferme
10. [ ] Vérifier l'écran record avec les infos du patient
11. [ ] Vérifier que le patient est affiché dans la card info

**Résultat attendu** :
- ✅ Modal premium avec design iOS 17
- ✅ Recherche instantanée avec suggestions
- ✅ Navigation fluide vers l'écran record
- ✅ Patient correctement affiché

---

### Test 2 : Création Nouveau Patient

**Objectif** : Vérifier la création d'un nouveau patient

**Étapes** :
1. [ ] Dashboard → "NOUVELLE DICTÉE"
2. [ ] Cliquer sur l'onglet "Nouveau"
3. [ ] Vérifier le formulaire premium avec icônes
4. [ ] Remplir le nom complet (champ requis)
5. [ ] Vérifier l'indicateur visuel (checkmark vert)
6. [ ] Remplir l'âge (vérifier filtre numérique)
7. [ ] Sélectionner un genre (vérifier boutons avec icônes)
8. [ ] Remplir chambre et unité (optionnels)
9. [ ] Vérifier que le bouton "Créer et continuer" est actif
10. [ ] Cliquer sur "Créer et continuer"
11. [ ] Vérifier l'animation de chargement
12. [ ] Vérifier que le patient est créé dans le backend
13. [ ] Vérifier la navigation vers l'écran record
14. [ ] Vérifier que le nouveau patient est affiché

**Résultat attendu** :
- ✅ Formulaire moderne et intuitif
- ✅ Validation en temps réel
- ✅ Création réussie dans le backend
- ✅ Patient disponible immédiatement

---

### Test 3 : Continuer Sans Patient

**Objectif** : Vérifier le flux sans sélection de patient

**Étapes** :
1. [ ] Dashboard → "NOUVELLE DICTÉE"
2. [ ] Cliquer sur "Continuer sans patient"
3. [ ] Vérifier le message explicatif
4. [ ] Vérifier la navigation vers l'écran record
5. [ ] Vérifier l'affichage "Aucun patient sélectionné"
6. [ ] (Quand l'enregistrement sera implémenté) Upload audio
7. [ ] Vérifier que le backend crée le patient depuis l'audio
8. [ ] Vérifier `patient_created: true` dans la réponse

**Résultat attendu** :
- ✅ Option claire et accessible
- ✅ Message explicatif visible
- ✅ Backend crée le patient automatiquement

---

### Test 4 : Cache Local

**Objectif** : Vérifier le fonctionnement du cache

**Étapes** :
1. [ ] Rechercher un patient (première fois)
2. [ ] Vérifier la requête API dans les logs
3. [ ] Fermer le modal
4. [ ] Rouvrir le modal
5. [ ] Rechercher le même patient
6. [ ] Vérifier que les résultats apparaissent rapidement (cache)
7. [ ] Attendre 5 minutes
8. [ ] Rechercher à nouveau
9. [ ] Vérifier que le cache est rafraîchi (nouvelle requête API)

**Résultat attendu** :
- ✅ Cache fonctionnel
- ✅ Performance améliorée
- ✅ Rafraîchissement automatique après expiration

---

### Test 5 : Design et UX

**Objectif** : Vérifier la qualité visuelle

**Étapes** :
1. [ ] Vérifier les couleurs (bleu #006CFF, fond #FAFAFA)
2. [ ] Vérifier les ombres sur les cards
3. [ ] Vérifier les animations (slide-up, fade-in)
4. [ ] Vérifier les espacements harmonieux
5. [ ] Vérifier la typographie (tailles, poids)
6. [ ] Vérifier les icônes (cohérence, taille)
7. [ ] Vérifier la responsivité
8. [ ] Vérifier les transitions fluides

**Résultat attendu** :
- ✅ Design premium iOS 17
- ✅ Animations fluides (60 FPS)
- ✅ Cohérence visuelle
- ✅ Accessibilité respectée

---

### Test 6 : Gestion d'Erreurs

**Objectif** : Vérifier la gestion des erreurs

**Étapes** :
1. [ ] Créer un patient sans nom → Vérifier message d'erreur
2. [ ] Créer un patient avec nom existant → Vérifier message de doublon
3. [ ] Rechercher avec réseau coupé → Vérifier fallback cache
4. [ ] Upload avec patient_id invalide → Vérifier message d'erreur

**Résultat attendu** :
- ✅ Messages d'erreur clairs
- ✅ Fallback sur cache en offline
- ✅ Pas de crash

---

## 📊 Résumé des Tests

### Tests Réussis : ___ / 6

### Problèmes Détectés :
1. _________________________________
2. _________________________________
3. _________________________________

### Notes :
_________________________________
_________________________________

---

**Date des tests** : _______________

**Testeur** : _______________

**Version** : _______________

