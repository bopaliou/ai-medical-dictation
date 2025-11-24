/**
 * Configuration globale pour les tests Jest
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    getSegments: jest.fn(() => []),
  }),
  useSegments: () => [],
  Stack: ({ children }) => children,
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        API_BASE_URL: 'http://localhost:3000',
      },
    },
  },
}));

// Supprimer les warnings console pendant les tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

