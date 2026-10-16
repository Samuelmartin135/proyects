/**
 * Elige el proveedor de pagos según el modo de la app:
 * - Prueba → MockPaymentProvider (simulado, nunca dinero real).
 * - Real   → SumUpPaymentProvider.
 *
 * Se usa una sola instancia por proveedor durante toda la sesión.
 */

import type { AppMode } from '@/lib/sale';

import { MockPaymentProvider } from './MockPaymentProvider';
import type { PaymentProvider } from './PaymentProvider';
import { SumUpPaymentProvider } from './SumUpPaymentProvider';

let mock: MockPaymentProvider | null = null;
let sumup: SumUpPaymentProvider | null = null;

export function getPaymentProvider(mode: AppMode): PaymentProvider {
  if (mode === 'test') {
    mock ??= new MockPaymentProvider();
    return mock;
  }
  sumup ??= new SumUpPaymentProvider();
  return sumup;
}

export type * from './PaymentProvider';
