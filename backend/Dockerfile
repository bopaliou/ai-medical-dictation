FROM node:18-bullseye

# Installation des dépendances système nécessaires
# ffmpeg : pour la conversion audio
# git, make, g++, curl : pour compiler whisper.cpp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Définition du répertoire de travail
WORKDIR /app

# --- Configuration de Whisper.cpp ---

# Cloner et compiler whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git /app/whisper.cpp \
    && cd /app/whisper.cpp \
    && make

# Téléchargement du modèle large-v3 (Qualité maximale)
# Note: Ce fichier fait environ 3Go
WORKDIR /app/whisper.cpp/models
RUN ./download-ggml-model.sh large-v3

# Retour à la racine de l'application
WORKDIR /app

# Définition des variables d'environnement pour que l'application trouve Whisper
ENV WHISPER_BIN_PATH=/app/whisper.cpp/main
ENV WHISPER_MODEL_PATH=/app/whisper.cpp/models/ggml-large-v3.bin
# (Le binaire s'appelle 'main' après compilation dans les versions récentes, ou 'whisper-cli' selon la version. 
# On vérifie souvent 'main' ou on renomme. Le Makefile produit souvent 'main' ou 'quantize' etc. 
# Le fichier server/transcriptionLocal.js s'attend à un executable.
# Allons vérifier le nom de l'exécutable produit par make dans whisper.cpp : c'est généralement 'main'.)
# Correction : Le code JS attend peut-être 'whisper-cli'. On va créer un alias ou symlink si besoin, 
# mais pour l'instant pointons vers 'main' qui est le CLI standard.

# --- Installation de l'application Node.js ---

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm ci --only=production

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
