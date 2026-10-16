/**
 * Proveedor de pagos SumUp (Tap to Pay en Android y en iPhone). ESQUELETO.
 *
 * Todavía no tenemos acceso al SDK. Esta clase cumple la interfaz y devuelve
 * un error claro ("aún no configurado") hasta que se conecte. El paso 8 de la
 * hoja de ruta completa los TODO y la guía del módulo nativo.
 *
 * Una sola clase para las dos plataformas: llama a un módulo nativo Expo local
 * con dos implementaciones (Kotlin para Android, Swift para iOS).
 *
 * iPhone (Tap to Pay on iPhone):
 * - La pantalla "acerque la tarjeta" es la NATIVA de Apple (framework
 *   ProximityReader): la abre el SDK de SumUp para iOS. Ninguna app puede
 *   dibujarla ni imitarla. Por eso showsOwnCardScreen = true.
 * - Requiere el permiso (entitlement)
 *   `com.apple.developer.proximity-reader.payment.acceptance`, que Apple otorga
 *   a cuentas de desarrollador de tipo ORGANIZACIÓN y solo con un proveedor
 *   compatible en el país (en Colombia: SumUp o Symbiotic, desde sept. 2026).
 *   Se agrega en app.json → ios.entitlements SOLO cuando Apple lo apruebe;
 *   antes rompe la compilación de iOS.
 * - iPhone XS o posterior con iOS actualizado.
 * - La hoja de Apple lee la tarjeta; la aprobación o el rechazo del banco
 *   llegan después por SumUp y los mostramos en nuestra pantalla de resultado.
 *
 * Android (SDK Tap-to-Pay de SumUp; developer.sumup.com):
 * - Paquete Maven privado `com.sumup.tap-to-pay:utopia-sdk` (credenciales por
 *   solicitud a SumUp). Exige minSdk 30 (Android 11+), compileSdk 36, Kotlin 2.
 * - Solo funciona en celulares reales con NFC (no en emuladores).
 * - `startPayment(checkoutData, …)` devuelve un flujo de eventos; el final es
 *   `TransactionDone(paymentOutput)` o `TransactionFailed(…)`.
 * - Requiere una "affiliate key" (registrada con el package de Android) y que
 *   cada comercio inicie sesión con SU cuenta SumUp (OAuth recomendado).
 * - Reembolsos e historial van por la API REST de SumUp con clave secreta:
 *   NUNCA desde la app; siempre a través de una Edge Function de Supabase.
 */

import type {
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

export const SUMUP_NOT_CONFIGURED =
  'Los cobros reales todavía no están disponibles: falta conectar SumUp.';

export class SumUpPaymentProvider implements PaymentProvider {
  readonly id = 'sumup' as const;
  // iPhone: pantalla nativa de Apple. Android: la del SDK de SumUp.
  readonly showsOwnCardScreen = true;

  async prepare(): Promise<ProviderReadiness> {
    // TODO(SumUp): llamar al módulo nativo para revisar NFC, sesión del comercio
    // y atestación del dispositivo.
    return { ready: false, reason: SUMUP_NOT_CONFIGURED };
  }

  async charge(
    _request: ChargeRequest,
    _onProgress?: (progress: ChargeProgress) => void,
  ): Promise<ChargeResult> {
    // TODO(SumUp): llamar a startPayment con amount + tip convertidos al formato
    // del SDK, currency COP y la referencia como id externo. Traducir los
    // eventos a ChargeProgress y el resultado con sumupMapper (lista blanca:
    // descartar últimos 4 dígitos y cualquier dato de la tarjeta).
    // Android: pasar skipSuccessScreen = true para mostrar nuestro resultado
    // (con "Compartir recibo") igual en las dos plataformas.
    return { status: 'failed', failureReason: SUMUP_NOT_CONFIGURED };
  }

  async cancel(): Promise<void> {
    // TODO(SumUp): cancelar el pago en curso si el SDK lo permite.
  }

  async getStatus(_reference: string): Promise<TransactionStatus> {
    // TODO(SumUp): consultar por referencia a través de la Edge Function.
    return { found: false };
  }

  async refund(_request: RefundRequest): Promise<RefundResult> {
    // TODO(SumUp): reembolso a través de la Edge Function (API REST de SumUp).
    return { status: 'failed', failureReason: SUMUP_NOT_CONFIGURED };
  }

  async listTransactions(_range: { from: Date; to: Date }): Promise<ProviderTransaction[]> {
    // TODO(SumUp): historial a través de la Edge Function (API REST de SumUp).
    return [];
  }
}
