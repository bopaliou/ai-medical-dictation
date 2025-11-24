# 🔧 Configuration de l'IP Backend

## 📋 Quand Utiliser Quelle URL ?

### ✅ Utilisez `localhost` si :
- Vous testez sur **Web** (navigateur)
- Vous testez sur **iOS Simulator**
- Vous testez sur **Android Emulator** (peut aussi utiliser `10.0.2.2`)

### ❌ Utilisez l'IP Réseau (192.168.x.x) si :
- Vous testez sur un **appareil physique** (téléphone/tablette réel)

## 🔄 Changer la Configuration

### Option 1 : Modification Manuelle

1. Ouvrez `mobile/mobile-app/app.json`
2. Modifiez la ligne `API_BASE_URL` :

```json
"extra": {
  "API_BASE_URL": "http://localhost:3000"        // Pour émulateur/web
  // OU
  "API_BASE_URL": "http://192.168.1.13:3000"     // Pour appareil physique
}
```

3. Redémarrez Expo (appuyez sur `r` dans le terminal)

### Option 2 : Script Automatique

Pour détecter et configurer automatiquement l'IP réseau :

```bash
cd mobile/mobile-app
node scripts/detect-backend-ip.js
```

## 🎯 Configuration Recommandée par Environnement

| Environnement | Configuration app.json |
|--------------|----------------------|
| **Développement Web** | `"http://localhost:3000"` |
| **iOS Simulator** | `"http://localhost:3000"` |
| **Android Emulator** | `"http://10.0.2.2:3000"` ou `"http://localhost:3000"` |
| **Appareil Physique** | `"http://192.168.1.XX:3000"` (IP de votre ordinateur) |

## 📝 Comment Trouver Votre IP Réseau ?

Quand vous démarrez le backend, il affiche automatiquement toutes les IPs disponibles :

```
🌐 Serveur accessible sur:
   IPs réseau disponibles:
   - http://192.168.1.13:3000  ← Utilisez celle-ci
```

Ou utilisez le script de détection automatique.

## ⚠️ Important

- **Sur appareil physique** : `localhost` ne fonctionnera JAMAIS car il fait référence à l'appareil lui-même, pas à votre ordinateur
- **Sur émulateur** : `localhost` fonctionne car l'émulateur partage le réseau avec votre ordinateur
- **Changement de réseau** : Si vous changez de WiFi, l'IP peut changer, utilisez le script de détection

---

**Voir EXPLICATION_LOCALHOST.md pour comprendre pourquoi localhost ne fonctionne pas sur appareil physique.**

