/**
 * Traduce los errores de Supabase Auth a mensajes claros en español.
 * Nunca mostramos al comerciante el texto técnico en inglés.
 */

type AuthErrorLike = { code?: string; status?: number; name?: string; message?: string } | null | undefined;

/** "send": al pedir el código. "verify": al escribir el código. */
export type AuthStep = 'send' | 'verify';

export const AUTH_MESSAGES = {
  badCode: 'El código no es correcto o ya venció. Revíselo o pida uno nuevo.',
  badContact: 'Revise el correo o el número de celular.',
  tooMany: 'Pidió demasiados códigos. Espere un minuto e intente de nuevo.',
  smsUnavailable: 'Por ahora no podemos enviar mensajes de texto. Ingrese con su correo.',
  emailUnavailable: 'Por ahora no podemos enviar correos. Ingrese con su celular.',
  offline: 'Sin conexión a internet. Revise su conexión e intente de nuevo.',
  generic: 'No se pudo completar. Intente de nuevo en un momento.',
} as const;

export function translateAuthError(error: AuthErrorLike, step: AuthStep): string {
  if (!error) return AUTH_MESSAGES.generic;
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (error.name === 'AuthRetryableFetchError' || message.includes('network request failed') || message.includes('failed to fetch')) {
    return AUTH_MESSAGES.offline;
  }
  if (error.status === 429 || code.includes('rate_limit')) {
    return AUTH_MESSAGES.tooMany;
  }
  if (code === 'phone_provider_disabled' || code === 'sms_send_failed') {
    return AUTH_MESSAGES.smsUnavailable;
  }
  if (code === 'email_provider_disabled') {
    return AUTH_MESSAGES.emailUnavailable;
  }
  const looksInvalid =
    code === 'otp_expired' || code === 'validation_failed' || message.includes('invalid') || message.includes('expired');
  if (looksInvalid) {
    return step === 'verify' ? AUTH_MESSAGES.badCode : AUTH_MESSAGES.badContact;
  }
  return AUTH_MESSAGES.generic;
}
