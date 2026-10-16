/**
 * Propina opcional.
 * La propina se cobra junto con la venta, pero se guarda aparte para que el
 * resumen del día muestre cuánto fue venta y cuánto fue propina.
 */

import { formatCOP, isWholePesos } from './money';

export type TipOption =
  | { kind: 'none' }
  | { kind: 'percent'; percent: number }
  | { kind: 'custom'; amount: number };

/** Porcentajes que se ofrecen como botones rápidos. */
export const TIP_PERCENTS = [10, 15] as const;

export const NO_TIP: TipOption = { kind: 'none' };

/**
 * Calcula la propina en pesos enteros.
 * Los porcentajes se redondean al peso más cercano: 10 % de $12.345 → $1.235.
 */
export function calculateTip(amount: number, option: TipOption): number {
  switch (option.kind) {
    case 'none':
      return 0;
    case 'percent':
      // amount * percent es entero; se divide al final para no perder precisión.
      return Math.round((amount * option.percent) / 100);
    case 'custom':
      if (!isWholePesos(option.amount)) {
        throw new Error('La propina debe ser un número entero de pesos.');
      }
      return option.amount;
  }
}

/** Texto del botón de cada opción, p. ej. "10 % · $1.250". */
export function tipOptionLabel(amount: number, option: TipOption): string {
  switch (option.kind) {
    case 'none':
      return 'Sin propina';
    case 'percent':
      return `${option.percent} % · ${formatCOP(calculateTip(amount, option))}`;
    case 'custom':
      return option.amount > 0 ? `Otro valor · ${formatCOP(option.amount)}` : 'Otro valor';
  }
}

/** Dos opciones son la misma selección (para resaltar el botón elegido). */
export function isSameTipOption(a: TipOption, b: TipOption): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'percent' && b.kind === 'percent') return a.percent === b.percent;
  return true;
}
