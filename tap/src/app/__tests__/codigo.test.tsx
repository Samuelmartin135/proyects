import { render, screen, userEvent } from '@testing-library/react-native';

import { AUTH_MESSAGES } from '@/auth/authErrors';
import { supabase } from '@/data/supabase';

import CodigoScreen from '../ingresar/codigo';

jest.mock('@/data/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { signInWithOtp: jest.fn(), verifyOtp: jest.fn() } },
}));

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn() }),
}));

const verifyOtp = supabase!.auth.verifyOtp as jest.Mock;

describe('Pantalla Código', () => {
  beforeEach(() => {
    verifyOtp.mockReset().mockResolvedValue({ data: {}, error: null });
  });

  it('muestra a dónde se envió el código', async () => {
    mockParams = { phone: '+573001234567' };
    await render(<CodigoScreen />);
    expect(screen.getByText('300 123 4567')).toBeOnTheScreen();
  });

  it('al completar los 6 dígitos verifica solo (correo)', async () => {
    mockParams = { email: 'rosa@gmail.com' };
    const user = userEvent.setup();
    await render(<CodigoScreen />);

    await user.type(screen.getByTestId('code-input'), '123456');

    expect(verifyOtp).toHaveBeenCalledWith({ email: 'rosa@gmail.com', token: '123456', type: 'email' });
  });

  it('con celular verifica como SMS', async () => {
    mockParams = { phone: '+573001234567' };
    const user = userEvent.setup();
    await render(<CodigoScreen />);

    await user.type(screen.getByTestId('code-input'), '654321');

    expect(verifyOtp).toHaveBeenCalledWith({ phone: '+573001234567', token: '654321', type: 'sms' });
  });

  it('si el código está mal, lo dice en español', async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired', message: 'Token has expired or is invalid' } });
    mockParams = { email: 'rosa@gmail.com' };
    const user = userEvent.setup();
    await render(<CodigoScreen />);

    await user.type(screen.getByTestId('code-input'), '000000');

    expect(screen.getByText(AUTH_MESSAGES.badCode)).toBeOnTheScreen();
  });

  it('"Reenviar código" espera 60 segundos', async () => {
    mockParams = { email: 'rosa@gmail.com' };
    await render(<CodigoScreen />);
    expect(screen.getByTestId('resend-code')).toBeDisabled();
    expect(screen.getByText('Reenviar código en 60 s')).toBeOnTheScreen();
  });
});
