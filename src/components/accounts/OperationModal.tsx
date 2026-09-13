import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput, Input } from '../ui/Input';
import { parseAmount, livretSubLabel } from '../../utils/format';
import type { LivretSubAccount } from '../../types';

export type OperationKind =
  | 'set_balance'
  | 'add'
  | 'withdraw'
  | 'transfer_courant_livret'
  | 'transfer_livret_courant';

interface OperationModalProps {
  open: boolean;
  onClose: () => void;
  kind: OperationKind;
  destination?: LivretSubAccount;
  onConfirm: (amount: number, motif?: string) => void;
  error?: string;
}

function titleFor(kind: OperationKind, destination?: LivretSubAccount): string {
  const dest = destination ? livretSubLabel(destination) : '';
  switch (kind) {
    case 'set_balance':
      return 'Définir le solde';
    case 'add':
      return 'Ajouter de l\'argent';
    case 'withdraw':
      return 'Retirer de l\'argent';
    case 'transfer_courant_livret':
      return `Transférer vers ${dest}`;
    case 'transfer_livret_courant':
      return `Transférer ${dest} vers le Compte Courant`;
  }
}

export function OperationModal({
  open,
  onClose,
  kind,
  destination,
  onConfirm,
  error: externalError,
}: OperationModalProps) {
  const [amount, setAmount] = useState('');
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');

  const showMotif = kind === 'add' || kind === 'withdraw';

  const handleSubmit = () => {
    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0) {
      setError('Veuillez saisir un montant valide.');
      return;
    }
    setError('');
    onConfirm(parsed, showMotif ? motif.trim() || undefined : undefined);
    setAmount('');
    setMotif('');
  };

  const handleClose = () => {
    setAmount('');
    setMotif('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={titleFor(kind, destination)}>
      <div className="space-y-4">
        <AmountInput
          label="Montant"
          value={amount}
          onChange={setAmount}
          error={error || externalError}
          autoFocus
        />

        {showMotif && (
          <Input
            label="Motif (optionnel)"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. Courses, Remboursement…"
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} fullWidth>
            Annuler
          </Button>
          <Button onClick={handleSubmit} fullWidth>
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
