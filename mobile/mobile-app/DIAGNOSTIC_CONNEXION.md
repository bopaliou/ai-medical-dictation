# 🔧 Diagnostic de Connexion Backend

## Problème : "Impossible de se connecter au serveur"

Si vous voyez ce message alors que le backend est démarré, suivez ces étapes :

## ✅ Étape 1 : Vérifier l'IP du Backend

Quand vous démarrez le backend, il affiche toutes les IPs disponibles. Regardez dans le terminal du backend :

```
🌐 Serveur accessible sur:
   - http://localhost:3000
   - http://127.0.0.1:3000
   IPs réseau disponibles:
   - http://192.168.1.XX:3000  ← Utilisez cette IP !
```

**Notez l'IP réseau** (pas localhost, pas 127.0.0.1)

## ✅ Étape 2 : Mettre à jour app.json

### Option A : Script automatique (Recommandé)

```bash
cd mobile/mobile-app
node scripts/detect-backend-ip.js
```

Le script va :
1. Détecter automatiquement toutes vos IPs réseau
2. Vous permettre de choisir la bonne
3. Mettre à jour `app.json` automatiquement

### Option B : Modification manuelle

1. Ouvrez `mobile/mobile-app/app.json`
2. Trouvez la ligne `"API_BASE_URL": "http://192.168.1.13:3000"`
3. Remplacez `192.168.1.13` par l'IP affichée par le backend
4. Sauvegardez

## ✅ Étape 3 : Redémarrer l'Application

Après avoir modifié `app.json`, vous devez redémarrer Expo :

1. Dans le terminal Expo, appuyez sur `r` pour recharger
2. OU arrêtez (Ctrl+C) et relancez `npm start`

## ✅ Étape 4 : Vérifier la Connexion

1. Ouvrez l'application mobile
2. Allez sur l'écran de connexion
3. Vérifiez l'indicateur de statut backend (en haut à droite)
   - 🟢 Vert = Backend accessible
   - 🔴 Rouge = Backend inaccessible

## 🔍 Vérifications Supplémentaires

### Vérifier que le Backend est Accessible

Testez depuis votre navigateur ou avec curl :

```bash
# Remplacer 192.168.1.XX par votre IP
curl http://192.168.1.XX:3000/health
```

Vous devriez voir : `{"status":"ok"}`

### Vérifier le Firewall

Sur Windows :
1. Ouvrez "Pare-feu Windows Defender"
2. Vérifiez que Node.js peut accepter les connexions entrantes
3. Si nécessaire, ajoutez une exception pour le port 3000

### Vérifier le Réseau

- **Appareil mobile et ordinateur doivent être sur le même réseau WiFi**
- Si vous utilisez un émulateur Android :
  - Android Emulator : utilisez `10.0.2.2` au lieu de l'IP réseau
  - iOS Simulator : utilisez `localhost` ou `127.0.0.1`

### Vérifier le Port

Le backend doit être démarré sur le port 3000. Vérifiez dans le terminal :

```
🚀 Serveur démarré sur le port 3000
```

Si c'est un autre port, mettez à jour `app.json` avec le bon port.

## 🚨 Problèmes Courants

### Problème 1 : IP Change à Chaque Connexion WiFi

**Solution** : Utilisez le script `detect-backend-ip.js` à chaque fois que vous changez de réseau.

### Problème 2 : Backend Accessible depuis le Navigateur mais pas depuis l'App

**Causes possibles** :
- IP incorrecte dans `app.json`
- Application pas redémarrée après modification
- Cache Expo (essayez `npm start -- --clear`)

### Problème 3 : Erreur "Network request failed"

**Causes possibles** :
- Backend non démarré
- IP incorrecte
- Firewall bloque la connexion
- Appareil mobile et ordinateur sur des réseaux différents

## 📝 Checklist Rapide

- [ ] Backend démarré et affiche les IPs
- [ ] IP réseau notée (pas localhost)
- [ ] `app.json` mis à jour avec la bonne IP
- [ ] Application Expo redémarrée
- [ ] Appareil mobile et ordinateur sur le même WiFi
- [ ] Firewall autorise les connexions sur le port 3000
- [ ] Test `/health` fonctionne depuis le navigateur

## 🆘 Aide Supplémentaire

Si le problème persiste :

1. Vérifiez les logs Expo (console rouge = erreur)
2. Vérifiez les logs du backend (erreurs de connexion)
3. Testez avec `curl` ou Postman pour isoler le problème
4. Vérifiez que le backend répond bien sur `/health`

---

**Une fois la connexion établie, l'indicateur de statut sera vert 🟢 sur l'écran de connexion.**

