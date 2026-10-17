import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { fetchMyMerchant } from '@/data/merchants';
import { supabase } from '@/data/supabase';

import { AuthProvider, useAuth } from '../AuthProvider';

jest.mock('@/data/supabase', () => {
  const listeners: ((event: string, session: unknown) => void)[] = [];
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn((cb) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
        signOut: jest.fn(),
        // Ayuda para las pruebas: simula un cambio de sesión.
        __emit: (session: unknown) => listeners.forEach((cb) => cb('SIGNED_IN', session)),
      },
    },
  };
});
jest.mock('@/data/merchants', () => ({ fetchMyMerchant: jest.fn() }));

const auth = supabase!.auth as unknown as {
  getSession: jest.Mock;
  __emit: (session: unknown) => void;
};
const fetchMerchant = fetchMyMerchant as jest.Mock;

const SESSION = { user: { id: 'user-1', email: 'rosa@gmail.com' } };
const MERCHANT = { id: 'm1', businessName: 'Tienda Doña Rosa', businessType: 'tienda', legalType: 'persona_natural' };

function Probe() {
  const { status, merchant, contactLabel } = useAuth();
  return <Text testID="probe">{`${status}|${merchant?.businessName ?? '-'}|${contactLabel ?? '-'}`}</Text>;
}

async function renderProvider() {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  return () => screen.getByTestId('probe').props.children as string;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    auth.getSession.mockReset();
    fetchMerchant.mockReset();
  });

  it('sin sesión guardada pide ingresar', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    const probe = await renderProvider();
    await waitFor(() => expect(probe()).toBe('signedOut|-|-'));
    expect(fetchMerchant).not.toHaveBeenCalled();
  });

  it('con sesión y negocio queda lista y muestra con qué ingresó', async () => {
    auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    fetchMerchant.mockResolvedValue(MERCHANT);
    const probe = await renderProvider();
    await waitFor(() => expect(probe()).toBe('ready|Tienda Doña Rosa|rosa@gmail.com'));
  });

  it('con sesión pero sin negocio pide registrarlo', async () => {
    auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    fetchMerchant.mockResolvedValue(null);
    const probe = await renderProvider();
    await waitFor(() => expect(probe()).toBe('needsBusiness|-|rosa@gmail.com'));
  });

  it('si falla la conexión al cargar el negocio, muestra error (no lo manda a registrarse)', async () => {
    auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    fetchMerchant.mockRejectedValue(new Error('sin internet'));
    const probe = await renderProvider();
    await waitFor(() => expect(probe()).toBe('error|-|rosa@gmail.com'));
  });

  it('al ingresar con el código, pasa de "ingresar" a la app', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    fetchMerchant.mockResolvedValue(MERCHANT);
    const probe = await renderProvider();
    await waitFor(() => expect(probe()).toBe('signedOut|-|-'));

    await act(async () => auth.__emit({ user: { id: 'user-2', phone: '573001234567' } }));

    await waitFor(() => expect(probe()).toBe('ready|Tienda Doña Rosa|300 123 4567'));
  });
});
