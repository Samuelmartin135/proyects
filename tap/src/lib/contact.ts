/**
 * Correo o celular para ingresar con código (sin contraseña).
 * El comerciante escribe cualquiera de los dos en el mismo campo.
 */

export type Contact = { kind: 'email'; email: string } | { kind: 'phone'; phone: string };

export type ContactParse = { ok: true; contact: Contact } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Interpreta lo que escribió el comerciante.
 * - Correo: se pasa a minúsculas.
 * - Celular colombiano: 10 dígitos que empiezan por 3. Acepta espacios, guiones
 *   y el prefijo +57. Se normaliza a "+573001234567".
 */
export function parseContact(raw: string): ContactParse {
  const input = raw.trim();
  if (input === '') {
    return { ok: false, message: 'Escriba su correo o su número de celular.' };
  }

  if (input.includes('@')) {
    const email = input.toLowerCase();
    return EMAIL_RE.test(email)
      ? { ok: true, contact: { kind: 'email', email } }
      : { ok: false, message: 'Revise el correo: debe ser como nombre@correo.com' };
  }

  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2);

  if (/^3\d{9}$/.test(digits)) {
    return { ok: true, contact: { kind: 'phone', phone: `+57${digits}` } };
  }
  if (/^\d+$/.test(digits)) {
    return { ok: false, message: 'El celular debe tener 10 dígitos y empezar por 3.' };
  }
  return { ok: false, message: 'Escriba un correo o un celular válido.' };
}

/** Texto para mostrar a dónde se envió el código: "300 123 4567" o el correo. */
export function describeContact(contact: Contact): string {
  if (contact.kind === 'email') return contact.email;
  const local = contact.phone.replace(/^\+57/, '');
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

export const OTP_LENGTH = 6;

/** Deja solo dígitos y como máximo 6 (por si pegan el código con espacios). */
export function normalizeOtp(input: string): string {
  return input.replace(/\D/g, '').slice(0, OTP_LENGTH);
}
