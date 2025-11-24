# 🚀 Test Rapide - 5 Minutes

Guide ultra-rapide pour tester les fonctionnalités essentielles.

## ⚡ Démarrage Express

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Mobile App
cd mobile/mobile-app
npm start
```

## ✅ Checklist Express (5 min)

### 1. Onboarding (30 sec)
- [ ] L'app démarre sur l'onboarding
- [ ] 3 écrans avec illustrations
- [ ] Navigation "Suivant" fonctionne
- [ ] "Commencer" redirige vers login

### 2. Connexion (1 min)
- [ ] Formulaire s'affiche
- [ ] Validation email fonctionne
- [ ] Connexion avec identifiants valides
- [ ] Redirection vers home

### 3. Home (30 sec)
- [ ] Message de bienvenue affiché
- [ ] 4 cartes d'action visibles
- [ ] Navigation vers chaque écran fonctionne

### 4. Déconnexion (30 sec)
- [ ] Bouton déconnexion visible
- [ ] Alerte de confirmation
- [ ] Redirection vers login

### 5. Persistance (1 min)
- [ ] Fermer l'app complètement
- [ ] Rouvrir l'app
- [ ] Vérifier qu'on arrive directement sur home

## 🎯 Résultat

✅ **Tout fonctionne** → Application prête
❌ **Problème détecté** → Voir `TESTS_MANUELS.md` pour diagnostic détaillé

## 🔍 Vérifications Rapides

- **Backend accessible ?** → Ouvrir `http://192.168.1.13:3000/health` dans le navigateur
- **App démarre ?** → Vérifier les logs Expo
- **Erreurs ?** → Vérifier la console Expo (rouge = erreur)

---

**Temps total estimé : 5 minutes**


