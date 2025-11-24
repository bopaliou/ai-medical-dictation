# Guide de Tests Manuels - Application Mobile

## 🚀 Préparation

### 1. Démarrer le Backend
```bash
cd backend
npm start
```
✅ Vérifier que le serveur démarre sur `http://192.168.1.13:3000`
✅ Vérifier que `/health` répond avec un statut 200

### 2. Démarrer l'Application Mobile
```bash
cd mobile/mobile-app
npm start
```
✅ Scanner le QR code avec Expo Go (iOS) ou l'app Expo (Android)
✅ OU appuyer sur `a` pour Android ou `i` pour iOS dans le terminal

---

## 📋 Checklist de Tests Manuels

### ✅ Test 1 : Premier Lancement et Onboarding

**Objectif** : Vérifier le flux initial de l'application

**Actions** :
1. [ ] Lancer l'application pour la première fois
2. [ ] Vérifier que l'écran d'onboarding s'affiche (écran 1/3)
3. [ ] Vérifier l'illustration et le texte : "Gagnez du temps, soignez mieux"
4. [ ] Cliquer sur "Suivant"
5. [ ] Vérifier l'écran 2/3 : "Votre voix devient votre documentation"
6. [ ] Cliquer sur "Suivant"
7. [ ] Vérifier l'écran 3/3 : "Des notes fiables, des soins améliorés"
8. [ ] Vérifier que le bouton "Commencer" est vert
9. [ ] Cliquer sur "Commencer"
10. [ ] Vérifier la redirection vers l'écran de connexion

**Résultat attendu** :
- ✅ Navigation fluide entre les 3 écrans
- ✅ Indicateurs de progression fonctionnels
- ✅ Bouton "Passer" visible en haut à droite
- ✅ Redirection automatique vers login après "Commencer"

**Problèmes détectés** : _______________________________

---

### ✅ Test 2 : Validation du Formulaire de Connexion

**Objectif** : Vérifier la validation des champs

**Actions** :
1. [ ] Laisser les champs vides et cliquer sur "Se connecter"
2. [ ] Vérifier le message d'erreur : "Veuillez remplir tous les champs"
3. [ ] Entrer un email invalide (ex: "test")
4. [ ] Vérifier le message d'erreur sous le champ email
5. [ ] Entrer un email valide mais sans @ (ex: "testexample.com")
6. [ ] Vérifier le message d'erreur
7. [ ] Entrer un email valide (ex: "test@example.com")
8. [ ] Vérifier que l'erreur disparaît
9. [ ] Tester le bouton "œil" pour afficher/masquer le mot de passe

**Résultat attendu** :
- ✅ Messages d'erreur clairs et visibles
- ✅ Validation en temps réel
- ✅ Bordures rouges sur les champs en erreur
- ✅ Icône d'erreur visible
- ✅ Toggle mot de passe fonctionnel

**Problèmes détectés** : _______________________________

---

### ✅ Test 3 : Connexion avec Identifiants Invalides

**Objectif** : Vérifier la gestion des erreurs de connexion

**Actions** :
1. [ ] Entrer un email valide mais inexistant
2. [ ] Entrer un mot de passe quelconque
3. [ ] Cliquer sur "Se connecter"
4. [ ] Vérifier le spinner de chargement
5. [ ] Vérifier le message d'erreur affiché
6. [ ] Vérifier que le message ne contient pas d'URL d'API
7. [ ] Vérifier que le message ne mentionne pas "créer un compte"

**Résultat attendu** :
- ✅ Message d'erreur clair : "Email ou mot de passe incorrect"
- ✅ Pas d'informations techniques exposées
- ✅ Pas de mention de création de compte
- ✅ Bouton reste cliquable après l'erreur

**Problèmes détectés** : _______________________________

---

### ✅ Test 4 : Connexion avec Identifiants Valides

**Objectif** : Vérifier le processus de connexion réussie

**Actions** :
1. [ ] Entrer des identifiants valides (créés dans le backend)
2. [ ] Cliquer sur "Se connecter"
3. [ ] Vérifier le spinner de chargement
4. [ ] Vérifier la redirection automatique vers l'écran home
5. [ ] Vérifier que le message de bienvenue s'affiche
6. [ ] Vérifier que le prénom de l'utilisateur apparaît

**Résultat attendu** :
- ✅ Connexion réussie sans erreur
- ✅ Redirection automatique vers home (< 1 seconde)
- ✅ Message de bienvenue personnalisé
- ✅ 4 cartes d'action visibles

**Problèmes détectés** : _______________________________

---

### ✅ Test 5 : Persistance de Session

**Objectif** : Vérifier que la session persiste après fermeture

**Actions** :
1. [ ] Être connecté sur l'écran home
2. [ ] Fermer complètement l'application (swipe up sur iOS, app récente sur Android)
3. [ ] Rouvrir l'application
4. [ ] Vérifier qu'on arrive directement sur l'écran home
5. [ ] Vérifier qu'on ne passe pas par l'onboarding
6. [ ] Vérifier qu'on ne passe pas par l'écran de connexion

**Résultat attendu** :
- ✅ Accès direct à l'écran home
- ✅ Pas besoin de se reconnecter
- ✅ Données utilisateur toujours présentes

**Problèmes détectés** : _______________________________

---

### ✅ Test 6 : Déconnexion

**Objectif** : Vérifier le processus de déconnexion

