# Guide de Déploiement : Linode & EAS

Ce guide détaille les étapes pour déployer le backend **KadduCare** sur Linode et l'application mobile via Expo (EAS).

## 🌍 Partie 1 : Backend sur Linode

### Prérequis
- Un serveur Linode (Ubuntu 22.04 LTS ou 24.04 LTS recommandé)
- Accès SSH au serveur
- Docker et Docker Compose installés sur le serveur

### 1. Connexion au serveur
Connectez-vous à votre instance Linode via SSH :
```bash
ssh root@172.238.81.245
```

### 2. Installation de Docker (si non installé)
Si Docker n'est pas encore installé sur votre serveur, exécutez :
```bash
# Mettre à jour les paquets
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin
```

### 3. Déploiement du code

#### A. Sur votre ordinateur local
Puisque le code est sur GitHub, vous devez d'abord envoyer les nouveaux fichiers de configuration Docker :

```bash
git add backend/Dockerfile backend/docker-compose.yml
git commit -m "Add Docker deployment config"
git push
```

#### B. Sur le serveur Linode
Clonez votre dépôt (ou faites un pull si déjà cloné) :

```bash
# Si c'est la première fois
git clone https://github.com/bopaliou/ai-medical-dictation.git /opt/kadducare

# Si le dossier existe déjà
cd /opt/kadducare
git pull
```

#### C. Configuration des secrets
Vous devez créer le fichier `.env` sur le serveur car il n'est pas sur GitHub (sécurité).

```bash
cd /opt/kadducare/backend
nano .env
```
Copiez-collez le contenu de votre fichier `.env` local dans cet éditeur, puis sauvegardez (`Ctrl+O`, `Enter`) et quittez (`Ctrl+X`).


### 4. Lancement
Sur le serveur Linode :
```bash
cd /opt/kadducare/backend

# Construire et lancer le conteneur en arrière-plan
# Note : La première construction sera longue (téléchargement du modèle Whisper ~3Go)
docker compose up -d --build
```

### 5. Vérification
Vérifiez que le conteneur tourne correctement :
```bash
docker compose logs -f
```
Vous devriez voir "Server running on port 3000".

## 📱 Partie 2 : Application Mobile (EAS)

L'application mobile a déjà été configurée pour pointer vers votre IP Linode (`172.238.81.245`).

### 1. Installation de EAS CLI
Si ce n'est pas déjà fait :
```bash
npm install -g eas-cli
```

### 2. Connexion à Expo
```bash
eas login
```

### 3. Création du Build Android
Dans le dossier `mobile/mobile-app` :

Pour un fichier `.apk` (test direct sur téléphone) :
```bash
eas build --profile development --platform android
```
*Note : Cela utilisera le profil "development" défini dans `eas.json` qui produit un APK.*

Pour le Play Store (fichier `.aab` production) :
```bash
eas build --profile production --platform android
```

### 4. Création du Build iOS (si nécessaire)
Nécessite un compte Apple Developer payant.
```bash
eas build --profile production --platform ios
```

## 🔄 Mises à jour futures

### Backend
1. Copiez les nouveaux fichiers sur le serveur.
2. Relancez : `docker compose up -d --build`

### Mobile
1. Modifiez le code.
2. Relancez une commande `eas build`.
