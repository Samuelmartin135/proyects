/**
 * Resumen del día: cuánto se vendió, cuántas ventas y el ticket promedio.
 */

import { countsTowardTotals, type Sale } from './sale';

export type DaySummary = {
  /** Suma de las ventas aprobadas, sin propinas. */
  totalSold: number;
  /** Suma de las propinas de las ventas aprobadas. */
  tips: number;
  /** Lo que entró en total: ventas + propinas. */
  totalCharged: number;
  /** Número de ventas aprobadas. */
  salesCount: number;
  /** Venta promedio (sin propina), redondeada al peso. 0 si no hubo ventas. */
  averageTicket: number;
};

/**
 * Calcula el resumen a partir de las ventas de un día.
 * Las ventas rechazadas, canceladas, fallidas, pendientes o reembolsadas no suman.
 */
export function summarizeSales(sales: readonly Pick<Sale, 'amount' | 'tip' | 'status'>[]): DaySummary {
  let totalSold = 0;
  let tips = 0;
  let salesCount = 0;

  for (const sale of sales) {
    if (!countsTowardTotals(sale.status)) continue;
    totalSold += sale.amount;
    tips += sale.tip;
    salesCount += 1;
  }

  return {
    totalSold,
    tips,
    totalCharged: totalSold + tips,
    salesCount,
    averageTicket: salesCount === 0 ? 0 : Math.round(totalSold / salesCount),
  };
}
