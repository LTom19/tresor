import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { dispatchAction } from '../services/actions.js';
import { loadState } from '../services/stateService.js';
import { actionSchema } from '../validation/actions.js';

const router = Router();

router.use(authMiddleware);

router.get('/state', async (req: AuthRequest, res) => {
  try {
    const state = await loadState(req.user!.id);
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/actions', async (req: AuthRequest, res) => {
  try {
    const { type, payload } = actionSchema.parse(req.body);
    const state = await dispatchAction(req.user!.id, type, payload ?? {});
    res.json(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message ?? 'Données invalides' });
      return;
    }
    if (
      message === 'Solde insuffisant'
      || message === 'Élément introuvable'
      || message === 'Données invalides'
      || message === 'Montant invalide'
    ) {
      res.status(400).json({ error: message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
