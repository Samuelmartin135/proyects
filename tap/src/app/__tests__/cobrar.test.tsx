import { render, screen, userEvent } from '@testing-library/react-native';

import CobrarScreen from '../(tabs)/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

async function press(user: ReturnType<typeof userEvent.setup>, ...keys: string[]) {
  for (const key of keys) {
    await user.press(screen.getByTestId(`key-${key}`));
  }
}

describe('Pantalla Cobrar', () => {
  beforeEach(() => mockPush.mockClear());

  it('arranca en $0 con el botón deshabilitado', async () => {
    await render(<CobrarScreen />);
    expect(screen.getByTestId('charge-amount')).toHaveTextContent('$0');
    expect(screen.getByTestId('charge-button')).toBeDisabled();
  });

  it('muestra el monto digitado con formato colombiano', async () => {
    const user = userEvent.setup();
    await render(<CobrarScreen />);

    await press(user, '1', '2', '5', '0', '0');

    expect(screen.getByTestId('charge-amount')).toHaveTextContent('$12.500');
    expect(screen.getByRole('button', { name: 'Cobrar $12.500' })).toBeEnabled();
  });

  it('avisa el valor mínimo y no deja cobrar menos', async () => {
    const user = userEvent.setup();
    await render(<CobrarScreen />);

    await press(user, '5', '0', '0');

    expect(screen.getByText('El valor mínimo es $1.000.')).toBeOnTheScreen();
    expect(screen.getByTestId('charge-button')).toBeDisabled();
  });

  it('al cobrar va a la propina con el monto y limpia el teclado', async () => {
    const user = userEvent.setup();
    await render(<CobrarScreen />);

    await press(user, '5', '000');
    await user.press(screen.getByTestId('charge-button'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/cobro/propina',
      params: { amount: '5000' },
    });
    expect(screen.getByTestId('charge-amount')).toHaveTextContent('$0');
  });

  it('la tecla borrar quita el último dígito', async () => {
    const user = userEvent.setup();
    await render(<CobrarScreen />);

    await press(user, '1', '2', '3', 'backspace');

    expect(screen.getByTestId('charge-amount')).toHaveTextContent('$12');
  });
});
