# Guide de débogage de la connexion backend

## Problème : "Impossible de se connecter au serveur"

### Vérifications à faire :

1. **Vérifier que le backend est démarré**
   ```bash
   cd backend
   npm start
   ```
   Vous devriez voir : `🚀 Serveur démarré sur le port 3000`

2. **Vérifier que le backend écoute sur toutes les interfaces**
   Le backend doit écouter sur `0.0.0.0:3000` (déjà configuré dans `backend/server/index.js`)

3. **Vérifier votre IP réseau**
   - Windows : `ipconfig` (cherchez "IPv4 Address")
   - L'IP doit correspondre à celle dans `app.json > expo.extra.API_BASE_URL`

4. **Tester la connexion depuis votre navigateur**
   Ouvrez : `http://192.168.1.11:3000/health`
   Vous devriez voir : `{"status":"ok","timestamp":"..."}`

5. **Vérifier que l'appareil mobile est sur le même réseau Wi-Fi**
   - L'ordinateur et le téléphone doivent être sur le même réseau Wi-Fi

6. **Vérifier le pare-feu Windows**
   - Autoriser les connexions entrantes sur le port 3000
   - Ou désactiver temporairement le pare-feu pour tester

7. **Vérifier les logs dans l'app mobile**
   - Ouvrez les DevTools Expo
   - Cherchez les logs commençant par `📡 API Configuration:`
   - Vérifiez que l'URL affichée est correcte

8. **Redémarrer l'app Expo après modification de app.json**
   ```bash
   # Arrêter l'app (Ctrl+C)
   # Puis redémarrer
   npm start --clear
   ```

## Test manuel de la connexion

Depuis votre navigateur sur l'ordinateur :
```
http://192.168.1.11:3000/health
```

Depuis votre téléphone (navigateur) :
```
http://192.168.1.11:3000/health
```

Si ça fonctionne dans le navigateur mais pas dans l'app, le problème vient de la configuration Expo.

## Solution temporaire : Utiliser ngrok

Si le réseau local ne fonctionne pas, vous pouvez utiliser ngrok :

1. Installer ngrok
2. Lancer : `ngrok http 3000`
3. Copier l'URL (ex: `https://xxxx.ngrok.io`)
4. Mettre à jour `app.json` :
   ```json
   "extra": {
     "API_BASE_URL": "https://xxxx.ngrok.io"
   }
   ```

