/**
 * Proveedor de pagos SIMULADO, para el modo Prueba y las demos.
 * No mueve dinero real. Imita los tiempos de un cobro con tarjeta de verdad.
 *
 * Montos especiales para demos (según cómo termina el TOTAL, con propina):
 *   …013 → rechazado: "Fondos insuficientes"       (ej. $5.013)
 *   …014 → rechazado: "Tarjeta no permitida"       (ej. $5.014)
 *   …015 → nadie acerca la tarjeta: tiempo agotado (ej. $5.015)
 *   cualquier otro → aprobado
 */

import type {
  CardBrand,
  ChargeProgress,
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  ProviderReadiness,
  ProviderTransaction,
  RefundRequest,
  RefundResult,
  TransactionStatus,
} from './PaymentProvider';

export const MOCK_MAGIC_ENDINGS = {
  insufficientFunds: 13,
  cardNotAllowed: 14,
  noCardTimeout: 15,
} as const;

/** Tiempos simulados en milisegundos: [mínimo, máximo]. */
export const MOCK_TIMINGS = {
  preparing: [400, 600],
  waitingCard: [2000, 3500],
  processing: [1500, 2500],
  /** Cuánto espera antes de rendirse si nadie acerca la tarjeta (en la vida real ~60 s). */
  noCardTimeout: [6000, 6000],
} as const;

type Range = readonly [number, number];

