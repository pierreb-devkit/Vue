#!/usr/bin/env node
/* eslint-disable */

/**
 * Script de vérification post-migration Vite
 * Vérifie que tous les fichiers nécessaires sont présents et configurés
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.bold.blue('\n🔍 Vérification de la migration Vite\n'));

const checks = {
  required: [
    { file: 'vite.config.js', desc: 'Configuration Vite' },
    { file: 'vitest.config.js', desc: 'Configuration Vitest' },
    { file: 'cypress.config.js', desc: 'Configuration Cypress' },
    { file: 'index.html', desc: "Point d'entrée HTML" },
    { file: 'src/main.js', desc: "Point d'entrée JS" },
    { file: 'package.json', desc: 'Package.json' },
  ],
  optional: [
    { file: '.env.example', desc: "Exemple de variables d'environnement" },
    { file: 'VITE_MIGRATION.md', desc: 'Guide de migration' },
    { file: 'VITE_COMMANDS.md', desc: 'Liste des commandes' },
  ],
  toRemove: [
    { file: 'vue.config.js', desc: 'Ancienne config Vue CLI' },
    { file: 'babel.config.cjs', desc: 'Config Babel (non nécessaire)' },
    { file: 'jest.config.js', desc: 'Config Jest (remplacé par Vitest)' },
    { file: 'cypress.json', desc: 'Ancienne config Cypress' },
  ],
};

let hasErrors = false;
let warnings = 0;

// Vérification des fichiers requis
console.log(chalk.bold('📋 Fichiers requis:'));
checks.required.forEach(({ file, desc }) => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  if (exists) {
    console.log(chalk.green(`  ✓ ${file}`), chalk.gray(`- ${desc}`));
  } else {
    console.log(chalk.red(`  ✗ ${file}`), chalk.gray(`- ${desc}`));
    hasErrors = true;
  }
});

// Vérification des fichiers optionnels
console.log(chalk.bold('\n📄 Fichiers optionnels:'));
checks.optional.forEach(({ file, desc }) => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  if (exists) {
    console.log(chalk.green(`  ✓ ${file}`), chalk.gray(`- ${desc}`));
  } else {
    console.log(chalk.yellow(`  ⚠ ${file}`), chalk.gray(`- ${desc} (recommandé)`));
    warnings++;
  }
});

// Vérification des fichiers à supprimer
console.log(chalk.bold('\n🗑️  Anciens fichiers (à supprimer):'));
checks.toRemove.forEach(({ file, desc }) => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  if (exists) {
    console.log(chalk.yellow(`  ⚠ ${file}`), chalk.gray(`- ${desc}`));
    oldFilesFound = true;
    warnings++;
  } else {
    console.log(chalk.green(`  ✓ ${file}`), chalk.gray('- Supprimé'));
  }
});

// Vérification du package.json
console.log(chalk.bold('\n📦 Vérification du package.json:'));
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

  // Vérifier les scripts
  const requiredScripts = ['dev', 'build', 'preview', 'generateConfig'];
  const missingScripts = requiredScripts.filter((script) => !packageJson.scripts[script]);

  if (missingScripts.length === 0) {
    console.log(chalk.green('  ✓ Scripts npm configurés'));
  } else {
    console.log(chalk.red('  ✗ Scripts manquants:'), missingScripts.join(', '));
    hasErrors = true;
  }

  // Vérifier les dépendances Vite
  const viteDeps = ['vite', '@vitejs/plugin-vue', 'vite-plugin-vuetify'];
  const missingDeps = viteDeps.filter((dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);

  if (missingDeps.length === 0) {
    console.log(chalk.green('  ✓ Dépendances Vite installées'));
  } else {
    console.log(chalk.red('  ✗ Dépendances manquantes:'), missingDeps.join(', '));
    hasErrors = true;
  }

  // Vérifier les anciennes dépendances Vue CLI
  const oldDeps = ['@vue/cli-service', 'webpack', 'babel-core'];
  const foundOldDeps = oldDeps.filter((dep) => packageJson.dependencies[dep] || packageJson.devDependencies[dep]);

  if (foundOldDeps.length === 0) {
    console.log(chalk.green('  ✓ Anciennes dépendances nettoyées'));
  } else {
    console.log(chalk.yellow('  ⚠ Anciennes dépendances trouvées:'), foundOldDeps.join(', '));
    warnings++;
  }
} catch (error) {
  console.log(chalk.red('  ✗ Erreur lors de la lecture du package.json'));
  hasErrors = true;
}

// Vérification de la config générée
console.log(chalk.bold('\n⚙️  Configuration générée:'));
const configPath = path.join(process.cwd(), 'src/config/index.cjs');
if (fs.existsSync(configPath)) {
  console.log(chalk.green('  ✓ src/config/index.cjs existe'));
  console.log(chalk.gray('    (généré par npm run generateConfig)'));
} else {
  console.log(chalk.yellow('  ⚠ src/config/index.cjs non trouvé'));
  console.log(chalk.gray('    Exécutez: npm run generateConfig'));
  warnings++;
}

// Résumé
console.log(chalk.bold('\n' + '='.repeat(50)));
if (hasErrors) {
  console.log(chalk.red.bold('❌ Migration incomplète - Des erreurs ont été détectées'));
  process.exit(1);
} else if (warnings > 0) {
  console.log(chalk.yellow.bold(`⚠️  Migration OK avec ${warnings} avertissement(s)`));
  console.log(chalk.gray("\nConsultez VITE_MIGRATION.md pour plus d'infos"));
  process.exit(0);
} else {
  console.log(chalk.green.bold('✅ Migration réussie !'));
  console.log(chalk.gray('\nCommandes disponibles:'));
  console.log(chalk.cyan('  npm run start   '), chalk.gray('- Démarrer en dev'));
  console.log(chalk.cyan('  npm run build   '), chalk.gray('- Build production'));
  console.log(chalk.cyan('  npm run preview '), chalk.gray('- Prévisualiser le build'));
  process.exit(0);
}
