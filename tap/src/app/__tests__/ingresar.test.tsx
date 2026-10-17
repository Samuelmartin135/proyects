import { render, screen, userEvent } from '@testing-library/react-native';

import { AUTH_MESSAGES } from '@/auth/authErrors';
import { supabase } from '@/data/supabase';

import IngresarScreen from '../ingresar/index';

jest.mock('@/data/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { signInWithOtp: jest.fn(), verifyOtp: jest.fn() } },
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const signInWithOtp = supabase!.auth.signInWithOtp as jest.Mock;

describe('Pantalla Ingresar', () => {
  beforeEach(() => {
    mockPush.mockClear();
    signInWithOtp.mockReset().mockResolvedValue({ data: {}, error: null });
  });

  it('con un correo, envía el código y pasa a la pantalla del código', async () => {
    const user = userEvent.setup();
    await render(<IngresarScreen />);

    await user.type(screen.getByTestId('contact-input'), 'Rosa@Gmail.com');
    await user.press(screen.getByTestId('send-code'));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'rosa@gmail.com',
      options: { shouldCreateUser: true },
    });
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/ingresar/codigo', params: { email: 'rosa@gmail.com' } });
  });

  it('con un celular, lo envía en formato +57 por SMS', async () => {
    const user = userEvent.setup();
    await render(<IngresarScreen />);

    await user.type(screen.getByTestId('contact-input'), '300 123 4567');
    await user.press(screen.getByTestId('send-code'));

    expect(signInWithOtp).toHaveBeenCalledWith({
      phone: '+573001234567',
      options: { shouldCreateUser: true, channel: 'sms' },
    });
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/ingresar/codigo', params: { phone: '+573001234567' } });
  });

  it('si el dato está mal escrito, avisa y no envía nada', async () => {
    const user = userEvent.setup();
    await render(<IngresarScreen />);

    await user.type(screen.getByTestId('contact-input'), '30012');
    await user.press(screen.getByTestId('send-code'));

    expect(screen.getByText('El celular debe tener 10 dígitos y empezar por 3.')).toBeOnTheScreen();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('muestra los errores de Supabase en español', async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: { status: 429, message: 'rate limit' } });
    const user = userEvent.setup();
    await render(<IngresarScreen />);

    await user.type(screen.getByTestId('contact-input'), 'rosa@gmail.com');
    await user.press(screen.getByTestId('send-code'));

    expect(screen.getByText(AUTH_MESSAGES.tooMany)).toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