**Actions** :
1. [ ] Être connecté sur l'écran home
2. [ ] Cliquer sur le bouton de déconnexion (icône rouge en haut à droite)
3. [ ] Vérifier l'alerte de confirmation
4. [ ] Cliquer sur "Annuler"
5. [ ] Vérifier qu'on reste sur l'écran home
6. [ ] Cliquer à nouveau sur déconnexion
7. [ ] Cliquer sur "Déconnexion" dans l'alerte
8. [ ] Vérifier la redirection vers l'écran de connexion
9. [ ] Vérifier qu'on ne peut plus accéder à l'écran home

**Résultat attendu** :
- ✅ Alerte de confirmation affichée
- ✅ Possibilité d'annuler
- ✅ Redirection vers login après confirmation
- ✅ Session supprimée (test avec Test 5)

**Problèmes détectés** : _______________________________

---

### ✅ Test 7 : Navigation depuis Home

**Objectif** : Vérifier la navigation vers tous les écrans

**Actions** :
1. [ ] Être connecté sur l'écran home
2. [ ] Cliquer sur "Enregistrer une note vocale"
3. [ ] Vérifier l'écran placeholder avec message
4. [ ] Cliquer sur "Retour"
5. [ ] Vérifier le retour à l'écran home
6. [ ] Répéter pour "Notes récentes"
7. [ ] Répéter pour "Patients"
8. [ ] Répéter pour "Paramètres"

**Résultat attendu** :
- ✅ Navigation vers tous les écrans fonctionnelle
- ✅ Bouton retour fonctionnel
- ✅ Pas de crash
- ✅ Transitions fluides

**Problèmes détectés** : _______________________________

---

### ✅ Test 8 : Design et UX

**Objectif** : Vérifier la qualité visuelle et l'expérience utilisateur

**Actions** :
1. [ ] Vérifier les espacements harmonieux (pas trop serré, pas trop espacé)
2. [ ] Vérifier les couleurs cohérentes (bleu #007AFF, vert #34C759, etc.)
3. [ ] Vérifier les animations fluides (pas de saccades)
4. [ ] Vérifier la lisibilité des textes (taille, contraste)
5. [ ] Vérifier la taille des boutons (faciles à cliquer)
6. [ ] Vérifier les ombres et effets visuels
7. [ ] Vérifier le responsive sur différentes tailles d'écran

**Résultat attendu** :
- ✅ Design moderne et professionnel
- ✅ Cohérence visuelle entre les écrans
- ✅ Animations fluides (60 FPS)
- ✅ Accessibilité respectée

**Problèmes détectés** : _______________________________

---

### ✅ Test 9 : Gestion des Erreurs Réseau

**Objectif** : Vérifier la gestion des erreurs quand le backend est indisponible

**Actions** :
1. [ ] Démarrer l'application
2. [ ] Arrêter le backend (Ctrl+C dans le terminal backend)
3. [ ] Essayer de se connecter
4. [ ] Vérifier le message d'erreur approprié
5. [ ] Vérifier le message d'avertissement "Backend non accessible"
6. [ ] Redémarrer le backend
7. [ ] Réessayer la connexion
8. [ ] Vérifier que la connexion fonctionne

**Résultat attendu** :
- ✅ Message d'erreur clair
- ✅ Pas de crash de l'application
- ✅ Reconnexion possible après redémarrage du backend
- ✅ Message d'avertissement visible

**Problèmes détectés** : _______________________________

---

### ✅ Test 10 : Performance

**Objectif** : Vérifier les performances de l'application

**Actions** :
1. [ ] Mesurer le temps de chargement initial (onboarding)
2. [ ] Vérifier la fluidité des animations (60 FPS)
3. [ ] Vérifier qu'il n'y a pas de lag lors de la navigation
4. [ ] Vérifier le temps de réponse des boutons (< 100ms)
5. [ ] Vérifier la consommation mémoire (pas de fuites)

**Résultat attendu** :
- ✅ Chargement initial < 2 secondes
- ✅ Animations fluides (pas de saccades)
- ✅ Navigation instantanée
- ✅ Pas de lag perceptible

**Problèmes détectés** : _______________________________

---

## 📊 Résumé des Tests

### Tests Réussis : ___ / 10

### Tests Échoués : ___ / 10

### Problèmes Critiques :
1. _________________________________
2. _________________________________
3. _________________________________

### Problèmes Mineurs :
1. _________________________________
2. _________________________________
3. _________________________________

### Notes Générales :
_________________________________
_________________________________
_________________________________

---

## 🔧 Commandes Utiles

```bash
# Démarrer le backend
cd backend && npm start

# Démarrer l'application mobile
cd mobile/mobile-app && npm start

# Vérifier le linting
cd mobile/mobile-app && npm run lint

# Vérifier TypeScript
cd mobile/mobile-app && npx tsc --noEmit

# Réinitialiser l'application (supprimer AsyncStorage)
# Utiliser l'option "Clear" dans Expo Go ou réinstaller l'app
```

---

## 📝 Notes Importantes

- **Tester sur un appareil physique** pour une meilleure expérience
- **Tester sur iOS et Android** si possible
- **Vérifier les logs** dans le terminal Expo pour détecter les erreurs
- **Tester avec différentes connexions réseau** (WiFi, 4G, offline)
- **Documenter tous les problèmes** rencontrés pour faciliter les corrections

---

## ✅ Validation Finale

Une fois tous les tests effectués, cocher les éléments suivants :

- [ ] Tous les tests critiques (1-6) sont réussis
- [ ] Aucun crash détecté
- [ ] Performance acceptable
- [ ] Design cohérent et moderne
- [ ] Gestion d'erreurs appropriée
- [ ] Documentation des problèmes complétée

**Date des tests** : _______________

**Testeur** : _______________

**Version testée** : _______________


