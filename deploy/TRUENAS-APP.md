# Trésor — Custom App TrueNAS (copier-coller)

Un dossier sur le serveur + une Application personnalisée TrueNAS. Le même paquet peut être adapté à un autre hébergement.

---

## 1. Préparer les fichiers (sur votre PC)

```bash
cd AppFinance
chmod +x deploy/prepare-nas.sh
./deploy/prepare-nas.sh
```

Cela crée `deploy/nas-upload/` avec **backend + frontend** (tout ce qu’il faut copier sur le serveur).

---

## 2. Copier sur le serveur

Copiez **tout le contenu** de `deploy/nas-upload/` vers :

```
/mnt/tank/Tresor/
```

Résultat sur le serveur :

```
/mnt/tank/Tresor/
├── package.json
├── package-lock.json
├── node_modules/
├── dist/              ← API Node.js (Custom App)
│   ├── index.js
│   ├── migrate.js
│   └── …
├── migrations/
│   └── 001_init.sql
└── web/               ← frontend React (nginx root)
    ├── index.html
    └── assets/
```

nginx lit le frontend via un stockage monté dans l’app nginx : `/data/tresor` → `/mnt/tank/Tresor` (dans le conteneur : `root /data/tresor/web;`).

---

## 3. Custom App TrueNAS — copier-coller

**Apps → Discover Apps → Custom App → Ajouter**

### Application name
```
tresor-api
```

### Image Configuration
| Champ | Valeur |
|---|---|
| Repository | `node` |
| Tag | `22-bookworm-slim` |
| Pull Policy | Pull the image if it is not already present |

### Container Configuration
| Champ | Valeur |
|---|---|
| Entrypoint | `sh` |
| Commande | `-c` |
| *(2ᵉ ligne commande)* | `/app/start.sh` |
| Fuseau horaire | `Europe/Paris` |

**Variables d'environnement :**

| Nom | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `1010` |
| `DATABASE_URL` | `postgresql://tresor:VOTRE_MDP@IP_POSTGRES:5432/db_tresor` |
| `JWT_SECRET` | *(générez : `openssl rand -base64 48`)* |
| `CORS_ORIGIN` | `https://votre-domaine.example` |
| `DISABLE_REGISTRATION` | *(optionnel)* `true` pour fermer les inscriptions |
| `AUTO_PAYMENT_INTERVAL_MS` | `900000` *(15 minutes)* |
| `TZ` | `Europe/Paris` |

Restart Policy : **Unless Stopped**

### Network Configuration
| Champ | Valeur |
|---|---|
| Host Port | `1010` |
| Container Port | `1010` |
| Protocol | `TCP` |

(Pas de réseau custom — laissez vide.)

### Storage Configuration (app API)
| Champ | Valeur |
|---|---|
| Type | Host Path |
| Mount Path | `/app` |
| Host Path | `/mnt/tank/Tresor` |

### Resources (optionnel)
| Champ | Valeur |
|---|---|
| CPUs | `1` |
| Memory | `512` MB |

→ **Save / Install**

Test : `curl http://IP_SERVEUR:1010/health` → `{"status":"ok"}`

---

## 4. nginx

Ajoutez la config nginx (`deploy/nginx/tresor.conf`).

Dans les paramètres de l’app nginx, montez aussi ce stockage (même dataset que l’API) :

| Champ | Valeur |
|---|---|
| Type | Host Path |
| Mount Path | `/data/tresor` |
| Host Path | `/mnt/tank/Tresor` |

Dans le conteneur nginx :

- **root** : `/data/tresor/web` (équivalent hôte : `/mnt/tank/Tresor/web`)
- **proxy** `/api/` → `http://127.0.0.1:1010/api/`

### NPM
| Champ | Valeur |
|---|---|
| Domain | `votre-domaine.example` |
| Forward IP | IP du serveur |
| Forward Port | **80** (nginx) **ou 1010** (API sert aussi le frontend) |
| SSL | Let's Encrypt |

> **« Cannot GET / »** : NPM pointe vers le port **1010** sans frontend servi par l’API (ancienne version). Soit NPM → port **80** (nginx, `root /data/tresor/web`), soit recopiez la dernière version du backend (l’API sert aussi `/app/web`).

---

## 5. Mise à jour

1. `./deploy/prepare-nas.sh` sur votre PC
2. Recopiez `deploy/nas-upload/*` → `/mnt/tank/Tresor/`
3. Redémarrez l'app **tresor-api** dans TrueNAS
