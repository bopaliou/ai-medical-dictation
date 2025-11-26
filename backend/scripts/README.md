# Scripts Utilitaires Backend

## 🗑️ clear-patients.js

Script pour supprimer toutes les données de la table `patients` sur Supabase.

### ⚠️ ATTENTION
Cette opération est **irréversible** ! Toutes les notes associées aux patients seront également supprimées (via CASCADE).

### Usage

```bash
cd backend
npm run clear-patients
```

Le script va :
1. Afficher le nombre de patients à supprimer
2. Demander confirmation
3. Supprimer tous les patients (et leurs notes associées)
4. Vérifier que la suppression a réussi

### Alternative : SQL Direct

Vous pouvez aussi exécuter directement le SQL dans Supabase :

```sql
DELETE FROM patients;
```

Ou utiliser le fichier de migration :
```sql
-- backend/migrations/clear_patients_table.sql
```

---

**⚠️ Utilisez avec précaution en production !**

