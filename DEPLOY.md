# Trésor — déploiement TrueNAS

→ **Guide copier-coller** : [`deploy/TRUENAS-APP.md`](deploy/TRUENAS-APP.md)

```bash
./deploy/prepare-nas.sh          # prépare le backend
# copier deploy/nas-upload/ → /mnt/tank/Tresor/  (adaptez le chemin)
# Custom App TrueNAS → voir TRUENAS-APP.md
./deploy/scripts/build-frontend.sh   # frontend → nginx
```

