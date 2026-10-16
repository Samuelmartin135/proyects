/**
 * Máquina de estados de un cobro (lógica pura, sin pantallas).
 *
 *   idle → registering → preparing → waiting_card → processing → finished
 *
 * Reglas:
 * - El progreso nunca retrocede (si llega un evento viejo, se ignora).
 * - Solo se puede cancelar antes de leer la tarjeta (preparing / waiting_card).
 * - Una vez terminado, el estado ya no cambia.
 */

import type { ChargeProgress, ChargeResult } from '@/payments/PaymentProvider';

export type ChargePhase = 'idle' | 'registering' | ChargeProgress | 'finished';

export type ChargeState = {
  phase: ChargePhase;
  saleId: string | null;
  result: ChargeResult | null;
  /** true si el resultado no se pudo guardar (hay que reintentar luego). */
  saveFailed: boolean;
  cancelRequested: boolean;
};

export type ChargeEvent =
  | { type: 'REGISTERING'; saleId: string }
  | { type: 'PROGRESS'; progress: ChargeProgress }
  | { type: 'CANCEL_REQUESTED' }
  | { type: 'FINISHED'; result: ChargeResult; saved: boolean };

export const initialChargeState: ChargeState = {
  phase: 'idle',
  saleId: null,
  result: null,
  saveFailed: false,
  cancelRequested: false,
};

const ORDER: Record<ChargePhase, number> = {
  idle: 0,
  registering: 1,
  preparing: 2,
  waiting_card: 3,
  processing: 4,
  finished: 5,
};

export function canCancel(state: ChargeState): boolean {
  return (state.phase === 'preparing' || state.phase === 'waiting_card') && !state.cancelRequested;
}

export function chargeReducer(state: ChargeState, event: ChargeEvent): ChargeState {
  if (state.phase === 'finished') return state;

  switch (event.type) {
    case 'REGISTERING':
      return state.phase === 'idle' ? { ...state, phase: 'registering', saleId: event.saleId } : state;

    case 'PROGRESS':
      return ORDER[event.progress] > ORDER[state.phase] ? { ...state, phase: event.progress } : state;

    case 'CANCEL_REQUESTED':
      return canCancel(state) ? { ...state, cancelRequested: true } : state;

    case 'FINISHED':
      return { ...state, phase: 'finished', result: event.result, saveFailed: !event.saved };
  }
}

/** Textos de la pantalla "Acerque la tarjeta" para cada etapa. */
export function phaseCopy(state: ChargeState): { title: string; subtitle: string } {
  if (state.cancelRequested && state.phase !== 'finished') {
    return { title: 'Cancelando…', subtitle: 'Un momento, por favor.' };
  }
  switch (state.phase) {
    case 'idle':
    case 'registering':
    case 'preparing':
      return { title: 'Preparando el cobro…', subtitle: 'Un momento, por favor.' };
    case 'waiting_card':
      return { title: 'Acerque la tarjeta', subtitle: 'a la parte de atrás del celular' };
    case 'processing':
      return { title: 'Procesando…', subtitle: 'No retire la tarjeta todavía.' };
    case 'finished':
      return { title: 'Listo', subtitle: '' };
  }
}
