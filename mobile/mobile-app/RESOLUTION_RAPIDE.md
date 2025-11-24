# ⚡ Résolution Rapide - Problème de Connexion

## 🚨 Problème : "Impossible de se connecter au serveur"

### Solution en 3 Étapes (2 minutes)

## ✅ Étape 1 : Voir l'IP du Backend

Quand vous démarrez le backend, il affiche toutes les IPs disponibles. **Regardez dans le terminal du backend** et notez l'IP réseau (pas localhost) :

```
🌐 Serveur accessible sur:
   IPs réseau disponibles:
   - http://192.168.1.XX:3000  ← UTILISEZ CETTE IP !
```

## ✅ Étape 2 : Mettre à Jour l'IP Automatiquement

Exécutez ce script qui détecte et configure automatiquement l'IP :

```bash
cd mobile/mobile-app
node scripts/detect-backend-ip.js
```

Le script va :
1. ✅ Détecter toutes vos IPs réseau
2. ✅ Vous permettre de choisir la bonne
3. ✅ Mettre à jour `app.json` automatiquement

## ✅ Étape 3 : Redémarrer l'App

Dans le terminal Expo, appuyez sur **`r`** pour recharger l'application.

---

## 🔍 Vérification

1. Ouvrez l'application mobile
2. Allez sur l'écran de connexion
3. Vérifiez l'indicateur de statut backend (en haut à droite)
   - 🟢 **Vert** = Backend accessible ✅
   - 🔴 **Rouge** = Backend inaccessible ❌

---

## 📝 Si ça ne fonctionne toujours pas

1. **Vérifiez que le backend est démarré** :
   ```bash
   cd backend
   npm start
   ```

2. **Vérifiez que vous êtes sur le même WiFi** :
   - Appareil mobile et ordinateur doivent être sur le même réseau

3. **Testez depuis le navigateur** :
   ```
   http://VOTRE_IP:3000/health
   ```
   Vous devriez voir : `{"status":"ok"}`

4. **Consultez le guide complet** : `DIAGNOSTIC_CONNEXION.md`

---

## 🎯 Résultat Attendu

Une fois configuré correctement :
- ✅ L'indicateur backend sera vert 🟢
- ✅ Vous pourrez vous connecter avec vos identifiants
- ✅ Plus d'erreur "Impossible de se connecter au serveur"

---

**Temps estimé : 2 minutes** ⏱️

