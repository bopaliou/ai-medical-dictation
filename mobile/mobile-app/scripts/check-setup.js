/**
 * Script de vérification de la configuration avant les tests manuels
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration...\n');

let errors = [];
let warnings = [];

// 1. Vérifier app.json
console.log('1. Vérification de app.json...');
try {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  if (!appJson.expo?.extra?.API_BASE_URL) {
    errors.push('❌ API_BASE_URL non configuré dans app.json');
  } else {
    const apiUrl = appJson.expo.extra.API_BASE_URL;
    console.log(`   ✅ API_BASE_URL configuré: ${apiUrl}`);
    
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      warnings.push('⚠️  API_BASE_URL utilise localhost (ne fonctionnera pas sur appareil physique)');
    }
  }
} catch (error) {
  errors.push(`❌ Erreur lors de la lecture de app.json: ${error.message}`);
}

// 2. Vérifier les fichiers essentiels
console.log('\n2. Vérification des fichiers essentiels...');
const essentialFiles = [
  'app/_layout.tsx',
  'app/login.tsx',
  'app/onboarding.tsx',
  'app/(tabs)/index.tsx',
  'contexts/AuthContext.tsx',
  'services/authApi.ts',
  'config/api.ts',
];

essentialFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    errors.push(`❌ Fichier manquant: ${file}`);
  }
});

// 3. Vérifier package.json
console.log('\n3. Vérification de package.json...');
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    '@react-native-async-storage/async-storage',
    'expo-router',
    'axios',
    'react-native-svg',
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`   ✅ ${dep} installé`);
    } else {
      warnings.push(`⚠️  Dépendance manquante: ${dep}`);
    }
  });
} catch (error) {
  errors.push(`❌ Erreur lors de la lecture de package.json: ${error.message}`);
}

// 4. Vérifier les composants d'onboarding
console.log('\n4. Vérification des illustrations d\'onboarding...');
const onboardingFiles = [
  'components/OnboardingIllustrations.tsx',
  'assets/onboarding/onboarding-1.svg',
  'assets/onboarding/onboarding-2.svg',
  'assets/onboarding/onboarding-3.svg',
];

onboardingFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    warnings.push(`⚠️  Fichier manquant: ${file}`);
  }
});

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DE LA VÉRIFICATION\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Tous les contrôles sont passés !');
  console.log('\n🚀 Vous pouvez maintenant démarrer les tests manuels :');
  console.log('   1. Démarrer le backend: cd backend && npm start');
  console.log('   2. Démarrer l\'app: cd mobile/mobile-app && npm start');
  console.log('   3. Suivre le guide: TESTS_MANUELS.md');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERREURS CRITIQUES:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  AVERTISSEMENTS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  console.log('\n🔧 Corrigez les erreurs avant de continuer.');
  process.exit(errors.length > 0 ? 1 : 0);
}


