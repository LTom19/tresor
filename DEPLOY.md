# Trésor — déploiement

Le déploiement de référence est une **Custom App TrueNAS**. Le même paquet (API + frontend) peut être adapté à un autre serveur ou à Docker.

→ **Guide copier-coller TrueNAS** : [`deploy/TRUENAS-APP.md`](deploy/TRUENAS-APP.md)

```bash
./deploy/prepare-nas.sh          # prépare le backend + le frontend
# copier deploy/nas-upload/ → /mnt/tank/Tresor/  (adaptez le chemin)
# Custom App TrueNAS → voir TRUENAS-APP.md
./deploy/scripts/build-frontend.sh   # frontend seul, si besoin
```
