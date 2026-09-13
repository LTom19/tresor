import { z } from 'zod';

const MAX_AMOUNT = 1_000_000_000;

/** Évite les erreurs flottantes (ex. 34.95 * 100 !== 3495 en JavaScript). */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

const amount = z.number()
  .finite()
  .positive()
  .max(MAX_AMOUNT)
  .transform(roundMoney);

const balance = z.number()
  .finite()
  .min(-MAX_AMOUNT)
  .max(MAX_AMOUNT)
  .transform(roundMoney);

const target = z.literal('courant');
const livret = z.enum(['economies', 'poche']);
const id = z.string().uuid();
const name = z.string().trim().min(1).max(255);
const motif = z.string().trim().max(500).optional();

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day;
  }, 'Date invalide');

const duration = z.discriminatedUnion('type', [
  z.object({ type: z.literal('indefinite') }).strict(),
  z.object({ type: z.literal('months'), value: z.number().int().min(1).max(1200) }).strict(),
  z.object({ type: z.literal('years'), value: z.number().int().min(1).max(100) }).strict(),
]);

const monthlyData = z.object({
  name,
  amount,
  dayOfMonth: z.number().int().min(1).max(31),
  startDate: isoDate,
  duration,
}).strict();

const annualData = z.object({
  name,
  amount,
  date: isoDate,
  startDate: isoDate,
  duration,
}).strict();

const incomeData = z.object({
  name,
  amount,
  dayOfMonth: z.number().int().min(1).max(31),
  startDate: isoDate,
}).strict();

export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setBalance'), payload: z.object({ target, amount: balance }).strict() }),
  z.object({ type: z.literal('addMoney'), payload: z.object({ target, amount, motif }).strict() }),
  z.object({ type: z.literal('withdrawMoney'), payload: z.object({ target, amount, motif }).strict() }),
  z.object({
    type: z.literal('transferCourantLivret'),
    payload: z.object({
      direction: z.enum(['to_livret', 'to_courant']),
      sub: livret,
      amount,
    }).strict(),
  }),
  z.object({ type: z.literal('addMonthlySubscription'), payload: z.object({ data: monthlyData }).strict() }),
  z.object({ type: z.literal('updateMonthlySubscription'), payload: z.object({ id, data: monthlyData }).strict() }),
  z.object({ type: z.literal('removeMonthlySubscription'), payload: z.object({ id }).strict() }),
  z.object({ type: z.literal('addAnnualSubscription'), payload: z.object({ data: annualData }).strict() }),
  z.object({ type: z.literal('updateAnnualSubscription'), payload: z.object({ id, data: annualData }).strict() }),
  z.object({ type: z.literal('removeAnnualSubscription'), payload: z.object({ id }).strict() }),
  z.object({ type: z.literal('addIncome'), payload: z.object({ data: incomeData }).strict() }),
  z.object({ type: z.literal('updateIncome'), payload: z.object({ id, data: incomeData }).strict() }),
  z.object({ type: z.literal('removeIncome'), payload: z.object({ id }).strict() }),
  z.object({
    type: z.literal('setAlertDaysBefore'),
    payload: z.object({ days: z.number().int().min(1).max(30) }).strict(),
  }),
]);

export type ValidatedAction = z.infer<typeof actionSchema>;
