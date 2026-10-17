import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { createMerchant } from '@/data/merchants';

import NegocioScreen from '../negocio';

jest.mock('@/data/supabase', () => ({ isSupabaseConfigured: true, supabase: {} }));
jest.mock('@/data/merchants', () => ({ createMerchant: jest.fn() }));

const mockSetMerchant = jest.fn();
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ setMerchant: mockSetMerchant }) }));

const create = createMerchant as jest.Mock;

describe('Pantalla Su negocio', () => {
  beforeEach(() => {
    mockSetMerchant.mockClear();
    create.mockReset();
  });

  it('pide el nombre antes de guardar', async () => {
    const user = userEvent.setup();
    await render(<NegocioScreen />);

    await user.press(screen.getByTestId('save-business'));

    expect(screen.getByTestId('business-error')).toHaveTextContent('Escriba el nombre de su negocio.');
    expect(create).not.toHaveBeenCalled();
  });

  it('guarda el negocio y entra a la app', async () => {
    const saved = { id: 'm1', businessName: 'Tienda Doña Rosa', businessType: 'tienda', legalType: 'persona_natural' };
    create.mockResolvedValue(saved);
    const user = userEvent.setup();
    await render(<NegocioScreen />);

    await user.type(screen.getByTestId('business-name'), 'Tienda Doña Rosa');
    await user.press(screen.getByTestId('type-tienda'));
    await user.press(screen.getByTestId('legal-persona_natural'));
    await user.press(screen.getByTestId('save-business'));

    expect(create).toHaveBeenCalledWith(
      {},
      { businessName: 'Tienda Doña Rosa', businessType: 'tienda', legalType: 'persona_natural' },
    );
    await waitFor(() => expect(mockSetMerchant).toHaveBeenCalledWith(saved));
  });

  it('para empresas explica qué documentos se pedirán', async () => {
    const user = userEvent.setup();
    await render(<NegocioScreen />);
    await user.press(screen.getByTestId('legal-empresa'));
    expect(screen.getByText(/NIT, la Cámara de Comercio/)).toBeOnTheScreen();
  });

  it('si falla la conexión, lo dice y permite reintentar', async () => {
    create.mockRejectedValue(new Error('sin internet'));
    const user = userEvent.setup();
    await render(<NegocioScreen />);

    await user.type(screen.getByTestId('business-name'), 'Ferretería El Tornillo');
    await user.press(screen.getByTestId('type-ferreteria'));
    await user.press(screen.getByTestId('legal-empresa'));
    await user.press(screen.getByTestId('save-business'));

    expect(await screen.findByText('No se pudo guardar. Revise su conexión e intente de nuevo.')).toBeOnTheScreen();
    expect(mockSetMerchant).not.toHaveBeenCalled();
  });
});
