import { render, screen, userEvent } from '@testing-library/react-native';

import { BigButton } from '../BigButton';

describe('BigButton', () => {
  it('muestra el texto y responde al toque', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<BigButton label="Cobrar" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Cobrar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no responde cuando está deshabilitado', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<BigButton label="Cobrar" onPress={onPress} disabled />);

    await user.press(screen.getByRole('button', { name: 'Cobrar' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
