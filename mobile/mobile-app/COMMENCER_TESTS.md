# 🚀 Commencer les Tests Manuels

## ✅ Étape 1 : Vérification Automatique

Exécutez le script de vérification pour vous assurer que tout est configuré :

```bash
cd mobile/mobile-app
node scripts/check-setup.js
```

**Résultat attendu** : ✅ Tous les contrôles sont passés !

---

## ✅ Étape 2 : Démarrer le Backend

Dans un **premier terminal** :

```bash
cd backend
npm start
```

**Vérifier** :
- ✅ Le serveur démarre sur le port 3000
- ✅ Message : "🚀 Serveur démarré sur le port 3000"
- ✅ L'URL `http://192.168.1.13:3000/health` répond (ouvrir dans le navigateur)

---

## ✅ Étape 3 : Démarrer l'Application Mobile

Dans un **deuxième terminal** :

```bash
cd mobile/mobile-app
npm start
```

**Actions** :
1. Attendre que Expo démarre
2. Scanner le QR code avec Expo Go (iOS) ou l'app Expo (Android)
3. OU appuyer sur `a` pour Android ou `i` pour iOS dans le terminal

**Vérifier** :
- ✅ L'application se charge sur l'appareil/émulateur
- ✅ Pas d'erreurs rouges dans le terminal
- ✅ L'écran d'onboarding s'affiche

---

## ✅ Étape 4 : Choisir votre Guide de Test

### Option A : Test Rapide (5 minutes) ⚡

Suivez le guide **QUICK_TEST.md** pour tester les fonctionnalités essentielles.

**Parfait pour** : Vérification rapide que tout fonctionne

### Option B : Test Complet (30 minutes) 📖

Suivez le guide **TESTS_MANUELS.md** pour tester tous les scénarios en détail.

**Parfait pour** : Validation complète avant mise en production

---

## 📋 Checklist de Démarrage

Avant de commencer les tests, cochez :

- [ ] Backend démarré et accessible
- [ ] Application Expo démarrée
- [ ] Appareil/émulateur connecté
- [ ] Guide de test choisi (QUICK_TEST.md ou TESTS_MANUELS.md)
- [ ] Script de vérification exécuté avec succès

---

## 🎯 Scénarios de Test Essentiels

### 1. Onboarding (30 sec)
- [ ] 3 écrans avec illustrations
- [ ] Navigation "Suivant" fonctionne
- [ ] "Commencer" redirige vers login

### 2. Connexion (1 min)
- [ ] Validation email fonctionne
- [ ] Connexion avec identifiants valides
- [ ] Redirection vers home

### 3. Home (30 sec)
- [ ] Message de bienvenue affiché
- [ ] 4 cartes d'action visibles
- [ ] Navigation fonctionne

### 4. Déconnexion (30 sec)
- [ ] Alerte de confirmation
- [ ] Redirection vers login

### 5. Persistance (1 min)
- [ ] Fermer et rouvrir l'app
- [ ] Vérifier qu'on arrive directement sur home

---

## 🔍 En Cas de Problème

### L'application ne démarre pas
- Vérifier que Node.js est installé : `node --version`
- Vérifier les dépendances : `npm install`
- Vérifier les logs Expo pour les erreurs

### Le backend n'est pas accessible
- Vérifier que le backend est démarré
- Vérifier l'IP dans `app.json` (doit correspondre à votre IP réseau)
- Vérifier le guide `DEBUG_CONNECTION.md`

### Erreurs de connexion
- Vérifier que le backend répond sur `/health`
- Vérifier que l'IP est correcte dans `app.json`
- Vérifier que l'appareil et le PC sont sur le même réseau WiFi

---

## 📊 Résultats

Après les tests, documentez :

- ✅ **Tests réussis** : ___ / 10
- ❌ **Tests échoués** : ___ / 10
- 🐛 **Bugs détectés** : ___
- 📝 **Notes** : ___

---

## 🎉 Prêt à Commencer !

1. Exécutez : `node scripts/check-setup.js`
2. Démarrer le backend
3. Démarrer l'application
4. Suivez votre guide de test choisi

**Bon test ! 🚀**

