import { AUTH_MESSAGES, translateAuthError } from '../authErrors';

describe('translateAuthError', () => {
  it('código vencido o incorrecto al verificar', () => {
    expect(translateAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid' }, 'verify')).toBe(
      AUTH_MESSAGES.badCode,
    );
  });

  it('dato inválido al pedir el código', () => {
    expect(translateAuthError({ code: 'validation_failed', message: 'Invalid phone number' }, 'send')).toBe(
      AUTH_MESSAGES.badContact,
    );
  });

  it('demasiados intentos', () => {
    expect(translateAuthError({ status: 429, message: 'too many' }, 'send')).toBe(AUTH_MESSAGES.tooMany);
    expect(translateAuthError({ code: 'over_email_send_rate_limit' }, 'send')).toBe(AUTH_MESSAGES.tooMany);
  });

  it('SMS no disponible', () => {
    expect(translateAuthError({ code: 'phone_provider_disabled' }, 'send')).toBe(AUTH_MESSAGES.smsUnavailable);
  });

  it('sin internet', () => {
    expect(translateAuthError({ name: 'AuthRetryableFetchError', message: 'Network request failed' }, 'verify')).toBe(
      AUTH_MESSAGES.offline,
    );
  });

  it('cualquier otra cosa da un mensaje general en español', () => {
    expect(translateAuthError({ message: 'Something weird' }, 'send')).toBe(AUTH_MESSAGES.generic);
    expect(translateAuthError(null, 'send')).toBe(AUTH_MESSAGES.generic);
  });
});
