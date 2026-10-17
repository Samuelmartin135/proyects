/**
 * En qué punto está el comerciante (lógica pura, sin pantallas):
 *
 *   loading        → revisando la sesión guardada
 *   signedOut      → debe ingresar con su correo o celular
 *   needsBusiness  → ya ingresó, falta registrar su negocio
 *   ready          → puede usar la app
 *   error          → no se pudo cargar su negocio (sin internet, etc.)
 */

export type AuthStatus = 'loading' | 'signedOut' | 'needsBusiness' | 'ready' | 'error';

export type AuthFacts = {
  /** ¿Hay Supabase configurado? Sin él, la app funciona en modo demo sin cuenta. */
  configured: boolean;
  sessionLoaded: boolean;
  hasSession: boolean;
  merchantLoaded: boolean;
  hasMerchant: boolean;
  merchantError: boolean;
};

export function deriveAuthStatus(facts: AuthFacts): AuthStatus {
  if (!facts.configured) return 'ready';
  if (!facts.sessionLoaded) return 'loading';
  if (!facts.hasSession) return 'signedOut';
  if (facts.merchantError) return 'error';
  if (!facts.merchantLoaded) return 'loading';
  return facts.hasMerchant ? 'ready' : 'needsBusiness';
}
