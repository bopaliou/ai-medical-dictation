# 🔍 Pourquoi utiliser 192.168.x.x au lieu de localhost ?

## 📱 Le Problème avec localhost

### Cas 1 : Émulateur/Simulateur ✅
- **Android Emulator** : `localhost` ou `10.0.2.2` fonctionne
- **iOS Simulator** : `localhost` fonctionne
- **Web** : `localhost` fonctionne

### Cas 2 : Appareil Physique ❌
- **Téléphone/Tablette réels** : `localhost` ne fonctionne PAS
- Pourquoi ? Parce que `localhost` sur votre téléphone fait référence au téléphone lui-même, pas à votre ordinateur !

## 🎯 La Solution

### Sur Appareil Physique
Vous devez utiliser l'**IP réseau locale** de votre ordinateur (ex: `192.168.1.13`) pour que votre téléphone puisse se connecter au backend sur votre ordinateur.

```
Ordinateur (Backend)          Téléphone (App)
192.168.1.13:3000    ←→    192.168.1.13:3000
   ✅ Fonctionne
   
localhost:3000       ←→    localhost:3000
   ❌ Ne fonctionne PAS
   (le téléphone cherche sur lui-même)
```

## 🔧 Configuration Intelligente

La configuration détecte automatiquement :
- **Web** → utilise `localhost`
- **Émulateur** → peut utiliser `localhost` ou `10.0.2.2`
- **Appareil physique** → doit utiliser l'IP réseau (192.168.x.x)

## 📝 Comment Savoir Quelle IP Utiliser ?

Quand vous démarrez le backend, il affiche toutes les IPs disponibles :

```
🌐 Serveur accessible sur:
   - http://localhost:3000
   - http://127.0.0.1:3000
   IPs réseau disponibles:
   - http://192.168.1.13:3000  ← Utilisez celle-ci pour appareil physique
```

## ✅ Résumé

| Environnement | URL à utiliser |
|--------------|----------------|
| Web (navigateur) | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://localhost:3000` |
| **Appareil physique** | `http://192.168.1.XX:3000` |

---

**En bref** : Sur un appareil physique, `localhost` = l'appareil lui-même, pas votre ordinateur. Il faut donc utiliser l'IP réseau de votre ordinateur.

