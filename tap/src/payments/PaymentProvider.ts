/**
 * Contrato que debe cumplir cualquier proveedor de pagos (simulado, SumUp, …).
 *
 * TAP NO procesa pagos: solo le pide al proveedor que cobre y guarda el
 * resultado. Reglas para cualquier implementación:
 *
 * 1. Montos en pesos ENTEROS (COP). Si el SDK pide otro formato (decimales,
 *    centavos), la conversión se hace dentro del adaptador.
 * 2. NUNCA devolver, guardar ni registrar (console.log) datos de la tarjeta:
 *    número, últimos 4 dígitos, vencimiento, titular ni CVV. Lo único
 *    permitido es la marca (Visa, Mastercard…). Por eso estos tipos no tienen
 *    campos para esos datos.
 * 3. `reference` es el id de la venta (UUID). Si se cobra dos veces con la misma
 *    referencia, el proveedor debe devolver el resultado anterior, nunca cobrar
 *    de nuevo.
 */

import type { PaymentProviderId } from '@/lib/sale';

export type { PaymentProviderId };

/** Marcas que mostramos. Si el SDK reporta otra, se usa 'Otra'. */
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Diners Club' | 'Otra';

export type ChargeRequest = {
  /** Id de la venta (UUID). Sirve para evitar cobros dobles. */
  reference: string;
  /** Valor de la venta, sin propina, en pesos enteros. */
  amount: number;
  /** Propina en pesos enteros (0 si no hay). */
  tip: number;
  currency: 'COP';
  /** Texto corto opcional (p. ej. el nombre del negocio). */
  description?: string;
};

/** Etapas del cobro que la app muestra en pantalla. */
export type ChargeProgress =
  | 'preparing' // alistando el lector NFC
  | 'waiting_card' // "Acerque la tarjeta"
  | 'processing'; // tarjeta leída, esperando respuesta del banco

export type ChargeOutcome = 'approved' | 'declined' | 'canceled' | 'failed';

export type ChargeResult = {
  status: ChargeOutcome;
  /** Id del cobro en el sistema del proveedor (para conciliar y reembolsar). */
  providerTransactionId?: string;
  cardBrand?: CardBrand;
  /** Explicación en español, entendible para el comerciante, si no se aprobó. */
  failureReason?: string;
};

export type ProviderReadiness =
  | { ready: true }
  | {
      ready: false;
      /** Qué debe hacer el comerciante, en español (p. ej. "Encienda el NFC"). */
      reason: string;
    };

/** Estado de un cobro según el proveedor ("estado"). */
export type TransactionStatus =
  | { found: true; status: ChargeOutcome | 'refunded'; providerTransactionId?: string }
  | { found: false };

export type RefundRequest = {
  reference: string;
  /** Solo reembolsos totales en el MVP. */
};

export type RefundResult =
  | { status: 'refunded' }
  | { status: 'failed'; failureReason: string };

/** Un cobro en el historial del proveedor (para conciliar contra nuestra base). */
export type ProviderTransaction = {
  reference: string;
  providerTransactionId: string;
  status: ChargeOutcome | 'refunded';
  amount: number;
  tip: number;
  cardBrand?: CardBrand;
  createdAt: Date;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;

  /**
   * true si el SDK muestra su propia pantalla de "Acerque la tarjeta"
   * (probablemente el caso de SumUp). La app entonces no muestra la suya.
   */
  readonly showsOwnCardScreen: boolean;

  /** Revisa que se pueda cobrar: NFC encendido, sesión iniciada, etc. */
  prepare(): Promise<ProviderReadiness>;

  /**
   * Inicia un cobro ("iniciar cobro"). Llama a `onProgress` en cada etapa y
   * resuelve con el resultado final. Si algo falla de forma inesperada, debe
   * resolver con status 'failed' en vez de lanzar un error.
   */
  charge(request: ChargeRequest, onProgress?: (progress: ChargeProgress) => void): Promise<ChargeResult>;

  /** Cancela el cobro en curso si todavía no se leyó la tarjeta. */
  cancel(): Promise<void>;

  /** Consulta el estado de un cobro por su referencia ("estado"). */
  getStatus(reference: string): Promise<TransactionStatus>;

  /** Reembolsa un cobro aprobado ("reembolso"). */
  refund(request: RefundRequest): Promise<RefundResult>;

  /** Cobros del proveedor en un rango de fechas ("historial"), para conciliar. */
  listTransactions(range: { from: Date; to: Date }): Promise<ProviderTransaction[]>;
}
