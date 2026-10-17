import { deriveAuthStatus, type AuthFacts } from '../authStatus';

const base: AuthFacts = {
  configured: true,
  sessionLoaded: true,
  hasSession: true,
  merchantLoaded: true,
  hasMerchant: true,
  merchantError: false,
};

describe('deriveAuthStatus', () => {
  it('sin Supabase configurado, la app queda lista en modo demo', () => {
    expect(deriveAuthStatus({ ...base, configured: false, sessionLoaded: false })).toBe('ready');
  });

  it('mientras revisa la sesión guardada, está cargando', () => {
    expect(deriveAuthStatus({ ...base, sessionLoaded: false })).toBe('loading');
  });

  it('sin sesión, debe ingresar', () => {
    expect(deriveAuthStatus({ ...base, hasSession: false })).toBe('signedOut');
  });

  it('con sesión pero sin negocio, debe registrarlo', () => {
    expect(deriveAuthStatus({ ...base, hasMerchant: false })).toBe('needsBusiness');
  });

  it('mientras carga el negocio, está cargando', () => {
    expect(deriveAuthStatus({ ...base, merchantLoaded: false })).toBe('loading');
  });

  it('si no se pudo cargar el negocio, muestra error (no lo manda a registrarse de nuevo)', () => {
    expect(deriveAuthStatus({ ...base, merchantError: true, hasMerchant: false })).toBe('error');
  });

  it('con sesión y negocio, está lista', () => {
    expect(deriveAuthStatus(base)).toBe('ready');
  });
});
