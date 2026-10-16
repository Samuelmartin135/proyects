/**
 * Dónde se guardan las ventas.
 * Hoy: en memoria (MemorySaleRepository). Paso 6: Supabase, con la misma interfaz.
 */

import type { DayKey } from '@/lib/dates';
import type { AppMode, PaymentProviderId, Sale, SaleStatus } from '@/lib/sale';

/** Datos para crear una venta antes de cobrar (nace siempre como 'pending'). */
export type NewSale = {
  id: string;
  amount: number;
  tip: number;
  mode: AppMode;
  provider: PaymentProviderId;
  createdAt: Date;
};

/** Resultado final de un cobro, para cerrar la venta. */
export type SaleCompletion = {
  status: Extract<SaleStatus, 'approved' | 'declined' | 'canceled' | 'failed'>;
  providerTransactionId?: string;
  cardBrand?: string;
  failureReason?: string;
};

export interface SaleRepository {
  create(sale: NewSale): Promise<Sale>;
  complete(id: string, completion: SaleCompletion): Promise<Sale>;
  get(id: string): Promise<Sale | null>;
  /** Ventas de un día (hora Colombia) en un modo, de la más reciente a la más antigua. */
  listByDay(day: DayKey, mode: AppMode): Promise<Sale[]>;
  /** Avisa cuando cambia cualquier venta (para refrescar pantallas). */
  subscribe(listener: () => void): () => void;
}

/** Transiciones de estado permitidas (las mismas que impondrá la base de datos). */
export function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  if (from === 'pending') return to === 'approved' || to === 'declined' || to === 'canceled' || to === 'failed';
  if (from === 'approved') return to === 'refunded';
  return false;
}
