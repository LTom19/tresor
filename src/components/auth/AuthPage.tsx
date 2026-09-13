import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { openLegalPage } from '../../utils/legalRoute';
import { LegalFooterLinks } from '../legal/LegalPages';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function AuthPage() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && !acceptedTerms) {
      setError('Vous devez accepter les CGU et la politique de confidentialité.');
      return;
    }
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === 'login') await login(normalizedEmail, password);
      else await register(normalizedEmail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md rounded-3xl border border-paper-deep bg-paper-warm/60 p-8 shadow-lg">
        <h1 className="font-display text-3xl font-semibold text-ink mb-1">Trésor</h1>
        <p className="text-sm text-ink-muted mb-8">
          {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            hint="8 caractères minimum"
          />

          {mode === 'register' && (
            <label className="flex items-start gap-3 text-sm text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-copper"
                required
              />
              <span>
                J'accepte les{' '}
                <button
                  type="button"
                  onClick={() => openLegalPage('cgu')}
                  className="text-copper font-semibold hover:underline"
                >
                  conditions générales d'utilisation
                </button>{' '}
                et la{' '}
                <button
                  type="button"
                  onClick={() => openLegalPage('confidentialite')}
                  className="text-copper font-semibold hover:underline"
                >
                  politique de confidentialité
                </button>
                .
              </span>
            </label>
          )}

          {error && <p className="text-sm text-wine">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </Button>
        </form>

        <p className="text-sm text-center text-ink-muted mt-6">
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setAcceptedTerms(false);
            }}
            className="text-copper font-semibold hover:underline"
          >
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>

      <LegalFooterLinks className="mt-8 justify-center" />
    </div>
  );
}
