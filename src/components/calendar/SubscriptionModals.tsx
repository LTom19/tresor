import { useState } from 'react';
import type { AnnualSubscription, Income, MonthlySubscription } from '../../types';
import { parseAmount } from '../../utils/format';
import { parseDuration, todayISO } from '../../utils/subscription';
import { Button } from '../ui/Button';
import { AmountInput, Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { DurationFields, initDurationFields } from './DurationFields';

type MonthlyData = Omit<MonthlySubscription, 'id' | 'createdAt'>;
type AnnualData = Omit<AnnualSubscription, 'id' | 'createdAt'>;
type IncomeData = Omit<Income, 'id' | 'createdAt'>;

/** Modale ajout/édition abonnement mensuel */
export function MonthlySubscriptionModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: MonthlyData) => void;
  initial?: MonthlySubscription;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [day, setDay] = useState(initial ? String(initial.dayOfMonth) : '1');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const durInit = initDurationFields(initial?.duration);
  const [durationType, setDurationType] = useState(durInit.durationType);
  const [durationValue, setDurationValue] = useState(durInit.durationValue);
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = parseAmount(amount);
    const dayNum = parseInt(day, 10);
    const duration = parseDuration(durationType, durationValue);

    if (!name.trim()) { setError('Nom requis.'); return; }
    if (parsed === null || parsed <= 0) { setError('Montant invalide.'); return; }
    if (dayNum < 1 || dayNum > 31) { setError('Jour invalide (1–31).'); return; }
    if (!duration) { setError('Durée invalide.'); return; }
    if (!startDate) { setError('Date de début requise.'); return; }

    onSave({
      name: name.trim(),
      amount: parsed,
      dayOfMonth: dayNum,
      startDate,
      duration,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier l\'abonnement mensuel' : 'Nouvel abonnement mensuel'}
    >
      <div className="space-y-4">
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix, Loyer…" />
        <AmountInput label="Montant" value={amount} onChange={setAmount} />
        <Input label="Jour du mois" type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} hint="Entre 1 et 31" />
        <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} hint="Premier mois où l'abonnement s'applique (avec la durée choisie)" />
        <DurationFields
          durationType={durationType}
          durationValue={durationValue}
          onTypeChange={setDurationType}
          onValueChange={setDurationValue}
        />
        {error && <p className="text-sm text-wine">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Annuler</Button>
          <Button onClick={submit} fullWidth>{initial ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Modale ajout/édition abonnement annuel */
export function AnnualSubscriptionModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AnnualData) => void;
  initial?: AnnualSubscription;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const durInit = initDurationFields(initial?.duration);
  const [durationType, setDurationType] = useState(durInit.durationType);
  const [durationValue, setDurationValue] = useState(durInit.durationValue);
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = parseAmount(amount);
    const duration = parseDuration(durationType, durationValue);

    if (!name.trim()) { setError('Nom requis.'); return; }
    if (parsed === null || parsed <= 0) { setError('Montant invalide.'); return; }
    if (!date) { setError('Date de prélèvement requise.'); return; }
    if (!duration) { setError('Durée invalide.'); return; }
    if (!startDate) { setError('Date de début requise.'); return; }

    onSave({
      name: name.trim(),
      amount: parsed,
      date,
      startDate,
      duration,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier l\'abonnement annuel' : 'Nouvel abonnement annuel'}
    >
      <div className="space-y-4">
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Assurance, Impôt…" />
        <AmountInput label="Montant" value={amount} onChange={setAmount} />
        <Input label="Date de prélèvement (chaque année)" type="date" value={date} onChange={(e) => setDate(e.target.value)} hint="Se répète chaque année à cette date" />
        <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} hint="Première année où l'abonnement s'applique (avec la durée choisie)" />
        <DurationFields
          durationType={durationType}
          durationValue={durationValue}
          onTypeChange={setDurationType}
          onValueChange={setDurationValue}
        />
        {error && <p className="text-sm text-wine">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Annuler</Button>
          <Button onClick={submit} fullWidth>{initial ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Modale ajout/édition revenu (salaire) */
export function IncomeModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: IncomeData) => void;
  initial?: Income;
}) {
  const [name, setName] = useState(initial?.name ?? 'Salaire');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [day, setDay] = useState(initial ? String(initial.dayOfMonth) : '1');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = parseAmount(amount);
    const dayNum = parseInt(day, 10);

    if (!name.trim()) { setError('Nom requis.'); return; }
    if (parsed === null || parsed <= 0) { setError('Montant invalide.'); return; }
    if (dayNum < 1 || dayNum > 31) { setError('Jour invalide (1–31).'); return; }
    if (!startDate) { setError('Date de début requise.'); return; }

    onSave({ name: name.trim(), amount: parsed, dayOfMonth: dayNum, startDate });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le revenu' : 'Nouveau revenu'}
    >
      <div className="space-y-4">
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="Salaire, Prime…" />
        <AmountInput label="Montant" value={amount} onChange={setAmount} />
        <Input label="Jour du mois" type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} hint="Jour de versement chaque mois" />
        <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} hint="Premier mois où le revenu s'applique" />
        {error && <p className="text-sm text-wine">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Annuler</Button>
          <Button onClick={submit} fullWidth>{initial ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
      </div>
    </Modal>
  );
}
