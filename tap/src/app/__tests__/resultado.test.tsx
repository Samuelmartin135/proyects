import { render, screen, userEvent } from '@testing-library/react-native';

import ResultadoScreen from '../cobro/resultado';

let mockParams: Record<string, string> = {};
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace, dismissAll: mockDismissAll }),
}));

describe('Pantalla de resultado', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockDismissAll.mockClear();
  });

  it('aprobado: muestra el total, la marca y la propina; "Nuevo cobro" vuelve a Cobrar', async () => {
    mockParams = { status: 'approved', amount: '12500', tip: '1250', mode: 'test', saved: '1', brand: 'Visa' };
    const user = userEvent.setup();
    await render(<ResultadoScreen />);

    expect(screen.getByTestId('result-title')).toHaveTextContent('Pago aprobado');
    expect(screen.getByTestId('result-total')).toHaveTextContent('$13.750');
    expect(screen.getByText('Visa · Incluye propina de $1.250')).toBeOnTheScreen();
    expect(screen.getByText('Cobro de prueba: no se movió dinero real.')).toBeOnTheScreen();

    await user.press(screen.getByTestId('new-charge'));
    expect(mockDismissAll).toHaveBeenCalled();
  });

  it('rechazado: muestra el motivo y permite intentar de nuevo con el mismo valor', async () => {
    mockParams = { status: 'declined', amount: '5013', tip: '0', mode: 'test', saved: '1', reason: 'Fondos insuficientes.' };
    const user = userEvent.setup();
    await render(<ResultadoScreen />);

    expect(screen.getByTestId('result-title')).toHaveTextContent('Pago rechazado');
    expect(screen.getByTestId('result-reason')).toHaveTextContent('Fondos insuficientes.');

    await user.press(screen.getByTestId('retry-charge'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/cobro/tarjeta',
      params: { amount: '5013', tip: '0' },
    });
  });

  it('si el pago se hizo pero no se guardó, advierte que NO cobre de nuevo', async () => {
    mockParams = { status: 'approved', amount: '12500', tip: '0', mode: 'live', saved: '0' };
    await render(<ResultadoScreen />);
    expect(screen.getByText(/No cobre de nuevo/)).toBeOnTheScreen();
    expect(screen.queryByText(/Cobro de prueba/)).toBeNull();
  });

  it('un estado desconocido se trata como "No se pudo cobrar"', async () => {
    mockParams = { status: 'raro', amount: '1000' };
    await render(<ResultadoScreen />);
    expect(screen.getByTestId('result-title')).toHaveTextContent('No se pudo cobrar');
  });
});
