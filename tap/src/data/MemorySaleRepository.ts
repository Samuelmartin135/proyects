/**
 * Ventas guardadas en memoria: se pierden al cerrar la app.
 * Sirve mientras conectamos Supabase (paso 6) y en las pruebas.
 */

import { bogotaDayRange, type DayKey } from '@/lib/dates';
import type { AppMode, Sale } from '@/lib/sale';

import { canTransition, type NewSale, type SaleCompletion, type SaleRepository } from './SaleRepository';

export class MemorySaleRepository implements SaleRepository {
  private readonly sales = new Map<string, Sale>();
  private readonly listeners = new Set<() => void>();

  async create(input: NewSale): Promise<Sale> {
    if (this.sales.has(input.id)) throw new Error('La venta ya existe.');
    const sale: Sale = {
      ...input,
      status: 'pending',
      providerTransactionId: null,
      cardBrand: null,
      failureReason: null,
    };
    this.sales.set(sale.id, sale);
    this.emit();
    return sale;
  }

  async complete(id: string, completion: SaleCompletion): Promise<Sale> {
    const current = this.sales.get(id);
    if (!current) throw new Error('No se encontró la venta.');
    if (!canTransition(current.status, completion.status)) {
      throw new Error(`No se puede pasar de ${current.status} a ${completion.status}.`);
    }
    const updated: Sale = {
      ...current,
      status: completion.status,
      providerTransactionId: completion.providerTransactionId ?? null,
      cardBrand: completion.cardBrand ?? null,
      failureReason: completion.failureReason ?? null,
    };
    this.sales.set(id, updated);
    this.emit();
    return updated;
  }

  async get(id: string): Promise<Sale | null> {
    return this.sales.get(id) ?? null;
  }

  async listByDay(day: DayKey, mode: AppMode): Promise<Sale[]> {
    const { start, end } = bogotaDayRange(day);
    return [...this.sales.values()]
      .filter((s) => s.mode === mode && s.createdAt >= start && s.createdAt < end)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
