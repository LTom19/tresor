# Trésor — Gestion financière personnelle

Application web de gestion de finances personnelles, entièrement en français.

Le déploiement de référence se fait via une **Custom App TrueNAS**. L’application peut aussi être adaptée pour tourner autrement (Docker Compose, VPS, machine locale, etc.).

## Fonctionnalités

- **Compte Courant** et **Placement** (Livret A + Épargne)
- Transferts Compte ↔ Livret A et Compte ↔ Épargne
- **Calendrier** des abonnements mensuels et annuels
- **Récapitulatif** avec prévision de solde en fin de mois
- **Alertes** préventives et solde insuffisant
- **Historique** des opérations
- Authentification et persistance via une API Node.js + PostgreSQL

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Node.js (Express) + PostgreSQL
- Framer Motion, date-fns

## Démarrage local

1. Copiez `.env.example` vers `server/.env` et renseignez `DATABASE_URL` et `JWT_SECRET`.
2. Adaptez `src/content/legalInfo.ts` (mentions légales).
3. Installez et lancez le frontend :

```bash
npm install
npm run dev
```

4. Dans un autre terminal, lancez l’API (voir `server/`).

L’URL affichée est en général http://localhost:5173.

## Build production

```bash
npm run build
npm run preview
```

## Déploiement

Le guide de référence (Custom App TrueNAS + nginx) est dans [`DEPLOY.md`](DEPLOY.md).

nginx sert le frontend depuis un stockage monté dans l’app : `/data/tresor` → `/mnt/tank/Tresor` (le `root` nginx est `/data/tresor/web`).

## Licence

Ce projet est sous [Apache License 2.0](LICENSE) : vous pouvez l’utiliser, le modifier et le redistribuer, y compris dans un projet commercial, en conservant les mentions de licence et de copyright.
