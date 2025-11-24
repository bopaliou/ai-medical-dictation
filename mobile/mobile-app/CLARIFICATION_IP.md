# 🔍 Clarification : Quelle IP Utiliser ?

## ⚠️ Important : L'IP du Téléphone n'est PAS celle à utiliser !

### ❌ Ce qui n'est PAS important :
- L'IP de votre téléphone (ex: 192.168.1.11)
- L'IP de votre tablette

### ✅ Ce qui EST important :
- **L'IP de votre ORDINATEUR** (où tourne le backend)
- C'est vers cette IP que le téléphone doit se connecter

## 🎯 Comment ça fonctionne ?

```
┌─────────────────┐                    ┌─────────────────┐
│   ORDINATEUR    │                    │    TÉLÉPHONE    │
│  (Backend)      │                    │     (App)       │
│                 │                    │                 │
│ IP: 192.168.1.13│  ←─── Connexion ───│ IP: 192.168.1.11│
│ Port: 3000      │                    │                 │
└─────────────────┘                    └─────────────────┘
```

**L'app sur le téléphone doit se connecter à l'IP de l'ordinateur (192.168.1.13), pas à sa propre IP !**

## 🔍 Comment Trouver l'IP de Votre Ordinateur ?

### Méthode 1 : Regarder les Logs du Backend

Quand vous démarrez le backend, il affiche automatiquement toutes les IPs :

```bash
cd backend
npm start
```

Vous verrez :
```
🌐 Serveur accessible sur:
   IPs réseau disponibles:
   - http://192.168.1.13:3000  ← UTILISEZ CETTE IP !
```

### Méthode 2 : Script Automatique

```bash
cd mobile/mobile-app
node scripts/detect-backend-ip.js
```

Le script détecte automatiquement l'IP de votre ordinateur et met à jour `app.json`.

### Méthode 3 : Commande Windows

```powershell
ipconfig
```

Cherchez "Adresse IPv4" de votre connexion WiFi/Ethernet.

## 📝 Configuration

Dans `app.json`, vous devez mettre l'IP de votre **ORDINATEUR**, pas celle du téléphone :

```json
"extra": {
  "API_BASE_URL": "http://192.168.1.13:3000"  // IP de l'ordinateur
}
```

## ✅ Résumé

- **IP du téléphone** : 192.168.1.11 (pas important pour la config)
- **IP de l'ordinateur** : 192.168.1.13 (celle à utiliser dans app.json)
- **L'app se connecte** : de 192.168.1.11 (téléphone) → vers 192.168.1.13 (ordinateur)

---

**En bref** : Utilisez l'IP de l'ordinateur où tourne le backend, pas celle du téléphone !

