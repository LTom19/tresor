#!/bin/bash
# Prépare deploy/nas-upload/ prêt à copier sur le NAS (backend + frontend)
# Usage : ./deploy/prepare-nas.sh
# Puis copiez deploy/nas-upload/* vers votre dataset NAS (ex. /mnt/tank/Tresor/)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/deploy/nas-upload"

echo "→ Build backend TypeScript…"
cd "$ROOT/server"
npm ci
rm -rf dist
npm run build

echo "→ Build frontend React…"
cd "$ROOT"
echo "VITE_API_URL=/api" > .env.production.local
npm run build

echo "→ Assemblage $OUT …"
rm -rf "$OUT"
mkdir -p "$OUT/dist" "$OUT/migrations" "$OUT/web"

cp -r "$ROOT/server/dist/"* "$OUT/dist/"
cp "$ROOT/server/migrations/"* "$OUT/migrations/"
cp "$ROOT/server/package.json" "$ROOT/server/package-lock.json" "$OUT/"
cp -r "$ROOT/dist/"* "$OUT/web/"
cp "$ROOT/deploy/start.sh" "$OUT/start.sh"
chmod +x "$OUT/start.sh"

echo "→ Installation des dépendances production (backend)…"
cd "$OUT"
npm ci --omit=dev

echo ""
echo "✓ Terminé !"
echo ""
echo "Copiez TOUT le contenu de :"
echo "  $OUT/"
echo "vers le NAS (adaptez le chemin) :"
echo "  /mnt/tank/Tresor/"
echo ""
echo "Structure sur le NAS :"
echo "  …/dist/        → API Node.js (Custom App)"
echo "  …/web/         → frontend React (nginx root)"
echo ""
echo "nginx root : …/web"
echo "Voir deploy/TRUENAS-APP.md"
