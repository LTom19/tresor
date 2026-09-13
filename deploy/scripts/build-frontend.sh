#!/bin/bash
# Build le frontend seul (préférez ./deploy/prepare-nas.sh pour un déploiement complet)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
echo "VITE_API_URL=/api" > .env.production.local
npm run build
echo ""
echo "Build terminé : dist/"
echo "Pour un déploiement NAS complet, utilisez plutôt :"
echo "  ./deploy/prepare-nas.sh"
echo ""
echo "Sinon, copiez dist/ vers le dossier web de votre dataset NAS."