export type MockOptions = {
  /** Espera; se reemplaza en las pruebas para no esperar de verdad. */
  sleep?: (ms: number) => Promise<void>;
  /** Número aleatorio en [0, 1). Se reemplaza en las pruebas. */
  random?: () => number;
  /** Probabilidad de rechazo aleatorio (0 a 1). Por defecto 0: solo los montos especiales fallan. */
  declineRate?: number;
  now?: () => Date;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const BRANDS: CardBrand[] = ['Visa', 'Mastercard'];

export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock' as const;
  readonly showsOwnCardScreen = false;

  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;
  private readonly declineRate: number;
  private readonly now: () => Date;

  /** Cobros hechos en esta sesión (el simulador no guarda nada en disco). */
  private readonly transactions = new Map<string, ProviderTransaction>();
  /** Resultado original de cada referencia, para responder igual si se repite. */
  private readonly results = new Map<string, ChargeResult>();

  /** Cobro en curso; `cancel` resuelve la promesa para interrumpir la espera. */
  private current: { phase: ChargeProgress; cancel: () => void } | null = null;

  constructor(options: MockOptions = {}) {
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
    this.declineRate = options.declineRate ?? 0;
    this.now = options.now ?? (() => new Date());
  }

  async prepare(): Promise<ProviderReadiness> {
    return { ready: true };
  }

  async charge(
    request: ChargeRequest,
    onProgress: (progress: ChargeProgress) => void = () => {},
  ): Promise<ChargeResult> {
    // Idempotencia: la misma referencia nunca se cobra dos veces.
    const previous = this.results.get(request.reference);
    if (previous) return previous;

    if (this.current) {
      return { status: 'failed', failureReason: 'Ya hay un cobro en curso.' };
    }
    if (!Number.isSafeInteger(request.amount) || !Number.isSafeInteger(request.tip)) {
      return { status: 'failed', failureReason: 'El valor no es válido.' };
    }

    let cancelWait: () => void = () => {};
    const canceled = new Promise<'canceled'>((resolve) => {
      cancelWait = () => resolve('canceled');
    });
    this.current = { phase: 'preparing', cancel: () => cancelWait() };

    try {
      const total = request.amount + request.tip;
      const ending = total % 1000;

      // 1) Preparar el lector (se puede cancelar).
      this.setPhase('preparing', onProgress);
      if ((await this.wait(MOCK_TIMINGS.preparing, canceled)) === 'canceled') {
        return this.finish(request, { status: 'canceled', failureReason: 'Cobro cancelado.' });
      }

      // 2) Esperar la tarjeta (se puede cancelar).
      this.setPhase('waiting_card', onProgress);
      if (ending === MOCK_MAGIC_ENDINGS.noCardTimeout) {
        const outcome = await this.wait(MOCK_TIMINGS.noCardTimeout, canceled);
        return this.finish(request, {
          status: 'canceled',
          failureReason:
            outcome === 'canceled'
              ? 'Cobro cancelado.'
              : 'Se agotó el tiempo: no se acercó ninguna tarjeta.',
        });
      }
      if ((await this.wait(MOCK_TIMINGS.waitingCard, canceled)) === 'canceled') {
        return this.finish(request, { status: 'canceled', failureReason: 'Cobro cancelado.' });
      }

      // 3) Procesar con el "banco" (ya NO se puede cancelar: la tarjeta fue leída).
      this.setPhase('processing', onProgress);
      await this.sleep(this.pick(MOCK_TIMINGS.processing));

      if (ending === MOCK_MAGIC_ENDINGS.insufficientFunds) {
        return this.finish(request, { status: 'declined', failureReason: 'Fondos insuficientes.' });
      }
      if (ending === MOCK_MAGIC_ENDINGS.cardNotAllowed) {
        return this.finish(request, {
          status: 'declined',
          failureReason: 'Tarjeta no permitida. Pida al cliente otra tarjeta.',
        });
      }
      if (this.random() < this.declineRate) {
        return this.finish(request, { status: 'declined', failureReason: 'El banco rechazó el pago.' });
      }

      return this.finish(request, {
        status: 'approved',
        providerTransactionId: `mock_${request.reference.replace(/-/g, '').slice(0, 12)}`,
        cardBrand: BRANDS[Math.floor(this.random() * BRANDS.length)] ?? 'Visa',
      });
    } finally {
      this.current = null;
    }
  }

  async cancel(): Promise<void> {
    // Solo se puede cancelar antes de leer la tarjeta.
    if (this.current && this.current.phase !== 'processing') {
      this.current.cancel();
    }
  }

  async getStatus(reference: string): Promise<TransactionStatus> {
    const tx = this.transactions.get(reference);
    if (!tx) return { found: false };
    return { found: true, status: tx.status, providerTransactionId: tx.providerTransactionId };
  }

  async refund({ reference }: RefundRequest): Promise<RefundResult> {
    const tx = this.transactions.get(reference);
    if (!tx) return { status: 'failed', failureReason: 'No se encontró el cobro.' };
    if (tx.status === 'refunded') return { status: 'refunded' }; // idempotente
    if (tx.status !== 'approved') {
      return { status: 'failed', failureReason: 'Solo se pueden reembolsar pagos aprobados.' };
    }
    this.transactions.set(reference, { ...tx, status: 'refunded' });
    return { status: 'refunded' };
  }

  async listTransactions({ from, to }: { from: Date; to: Date }): Promise<ProviderTransaction[]> {
    return [...this.transactions.values()].filter(
      (tx) => tx.createdAt >= from && tx.createdAt < to,
    );
  }

  // -------------------------------------------------------------------------

  private setPhase(phase: ChargeProgress, onProgress: (p: ChargeProgress) => void) {
    if (this.current) this.current.phase = phase;
    onProgress(phase);
  }

  /** Número al azar dentro del rango [mín, máx]. */
  private pick([min, max]: Range): number {
    return Math.round(min + this.random() * (max - min));
  }

  /** Espera un tiempo del rango, o termina antes si cancelan. */
  private wait(range: Range, canceled: Promise<'canceled'>): Promise<'done' | 'canceled'> {
    return Promise.race([this.sleep(this.pick(range)).then(() => 'done' as const), canceled]);
  }

  /** Registra el cobro (para getStatus, reembolsos e historial) y devuelve el resultado. */
  private finish(request: ChargeRequest, result: ChargeResult): ChargeResult {
    this.results.set(request.reference, result);
    this.transactions.set(request.reference, {
      reference: request.reference,
      providerTransactionId: result.providerTransactionId ?? `mock_${request.reference.slice(0, 8)}`,
      status: result.status,
      amount: request.amount,
      tip: request.tip,
      cardBrand: result.cardBrand,
      createdAt: this.now(),
    });
    return result;
  }
}
