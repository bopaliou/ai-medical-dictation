# Tests de l'application mobile

Ce dossier contient tous les tests unitaires et d'intégration pour l'application mobile.

## Structure

```
__tests__/
├── app/                    # Tests pour les écrans
│   └── login.test.tsx
├── contexts/               # Tests pour les contextes React
│   └── AuthContext.test.tsx
├── hooks/                  # Tests pour les hooks personnalisés
│   └── useOnboarding.test.ts
├── services/               # Tests pour les services API
│   └── authApi.test.ts
├── integration/            # Tests d'intégration
│   └── authFlow.test.tsx
└── README.md               # Ce fichier
```

## Exécution des tests

### Tous les tests
```bash
npm test
```

### Mode watch (re-exécution automatique)
```bash
npm run test:watch
```

### Avec couverture de code
```bash
npm run test:coverage
```

## Types de tests

### Tests unitaires
- **Contextes** : Vérifient la logique des contextes React (AuthContext)
- **Hooks** : Vérifient le comportement des hooks personnalisés (useOnboarding)
- **Services** : Vérifient les appels API et la gestion d'erreurs (authApi)

### Tests d'intégration
- **Flux d'authentification** : Teste le flux complet de connexion/déconnexion
- **Persistance** : Vérifie que les données sont correctement sauvegardées et restaurées

### Tests d'écrans
- **Login** : Teste le formulaire de connexion, validation, gestion d'erreurs

## Configuration

Les tests utilisent :
- **Jest** : Framework de test
- **React Native Testing Library** : Utilitaires pour tester les composants React Native
- **Jest Expo** : Preset Jest pour Expo

## Mocking

Les mocks suivants sont configurés dans `jest.setup.js` :
- `@react-native-async-storage/async-storage` : Mock d'AsyncStorage
- `expo-router` : Mock du router Expo
- `expo-status-bar` : Mock de StatusBar
- `expo-constants` : Mock des constantes Expo

## Bonnes pratiques

1. **Isolation** : Chaque test est indépendant et nettoie son état
2. **Nommage** : Les noms de tests décrivent clairement ce qu'ils testent
3. **AAA Pattern** : Arrange, Act, Assert
4. **Mocking** : Mocker les dépendances externes (API, AsyncStorage, etc.)
5. **Coverage** : Viser une couverture de code élevée (>80%)

## Ajout de nouveaux tests

Pour ajouter un nouveau test :

1. Créer un fichier `*.test.tsx` ou `*.test.ts` dans le dossier approprié
2. Importer les dépendances nécessaires
3. Écrire les tests en suivant la structure existante
4. Exécuter les tests pour vérifier qu'ils passent

Exemple :
```typescript
describe('MonComposant', () => {
  beforeEach(() => {
    // Setup
  });

  it('devrait faire quelque chose', () => {
    // Test
  });
});
```

