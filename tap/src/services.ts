/**
 * Servicios compartidos de la app (una sola instancia de cada uno).
 * En las pruebas se reemplaza este módulo con jest.mock('@/services').
 */

import * as Crypto from 'expo-crypto';

import { MemorySaleRepository } from '@/data/MemorySaleRepository';
import type { SaleRepository } from '@/data/SaleRepository';

/** Ventas. TODO(paso 6): reemplazar por el repositorio de Supabase. */
export const saleRepository: SaleRepository = new MemorySaleRepository();

/** Id único para cada venta (también es la referencia del cobro ante el proveedor). */
export function newSaleId(): string {
  return Crypto.randomUUID();
}
