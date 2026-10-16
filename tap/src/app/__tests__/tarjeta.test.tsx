import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { resetModeForTests } from '@/mode/modeStore';

import TarjetaScreen from '../cobro/tarjeta';

// Servicios de prueba: ventas en memoria. (Se crean dentro de la fábrica
// porque jest.mock se ejecuta antes que el resto del archivo.)
jest.mock('@/services', () => {
  const { MemorySaleRepository } = jest.requireActual('@/data/MemorySaleRepository');
  let ids = 0;
  return { saleRepository: new MemorySaleRepository(), newSaleId: () => `sale-${++ids}` };
});

// Simulador controlado: cada espera queda pendiente hasta que la prueba la libere.
const mockPending: (() => void)[] = [];
jest.mock('@/payments', () => {
  const { MockPaymentProvider } = jest.requireActual('@/payments/MockPaymentProvider');
  const provider = new MockPaymentProvider({
    sleep: () => new Promise<void>((resolve) => mockPending.push(resolve)),
    random: () => 0,
  });
  return { getPaymentProvider: () => provider };
});

let mockParams: Record<string, string> = {};
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

async function releaseNextWait() {
  await waitFor(() => expect(mockPending.length).toBeGreaterThan(0));
  mockPending.shift()?.();
}

describe('Pantalla "Acerque la tarjeta"', () => {
  beforeEach(() => {
    resetModeForTests();
    mockReplace.mockClear();
    mockPending.length = 0;
  });

  it('muestra el total, pide la tarjeta y al aprobarse va al resultado', async () => {
    mockParams = { amount: '12500', tip: '1250' };
    await render(<TarjetaScreen />);
    expect(screen.getByTestId('card-total')).toHaveTextContent('$13.750');

    await releaseNextWait(); // termina "preparando"
    await waitFor(() => expect(screen.getByTestId('card-title')).toHaveTextContent('Acerque la tarjeta'));
    expect(screen.getByTestId('cancel-charge')).toBeOnTheScreen();

    await releaseNextWait(); // "se acerca" la tarjeta
    await waitFor(() => expect(screen.getByTestId('card-title')).toHaveTextContent('Procesando…'));
    expect(screen.queryByTestId('cancel-charge')).toBeNull(); // ya no se puede cancelar

    await releaseNextWait(); // responde el "banco"
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/cobro/resultado',
      params: expect.objectContaining({
        status: 'approved',
        amount: '12500',
        tip: '1250',
        mode: 'test',
        saved: '1',
        brand: 'Visa',
        saleId: expect.stringMatching(/^sale-/),
      }),
    });
  });

  it('el botón Cancelar detiene el cobro', async () => {
    mockParams = { amount: '9000', tip: '0' };
    const user = userEvent.setup();
    await render(<TarjetaScreen />);

    await releaseNextWait();
    await waitFor(() => expect(screen.getByTestId('cancel-charge')).toBeOnTheScreen());
    await user.press(screen.getByTestId('cancel-charge'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace.mock.calls[0][0].params).toMatchObject({
      status: 'canceled',
      reason: 'Cobro cancelado.',
    });
  });
});
