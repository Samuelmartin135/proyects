/**
 * Orquesta un cobro completo, de forma segura:
 *
 * 1. Valida el monto.
 * 2. Revisa que el proveedor esté listo (NFC, sesión…).
 * 3. Registra la venta como 'pending' ANTES de cobrar. Si no se puede
 *    registrar, NO se cobra: nunca debe existir un cobro sin su venta.
 * 4. Pide el cobro al proveedor, usando el id de la venta como referencia.
 * 5. Guarda el resultado (con reintentos). Si aun así falla, lo informa
 *    para reintentar después; el cobro ya ocurrió y no se repite.
 *
 * Recibe todas sus dependencias como parámetros, así se puede probar sin
 * pantallas, sin internet y sin esperar.
 */

import { validateCharge } from '@/lib/money';
import type { AppMode, Sale } from '@/lib/sale';
import type { SaleCompletion, SaleRepository } from '@/data/SaleRepository';
import type { ChargeResult, PaymentProvider } from '@/payments/PaymentProvider';

import type { ChargeEvent } from './chargeMachine';

export type ChargeDeps = {
  provider: PaymentProvider;
  sales: SaleRepository;
  newId: () => string;
  now?: () => Date;
  /** Espera entre reintentos al guardar; se reemplaza en las pruebas. */
  sleep?: (ms: number) => Promise<void>;
};

export type ChargeInput = {
  amount: number;
  tip: number;
  mode: AppMode;
  description?: string;
};

export type ChargeReport = {
  /** La venta registrada, o null si ni siquiera se alcanzó a registrar (no se cobró). */
  sale: Sale | null;
  result: ChargeResult;
  /** false si el resultado no se pudo guardar en la base. */
  saved: boolean;
};

export const SAVE_ATTEMPTS = 3;

export const MESSAGES = {
  modeMismatch: 'Configuración inválida: el modo Prueba solo puede usar cobros simulados.',
  registerFailed:
    'No se pudo registrar la venta. Revise su conexión a internet e intente de nuevo. No se hizo ningún cobro.',
  providerCrashed:
    'Ocurrió un error con el lector de tarjetas. Revise el historial antes de volver a cobrar.',
} as const;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runCharge(
  deps: ChargeDeps,
  input: ChargeInput,
  dispatch: (event: ChargeEvent) => void = () => {},
): Promise<ChargeReport> {
  const now = deps.now ?? (() => new Date());
  const sleep = deps.sleep ?? defaultSleep;

  // Termina sin haber cobrado nada.
  const stopBeforeCharging = (failureReason: string): ChargeReport => {
    const result: ChargeResult = { status: 'failed', failureReason };
    dispatch({ type: 'FINISHED', result, saved: true });
    return { sale: null, result, saved: true };
  };

  // 1) Validar
  const validation = validateCharge(input.amount, input.tip);
  if (!validation.ok) return stopBeforeCharging(validation.message);

  // Seguridad: en modo Prueba jamás se usa un proveedor real.
  if (input.mode === 'test' && deps.provider.id !== 'mock') {
    return stopBeforeCharging(MESSAGES.modeMismatch);
  }

  // 2) ¿Está listo el proveedor?
  const readiness = await deps.provider.prepare();
  if (!readiness.ready) return stopBeforeCharging(readiness.reason);

  // 3) Registrar la venta antes de cobrar
  const id = deps.newId();
  dispatch({ type: 'REGISTERING', saleId: id });
  let sale: Sale;
  try {
    sale = await deps.sales.create({
      id,
      amount: input.amount,
      tip: input.tip,
      mode: input.mode,
      provider: deps.provider.id,
      createdAt: now(),
    });
  } catch {
    return stopBeforeCharging(MESSAGES.registerFailed);
  }

  // 4) Cobrar
  let result: ChargeResult;
  try {
    result = await deps.provider.charge(
      { reference: id, amount: input.amount, tip: input.tip, currency: 'COP', description: input.description },
      (progress) => dispatch({ type: 'PROGRESS', progress }),
    );
  } catch {
    // No sabemos si se cobró: se marca como fallido y se concilia después con getStatus.
    result = { status: 'failed', failureReason: MESSAGES.providerCrashed };
  }

  // 5) Guardar el resultado, con reintentos
  const completion = toCompletion(result);
  for (let attempt = 0; attempt < SAVE_ATTEMPTS; attempt++) {
    try {
      const saved = await deps.sales.complete(id, completion);
      dispatch({ type: 'FINISHED', result, saved: true });
      return { sale: saved, result, saved: true };
    } catch {
      if (attempt < SAVE_ATTEMPTS - 1) await sleep(500 * 2 ** attempt);
    }
  }

  dispatch({ type: 'FINISHED', result, saved: false });
  return { sale, result, saved: false };
}

/** Traduce el resultado del proveedor a lo que se guarda (lista blanca de campos). */
export function toCompletion(result: ChargeResult): SaleCompletion {
  return {
    status: result.status,
    providerTransactionId: result.providerTransactionId,
    cardBrand: result.cardBrand,
    failureReason: result.failureReason,
  };
}
