# 🔍 Comment Trouver l'IP de Votre Ordinateur

## ⚠️ Important : Utilisez l'IP de l'ORDINATEUR, pas celle du téléphone !

L'application mobile doit se connecter à l'IP de votre **ordinateur** (où tourne le backend), pas à l'IP du téléphone.

## 🎯 Méthode 1 : Regarder les Logs du Backend (Le Plus Simple)

Quand vous démarrez le backend, il affiche automatiquement toutes les IPs :

```bash
cd backend
npm start
```

Vous verrez quelque chose comme :
```
🌐 Serveur accessible sur:
   IPs réseau disponibles:
   - http://192.168.1.13:3000  ← UTILISEZ CETTE IP !
```

**C'est cette IP qu'il faut mettre dans `app.json` !**

## 🎯 Méthode 2 : Commande Windows

Ouvrez PowerShell ou CMD et tapez :

```powershell
ipconfig
```

Cherchez la section de votre connexion WiFi ou Ethernet, et notez l'**Adresse IPv4** :

```
Carte réseau sans fil Wi-Fi :
   Adresse IPv4. . . . . . . . . . . . . . . . : 192.168.1.13  ← CETTE IP !
```

## 🎯 Méthode 3 : Script Automatique

Utilisez le script de détection automatique :

```bash
cd mobile/mobile-app
node scripts/detect-backend-ip.js
```

Le script va :
1. Détecter toutes les IPs de votre ordinateur
2. Vous permettre de choisir la bonne
3. Mettre à jour `app.json` automatiquement

## 📝 Exemple de Configuration

Si votre ordinateur a l'IP `192.168.1.13`, dans `app.json` :

```json
"extra": {
  "API_BASE_URL": "http://192.168.1.13:3000"
}
```

**Note** : L'IP de votre téléphone (192.168.1.11) n'est pas utilisée dans la configuration.

## 🔄 Schéma de Connexion

```
┌─────────────────────┐                    ┌─────────────────────┐
│   ORDINATEUR        │                    │    TÉLÉPHONE        │
│  (Backend)          │                    │     (App)          │
│                     │                    │                     │
│ IP: 192.168.1.13    │  ←─── Connexion ───│ IP: 192.168.1.11    │
│ Port: 3000          │                    │                     │
│                     │                    │                     │
│ Backend écoute ici  │                    │ App se connecte ici │
└─────────────────────┘                    └─────────────────────┘
```

**L'app sur le téléphone (192.168.1.11) se connecte à l'ordinateur (192.168.1.13)**

## ✅ Checklist

- [ ] J'ai trouvé l'IP de mon ordinateur (pas celle du téléphone)
- [ ] J'ai mis cette IP dans `app.json > expo.extra.API_BASE_URL`
- [ ] J'ai redémarré l'application Expo (appuyer sur `r`)
- [ ] Le backend est démarré et affiche cette IP dans les logs

---

**Rappel** : L'IP du téléphone (192.168.1.11) n'est pas utilisée. Utilisez l'IP de l'ordinateur !

