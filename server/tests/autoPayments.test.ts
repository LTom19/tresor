import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppState } from '../src/types.js';
import { applyAutoPayments, getPendingAutoEvents } from '../src/services/autoPayments.js';
import { actionSchema } from '../src/validation/actions.js';

function emptyState(): AppState {
  return {
    compteCourant: 1_000,
    livretEconomies: 0,
    livretPoche: 0,
    monthlySubscriptions: [],
    annualSubscriptions: [],
    incomes: [],
    operations: [],
    processedAutoEvents: [],
    settings: { alertDaysBefore: 3 },
  };
}

test('rattrape les mensualités passées une seule fois', () => {
  const state = emptyState();
  state.monthlySubscriptions.push({
    id: 'rent',
    name: 'Loyer',
    amount: 100,
    dayOfMonth: 15,
    startDate: '2026-01-01',
    createdAt: '2026-01-01',
    duration: { type: 'indefinite' },
  });

  const first = applyAutoPayments(state, new Date(2026, 2, 20));
  assert.equal(first.compteCourant, 700);
  assert.deepEqual(first.processedAutoEvents, [
    'm-rent-2026-0',
    'm-rent-2026-1',
    'm-rent-2026-2',
  ]);
  assert.equal(first.operations.length, 3);
  assert.match(first.operations[0].motif ?? '', /Loyer/);

  const second = applyAutoPayments(first, new Date(2026, 2, 20));
  assert.strictEqual(second, first);
  assert.equal(second.compteCourant, 700);
});

test('ne prélève jamais avant la date de début ou de création', () => {
  const state = emptyState();
  state.monthlySubscriptions.push({
    id: 'future',
    name: 'Abonnement',
    amount: 25,
    dayOfMonth: 2,
    startDate: '2026-01-15',
    createdAt: '2026-01-10',
    duration: { type: 'indefinite' },
  });

  const pending = getPendingAutoEvents(state, new Date(2026, 1, 3));
  assert.deepEqual(pending.map((event) => event.id), ['m-future-2026-1']);
});

test('ne prélève pas une mensualité passée ajoutée aujourd’hui', () => {
  const state = emptyState();
  state.monthlySubscriptions.push({
    id: 'new-past-monthly',
    name: 'Ajout récent',
    amount: 120,
    dayOfMonth: 15,
    startDate: '2026-01-01',
    createdAt: '2026-07-28',
    duration: { type: 'indefinite' },
  });

  const next = applyAutoPayments(state, new Date(2026, 6, 28));
  assert.strictEqual(next, state);
  assert.equal(next.compteCourant, 1_000);
});

test('ne prélève pas une échéance annuelle passée ajoutée aujourd’hui', () => {
  const state = emptyState();
  state.annualSubscriptions.push({
    id: 'new-past-annual',
    name: 'Ajout annuel récent',
    amount: 80,
    date: '2026-07-03',
    startDate: '2026-07-03',
    createdAt: '2026-07-28',
    duration: { type: 'indefinite' },
  });

  const next = applyAutoPayments(state, new Date(2026, 6, 28));
  assert.strictEqual(next, state);
  assert.equal(next.compteCourant, 1_000);
});

test('conserve une date annuelle et déduplique par année', () => {
  const state = emptyState();
  state.annualSubscriptions.push({
    id: 'annual',
    name: 'Assurance',
    amount: 80,
    date: '2026-07-03',
    startDate: '2026-07-03',
    createdAt: '2026-07-01',
    duration: { type: 'indefinite' },
  });
  state.processedAutoEvents.push('a-annual-2026');

  const pending = getPendingAutoEvents(state, new Date(2027, 6, 4));
  assert.deepEqual(pending.map((event) => event.id), ['a-annual-2027']);
  assert.equal(pending[0].occurrence.getDate(), 3);
});

test('accepte les montants à deux décimales comme 34,95', () => {
  const result = actionSchema.safeParse({
    type: 'updateMonthlySubscription',
    payload: {
      id: '00000000-0000-4000-8000-000000000001',
      data: {
        name: 'Test',
        amount: 34.95,
        dayOfMonth: 5,
        startDate: '2026-07-01',
        duration: { type: 'indefinite' },
      },
    },
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.payload.data.amount, 34.95);
  }
});

test('rejette les montants négatifs et les cibles inconnues', () => {
  assert.equal(actionSchema.safeParse({
    type: 'withdrawMoney',
    payload: { target: 'courant', amount: -10 },
  }).success, false);

  assert.equal(actionSchema.safeParse({
    type: 'addMoney',
    payload: { target: 'inconnu', amount: 10 },
  }).success, false);
});
