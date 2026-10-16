/**
 * Modo actual de la app: Prueba ('test') o Real ('live'), como en Stripe.
 *
 * - Siempre se arranca en Prueba (lo más seguro).
 * - El modo Real solo se puede activar si la verificación de identidad del
 *   comercio está aprobada (paso 5). Mientras tanto queda bloqueado.
 */

import { useSyncExternalStore } from 'react';

import type { AppMode } from '@/lib/sale';

let mode: AppMode = 'test';
let liveUnlocked = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMode(): AppMode {
  return mode;
}

export function subscribeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type ModeChange = { ok: true } | { ok: false; reason: string };

export const LIVE_LOCKED_REASON =
  'Para cobrar de verdad primero debe verificar su identidad. Mientras tanto puede usar el modo Prueba.';

/** Cambia de modo. El modo Real exige verificación aprobada. */
export function setMode(next: AppMode): ModeChange {
  if (next === 'live' && !liveUnlocked) return { ok: false, reason: LIVE_LOCKED_REASON };
  if (next !== mode) {
    mode = next;
    emit();
  }
  return { ok: true };
}

/**
 * La verificación de identidad llama esto cuando cambia su estado (paso 5).
 * Si se bloquea el modo Real estando en él, se vuelve a Prueba.
 */
export function setLiveUnlocked(unlocked: boolean) {
  liveUnlocked = unlocked;
  if (!unlocked && mode === 'live') mode = 'test';
  emit();
}

export function isLiveUnlocked(): boolean {
  return liveUnlocked;
}

/** Hook para las pantallas: se vuelve a pintar cuando cambia el modo. */
export function useAppMode(): AppMode {
  return useSyncExternalStore(subscribeMode, getMode, getMode);
}

/** Solo para pruebas: vuelve al estado inicial. */
export function resetModeForTests() {
  mode = 'test';
  liveUnlocked = false;
  emit();
}
