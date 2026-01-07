#!/bin/bash

echo "🚀 Migration vers Vite - Script de nettoyage"
echo "============================================="
echo ""

# Fichiers à supprimer
FILES_TO_DELETE=(
  "vue.config.js"
  "babel.config.cjs"
  "jest.config.js"
  "cypress.json"
  "public/index.html"
)

echo "📝 Fichiers qui seront supprimés :"
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ⚠️  $file (non trouvé)"
  fi
done

echo ""
read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration annulée"
  exit 1
fi

echo ""
echo "🗑️  Suppression des anciens fichiers..."

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ Supprimé: $file"
  fi
done

# Déplacer index.html si nécessaire
if [ -f "public/index.html" ]; then
  echo "  ℹ️  public/index.html devrait être supprimé (index.html existe à la racine)"
fi

echo ""
echo "📦 Installation des dépendances Vite..."
npm install

echo ""
echo "🧹 Nettoyage des anciennes dépendances..."
npm uninstall \
  @vue/cli-service \
  @vue/cli-plugin-babel \
  @vue/cli-plugin-e2e-cypress \
  @vue/cli-plugin-router \
  @vue/cli-plugin-unit-jest \
  @vue/cli-plugin-vuex \
  babel-core \
  @babel/core \
  @babel/plugin-transform-private-methods \
  compression-webpack-plugin \
  sass-loader \
  vue-cli-plugin-vuetify \
  vue-template-compiler \
  webpack \
  webpack-plugin-vuetify

echo ""
echo "✨ Migration terminée !"
echo ""
echo "📖 Prochaines étapes :"
echo "  1. Vérifiez les fichiers modifiés avec: git status"
echo "  2. Testez le projet avec: npm run start"
echo "  3. Consultez VITE_MIGRATION.md pour plus d'informations"
echo ""
echo "⚡ Commandes disponibles :"
echo "  - npm run dev     : Démarrer le serveur de développement"
echo "  - npm run build   : Compiler pour la production"
echo "  - npm run preview : Prévisualiser le build de production"
echo ""
