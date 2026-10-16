import {
  applyKeypadKey,
  formatCOP,
  MAX_CHARGE_COP,
  MIN_CHARGE_COP,
  parseAmountParam,
  validateCharge,
  validateSaleAmount,
  type KeypadKey,
} from '../money';

/** Aplica varias teclas seguidas, como si el comerciante las tocara. */
function type(keys: KeypadKey[], start = 0): number {
  return keys.reduce((amount, key) => applyKeypadKey(amount, key), start);
}

describe('formatCOP', () => {
  it.each([
    [0, '$0'],
    [5, '$5'],
    [999, '$999'],
    [1000, '$1.000'],
    [12500, '$12.500'],
    [100000, '$100.000'],
    [1234567, '$1.234.567'],
    [10000000, '$10.000.000'],
  ])('%d → %s', (amount, expected) => {
    expect(formatCOP(amount)).toBe(expected);
  });

  it('pone el signo antes del $ en valores negativos', () => {
    expect(formatCOP(-12500)).toBe('-$12.500');
  });

  it('redondea si por error llega un valor con decimales', () => {
    expect(formatCOP(12499.6)).toBe('$12.500');
  });
});

describe('applyKeypadKey (teclado)', () => {
  it('agrega dígitos a la derecha', () => {
    expect(type(['1', '2', '5', '0', '0'])).toBe(12500);
  });

  it('ignora ceros a la izquierda', () => {
    expect(type(['0', '0', '7'])).toBe(7);
  });

  it('"000" multiplica por mil', () => {
    expect(type(['5', '000'])).toBe(5000);
    expect(type(['1', '2', '000'])).toBe(12000);
  });

  it('"000" sobre cero sigue en cero', () => {
    expect(type(['000'])).toBe(0);
  });

  it('borrar quita el último dígito', () => {
    expect(type(['1', '2', '5', 'backspace'])).toBe(12);
    expect(type(['7', 'backspace'])).toBe(0);
    expect(type(['backspace'])).toBe(0);
  });

  it('limpiar deja el monto en cero', () => {
    expect(type(['9', '9', '9', 'clear'])).toBe(0);
  });

  it('no deja pasar del máximo: la tecla se ignora', () => {
    expect(MAX_CHARGE_COP).toBe(10_000_000);
    const atMax = type(['1', '0', '000', '000']);
    expect(atMax).toBe(10_000_000);
    expect(applyKeypadKey(atMax, '0')).toBe(atMax);
    expect(applyKeypadKey(atMax, '000')).toBe(atMax);
    expect(type(['9', '9', '9', '9', '9', '9', '9', '9'])).toBe(9_999_999);
  });

  it('acepta un máximo distinto (p. ej. para la propina)', () => {
    expect(applyKeypadKey(10, '0', 100)).toBe(100);
    expect(applyKeypadKey(10, '1', 100)).toBe(10); // 101 > 100: se ignora
  });
});

describe('validateSaleAmount', () => {
  it('acepta montos entre el mínimo y el máximo', () => {
    expect(validateSaleAmount(MIN_CHARGE_COP)).toEqual({ ok: true });
    expect(validateSaleAmount(MAX_CHARGE_COP)).toEqual({ ok: true });
  });

  it('rechaza montos menores al mínimo con un mensaje claro', () => {
    expect(validateSaleAmount(999)).toEqual({ ok: false, message: 'El valor mínimo es $1.000.' });
    expect(validateSaleAmount(0).ok).toBe(false);
  });

  it('rechaza montos mayores al máximo', () => {
    expect(validateSaleAmount(MAX_CHARGE_COP + 1)).toEqual({
      ok: false,
      message: 'El valor máximo es $10.000.000.',
    });
  });

  it('rechaza decimales y valores que no son números', () => {
    expect(validateSaleAmount(1500.5).ok).toBe(false);
    expect(validateSaleAmount(Number.NaN).ok).toBe(false);
    expect(validateSaleAmount(-5000).ok).toBe(false);
  });
});

describe('validateCharge (venta + propina)', () => {
  it('acepta una venta con propina normal', () => {
    expect(validateCharge(12500, 1250)).toEqual({ ok: true });
    expect(validateCharge(12500, 0)).toEqual({ ok: true });
  });

  it('valida primero el valor de la venta', () => {
    expect(validateCharge(500, 0)).toEqual({ ok: false, message: 'El valor mínimo es $1.000.' });
  });

  it('rechaza propinas negativas o con decimales', () => {
    expect(validateCharge(12500, -1).ok).toBe(false);
    expect(validateCharge(12500, 10.5).ok).toBe(false);
  });

  it('rechaza una propina mayor que la venta (casi siempre es un error)', () => {
    expect(validateCharge(5000, 5001)).toEqual({
      ok: false,
      message: 'La propina no puede ser mayor que el valor de la venta.',
    });
    expect(validateCharge(5000, 5000)).toEqual({ ok: true });
  });

  it('rechaza si venta + propina pasa del máximo', () => {
    expect(validateCharge(MAX_CHARGE_COP, 1)).toEqual({
      ok: false,
      message: 'El total con propina no puede pasar de $10.000.000.',
    });
  });
});

describe('parseAmountParam', () => {
  it('lee montos enteros', () => {
    expect(parseAmountParam('12500')).toBe(12500);
    expect(parseAmountParam('0')).toBe(0);
  });

  it('devuelve null ante cualquier valor dañado', () => {
    expect(parseAmountParam(undefined)).toBeNull();
    expect(parseAmountParam('')).toBeNull();
    expect(parseAmountParam('12.500')).toBeNull();
    expect(parseAmountParam('-5')).toBeNull();
    expect(parseAmountParam('1e5')).toBeNull();
    expect(parseAmountParam('abc')).toBeNull();
    expect(parseAmountParam(['100', '200'])).toBeNull();
  });
});
