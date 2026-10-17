/**
 * Ingreso sin contraseña: se envía un código de 6 dígitos por correo o SMS.
 * Si la persona no tiene cuenta, Supabase la crea al verificar el código.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Contact } from '@/lib/contact';

import { translateAuthError } from './authErrors';

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function sendCode(client: SupabaseClient, contact: Contact): Promise<AuthResult> {
  const { error } =
    contact.kind === 'email'
      ? await client.auth.signInWithOtp({ email: contact.email, options: { shouldCreateUser: true } })
      : await client.auth.signInWithOtp({
          phone: contact.phone,
          options: { shouldCreateUser: true, channel: 'sms' },
        });
  return error ? { ok: false, message: translateAuthError(error, 'send') } : { ok: true };
}

export async function verifyCode(client: SupabaseClient, contact: Contact, token: string): Promise<AuthResult> {
  const { error } =
    contact.kind === 'email'
      ? await client.auth.verifyOtp({ email: contact.email, token, type: 'email' })
      : await client.auth.verifyOtp({ phone: contact.phone, token, type: 'sms' });
  return error ? { ok: false, message: translateAuthError(error, 'verify') } : { ok: true };
}
