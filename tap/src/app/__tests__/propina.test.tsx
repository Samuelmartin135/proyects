import { render, screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import PropinaScreen from '../cobro/propina';

let mockParams: Record<string, string> = { amount: '12500' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));

describe('Pantalla Propina', () => {
  beforeEach(() => {
    mockParams = { amount: '12500' };
  });

  it('por defecto es sin propina y el total es el valor de la venta', async () => {
    await render(<PropinaScreen />);
    expect(screen.getByTestId('tip-none')).toBeSelected();
    expect(screen.getByTestId('total')).toHaveTextContent('$12.500');
  });

  it('suma el 10 % al total', async () => {
    const user = userEvent.setup();
    await render(<PropinaScreen />);

    await user.press(screen.getByTestId('tip-10'));

    expect(screen.getByTestId('total')).toHaveTextContent('$13.750');
    expect(screen.getByRole('button', { name: 'Cobrar $13.750' })).toBeEnabled();
  });

  it('permite digitar otro valor de propina', async () => {
    const user = userEvent.setup();
    await render(<PropinaScreen />);

    await user.press(screen.getByTestId('tip-custom'));
    await user.press(screen.getByTestId('key-2'));
    await user.press(screen.getByTestId('key-000'));

    expect(screen.getByTestId('custom-tip')).toHaveTextContent('$2.000');
    expect(screen.getByTestId('total')).toHaveTextContent('$14.500');
  });

  it('no deja que la propina propia supere el valor de la venta', async () => {
    mockParams = { amount: '5000' };
    const user = userEvent.setup();
    await render(<PropinaScreen />);

    await user.press(screen.getByTestId('tip-custom'));
    for (const key of ['9', '9', '9', '9', '9']) {
      await user.press(screen.getByTestId(`key-${key}`));
    }

    // 9-9-9 = $999; el siguiente 9 daría $9.999 > $5.000, así que se ignora
    expect(screen.getByTestId('custom-tip')).toHaveTextContent('$999');
  });

  it('muestra un error si llega un monto inválido', async () => {
    mockParams = { amount: 'abc' };
    await render(<PropinaScreen />);
    expect(screen.getByText(/No se encontró el valor a cobrar/)).toBeOnTheScreen();
  });

  it('el botón cobrar responde (el cobro con tarjeta llega en el paso 3)', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    await render(<PropinaScreen />);

    await user.press(screen.getByTestId('confirm-charge'));

    expect(alert).toHaveBeenCalled();
    alert.mockRestore();
  });
});
