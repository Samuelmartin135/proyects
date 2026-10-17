/**
 * Sesión del comerciante y su negocio, disponibles en toda la app (useAuth).
 *
 * Sin Supabase configurado, la app arranca en modo demo sin cuenta: el estado
 * es 'ready' con un negocio de ejemplo, y todo funciona en modo Prueba.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMyMerchant } from '@/data/merchants';
import { isSupabaseConfigured, supabase } from '@/data/supabase';
import type { Merchant } from '@/lib/business';
import { describeContact } from '@/lib/contact';

import { deriveAuthStatus, type AuthStatus } from './authStatus';

export const DEMO_MERCHANT: Merchant = {
  id: 'demo',
  businessName: 'Su negocio',
  businessType: 'tienda',
  legalType: 'persona_natural',
};

export type AuthContextValue = {
  status: AuthStatus;
  /** false = modo demo sin cuenta (Supabase no configurado). */
  configured: boolean;
  merchant: Merchant | null;
  /** Correo o celular con el que ingresó, para mostrar en Cuenta. */
  contactLabel: string | null;
  /** Guarda el negocio recién registrado (pantalla "Su negocio"). */
  setMerchant: (merchant: Merchant) => void;
  /** Reintenta cargar el negocio tras un error de conexión. */
  retry: () => void;
  signOut: () => Promise<void>;
};

const demoValue: AuthContextValue = {
  status: 'ready',
  configured: false,
  merchant: DEMO_MERCHANT,
  contactLabel: null,
  setMerchant: () => {},
  retry: () => {},
  signOut: async () => {},
};

// Valor por defecto = modo demo, así las pantallas también funcionan en pruebas.
const AuthContext = createContext<AuthContextValue>(demoValue);

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured || !supabase) {
    return <AuthContext.Provider value={demoValue}>{children}</AuthContext.Provider>;
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const client = supabase!;
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // El negocio se guarda junto con el usuario al que pertenece: si cambia el
  // usuario (salir / entrar con otro), el dato anterior deja de valer solo.
  const [loadedMerchant, setLoadedMerchant] = useState<{
    userId: string;
    merchant: Merchant | null;
    error: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // 1) Sesión guardada + cambios de sesión (ingresar, salir, renovación).
  useEffect(() => {
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionLoaded(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  // 2) Con sesión, cargar su negocio.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchMyMerchant(client)
      .then((found) => {
        if (active) setLoadedMerchant({ userId, merchant: found, error: false });
      })
      .catch(() => {
        if (active) setLoadedMerchant({ userId, merchant: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [client, userId, attempt]);

  const current = loadedMerchant && loadedMerchant.userId === userId ? loadedMerchant : null;
  const merchant = current?.merchant ?? null;
  const merchantLoaded = !!current && !current.error;
  const merchantError = !!current?.error;

  const setMerchant = useCallback(
    (m: Merchant) => {
      if (userId) setLoadedMerchant({ userId, merchant: m, error: false });
    },
    [userId],
  );

  const retry = useCallback(() => {
    setLoadedMerchant(null); // vuelve a "cargando" mientras reintenta
    setAttempt((n) => n + 1);
  }, []);

  const signOut = useCallback(async () => {
    await client.auth.signOut();
  }, [client]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user;
    const contactLabel = user?.email
      ? user.email
      : user?.phone
        ? describeContact({ kind: 'phone', phone: `+${user.phone.replace(/^\+/, '')}` })
        : null;
    return {
      status: deriveAuthStatus({
        configured: true,
        sessionLoaded,
        hasSession: !!session,
        merchantLoaded,
        hasMerchant: !!merchant,
        merchantError,
      }),
      configured: true,
      merchant,
      contactLabel,
      setMerchant,
      retry,
      signOut,
    };
  }, [session, sessionLoaded, merchant, merchantLoaded, merchantError, setMerchant, retry, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
