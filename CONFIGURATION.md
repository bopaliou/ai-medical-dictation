# Configuration des clés API

## Fichiers d'environnement

Les clés API ont été déplacées dans les fichiers `.env` et `.env.example` pour des raisons de sécurité.

### Variables d'environnement disponibles

- `GITHUB_TOKEN` : Token d'authentification GitHub
- `SUPABASE_PROJECT_REF` : Référence du projet Supabase
- `SUPABASE_MCP_TOKEN` : Token MCP Supabase
- `SUPABASE_MCP_URL` : URL du service MCP Supabase
- `SUPABASE_DATABASE_PASSWORD` : Mot de passe de la base de données Supabase

### Configuration

1. Copiez `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```

2. Remplissez les valeurs dans `.env` avec vos clés API réelles.

3. Le fichier `.env` est ignoré par Git (voir `.gitignore`).

### Configuration MCP (Cursor)

Le fichier `mcp.json` dans `~/.cursor/` doit être configuré manuellement avec les valeurs des variables d'environnement. 

**Note** : Le format JSON de MCP ne supporte pas directement les variables d'environnement. Vous devez donc copier les valeurs depuis votre fichier `.env` vers `mcp.json`.

### Structure mcp.json attendue

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_MCP_TOKEN}"
      }
    }
  }
}
```

**Important** : Remplacez `${GITHUB_TOKEN}`, `${SUPABASE_PROJECT_REF}` et `${SUPABASE_MCP_TOKEN}` par les valeurs réelles de votre fichier `.env`.

