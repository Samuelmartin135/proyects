import { render, screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { getMode, LIVE_LOCKED_REASON, resetModeForTests, setLiveUnlocked } from '@/mode/modeStore';

import CuentaScreen from '../(tabs)/cuenta';

describe('Pantalla Cuenta: modo Prueba / Real', () => {
  beforeEach(() => resetModeForTests());

  it('arranca en Prueba, con la franja naranja y los valores para probar', async () => {
    await render(<CuentaScreen />);
    expect(screen.getByTestId('mode-test')).toBeSelected();
    expect(screen.getByTestId('mode-banner')).toBeOnTheScreen();
    expect(screen.getByText('Rechazado: fondos insuficientes')).toBeOnTheScreen();
  });

  it('sin verificación, el modo Real está bloqueado y explica por qué', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    await render(<CuentaScreen />);

    await user.press(screen.getByRole('radio', { name: 'Real (bloqueado)' }));

    expect(alert).toHaveBeenCalledWith('Modo Real', LIVE_LOCKED_REASON);
    expect(getMode()).toBe('test');
    alert.mockRestore();
  });

  it('con verificación aprobada pasa a Real y quita la franja de prueba', async () => {
    setLiveUnlocked(true);
    const user = userEvent.setup();
    await render(<CuentaScreen />);

    await user.press(screen.getByTestId('mode-live'));

    expect(getMode()).toBe('live');
    expect(screen.queryByTestId('mode-banner')).toBeNull();
  });
});
