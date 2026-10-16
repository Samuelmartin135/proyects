/**
 * Venta: tipos compartidos por la app, la base de datos y los resúmenes.
 * No hay (ni debe haber) ningún campo con datos de la tarjeta, salvo la marca.
 */

export type SaleStatus =
  | 'pending' // creada, el cobro está en curso
  | 'approved' // pagada
  | 'declined' // la tarjeta o el banco la rechazó
  | 'canceled' // se canceló antes de pagar (o nadie acercó la tarjeta)
  | 'failed' // error técnico: no se cobró
  | 'refunded'; // estaba pagada y se devolvió el dinero

export type PaymentProviderId = 'mock' | 'sumup';

/**
 * Modo de la app, como en Stripe:
 * - 'test' (Prueba): cobros simulados, sin dinero real.
 * - 'live' (Real): cobros de verdad; exige verificación de identidad aprobada.
 */
export type AppMode = 'test' | 'live';

export type Sale = {
  /** UUID generado en la app; también es la referencia del cobro ante el proveedor. */
  id: string;
  /** Valor de la venta en pesos, sin propina. */
  amount: number;
  /** Propina en pesos (0 si no hubo). */
  tip: number;
  status: SaleStatus;
  mode: AppMode;
  provider: PaymentProviderId;
  /** Id del cobro en el sistema del proveedor (para conciliar y reembolsar). */
  providerTransactionId: string | null;
  /** Marca de la tarjeta (Visa, Mastercard…). Nunca números de tarjeta. */
  cardBrand: string | null;
  /** Explicación en español cuando no se pudo cobrar. */
  failureReason: string | null;
  createdAt: Date;
};

/** Total que paga el cliente. */
export function saleTotal(sale: Pick<Sale, 'amount' | 'tip'>): number {
  return sale.amount + sale.tip;
}

/** Solo las ventas aprobadas suman en los totales. */
export function countsTowardTotals(status: SaleStatus): boolean {
  return status === 'approved';
}

/** Número corto y fácil de leer para el recibo: "A1B2C3D4". */
export function shortSaleCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** Texto del estado para mostrar al comerciante. */
export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  pending: 'En proceso',
  approved: 'Aprobada',
  declined: 'Rechazada',
  canceled: 'Cancelada',
  failed: 'No se completó',
  refunded: 'Reembolsada',
};
