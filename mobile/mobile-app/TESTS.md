# Guide de Tests - Application Mobile

Ce document décrit tous les tests nécessaires pour valider le bon fonctionnement de l'application mobile.

## Tests Automatisés

### Configuration
- **Framework**: Jest + React Native Testing Library
- **Commande**: `npm test`
- **Coverage**: `npm run test:coverage`

### Tests Unitaires

#### 1. AuthContext (`__tests__/contexts/AuthContext.test.tsx`)
- ✅ Initialisation avec état null
- ✅ Détection utilisateur non authentifié
- ✅ Détection utilisateur authentifié
- ✅ Fonction login
- ✅ Fonction logout
- ✅ Gestion des erreurs

#### 2. Services API (`__tests__/services/authApi.test.ts`)
- ✅ Login avec identifiants valides
- ✅ Gestion des erreurs réseau
- ✅ Gestion des erreurs 401/400/500
- ✅ Health check

#### 3. Hooks (`__tests__/hooks/useOnboarding.test.ts`)
- ✅ Gestion de l'état onboarding
- ✅ Persistance dans AsyncStorage

### Tests d'Intégration

#### 1. Flux d'authentification (`__tests__/integration/authFlow.test.tsx`)
- ✅ Navigation onboarding → login → home
- ✅ Persistance de session
- ✅ Déconnexion et redirection

## Tests Manuels

### Prérequis
1. Backend démarré sur `http://192.168.1.13:3000`
2. Application Expo démarrée (`npm start`)
3. Appareil/émulateur connecté

### Scénario 1 : Premier Lancement

**Objectif**: Vérifier le flux onboarding → login → home

**Étapes**:
1. ✅ Démarrer l'application
2. ✅ Vérifier que l'onboarding s'affiche (3 écrans)
3. ✅ Naviguer entre les écrans avec "Suivant"
4. ✅ Cliquer sur "Commencer" au dernier écran
5. ✅ Vérifier la redirection vers l'écran de connexion

**Résultat attendu**: Navigation fluide, pas de crash

---

### Scénario 2 : Connexion

**Objectif**: Vérifier le processus de connexion

**Étapes**:
1. ✅ Entrer un email invalide → Vérifier message d'erreur
2. ✅ Laisser un champ vide → Vérifier message d'erreur
3. ✅ Entrer des identifiants valides
4. ✅ Cliquer sur "Se connecter"
5. ✅ Vérifier le spinner de chargement
6. ✅ Vérifier la redirection vers l'écran home

**Résultat attendu**: 
- Validation en temps réel
- Messages d'erreur clairs
- Redirection automatique après connexion réussie

---

### Scénario 3 : Persistance de Session

**Objectif**: Vérifier que la session persiste après fermeture

**Étapes**:
1. ✅ Se connecter avec des identifiants valides
2. ✅ Fermer complètement l'application
3. ✅ Rouvrir l'application
4. ✅ Vérifier qu'on arrive directement sur l'écran home (sans login)

**Résultat attendu**: Pas besoin de se reconnecter

---

### Scénario 4 : Déconnexion

**Objectif**: Vérifier le processus de déconnexion

**Étapes**:
1. ✅ Être connecté sur l'écran home
2. ✅ Cliquer sur le bouton de déconnexion (icône rouge)
3. ✅ Confirmer la déconnexion dans l'alerte
4. ✅ Vérifier la redirection vers l'écran de connexion
5. ✅ Vérifier qu'on ne peut plus accéder à l'écran home

**Résultat attendu**: 
- Alerte de confirmation
- Redirection vers login
- Session supprimée

---

### Scénario 5 : Navigation Home

**Objectif**: Vérifier la navigation depuis l'écran home

**Étapes**:
1. ✅ Être connecté sur l'écran home
2. ✅ Cliquer sur "Enregistrer une note vocale"
3. ✅ Vérifier l'écran placeholder
4. ✅ Retourner à l'écran home
5. ✅ Répéter pour "Notes récentes", "Patients", "Paramètres"

**Résultat attendu**: Navigation fonctionnelle vers tous les écrans

---

### Scénario 6 : Gestion des Erreurs

**Objectif**: Vérifier la gestion des erreurs réseau

**Étapes**:
1. ✅ Démarrer l'application
2. ✅ Arrêter le backend
3. ✅ Essayer de se connecter
4. ✅ Vérifier le message d'erreur approprié
5. ✅ Redémarrer le backend
6. ✅ Réessayer la connexion

**Résultat attendu**: 
- Message d'erreur clair
- Pas de crash
- Reconnexion possible

---

### Scénario 7 : Design et UX

**Objectif**: Vérifier la qualité du design

**Étapes**:
1. ✅ Vérifier les espacements harmonieux
2. ✅ Vérifier les couleurs cohérentes
3. ✅ Vérifier les animations fluides
4. ✅ Vérifier la lisibilité des textes
5. ✅ Vérifier la taille des boutons (faciles à cliquer)
6. ✅ Vérifier le responsive sur différentes tailles d'écran

**Résultat attendu**: Design moderne, élégant et professionnel

---

### Scénario 8 : Performance

**Objectif**: Vérifier les performances

**Étapes**:
1. ✅ Mesurer le temps de chargement initial
2. ✅ Vérifier la fluidité des animations
3. ✅ Vérifier qu'il n'y a pas de lag lors de la navigation
4. ✅ Vérifier la consommation mémoire

**Résultat attendu**: 
- Chargement < 2 secondes
- 60 FPS pour les animations
- Pas de lag perceptible

---

## Checklist de Validation

### Code Quality
- [x] Pas d'erreurs de linting
- [x] Pas d'erreurs TypeScript
- [x] Code optimisé et nettoyé
- [x] Logs de debug supprimés

### Fonctionnalités
- [x] Onboarding fonctionnel
- [x] Connexion fonctionnelle
- [x] Déconnexion fonctionnelle
- [x] Persistance de session
- [x] Navigation entre écrans

### Design
- [x] Design moderne et élégant
- [x] Couleurs cohérentes
- [x] Espacements harmonieux
- [x] Animations fluides
- [x] Responsive

### Sécurité
- [x] Tokens stockés de manière sécurisée (AsyncStorage)
- [x] Messages d'erreur ne révèlent pas d'informations sensibles
- [x] Validation des entrées utilisateur

---

## Commandes Utiles

```bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage

# Vérifier le linting
npm run lint

# Vérifier TypeScript
npx tsc --noEmit

# Démarrer l'application
npm start
```

---

## Notes

- Les tests Jest peuvent avoir des problèmes avec la configuration React Native. Si c'est le cas, vérifier `jest.config.js` et `jest.setup.js`.
- Pour les tests manuels, utiliser un appareil physique pour une meilleure expérience.
- Toujours tester sur iOS et Android si possible.

