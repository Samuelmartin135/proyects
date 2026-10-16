import { calculateTip, isSameTipOption, NO_TIP, tipOptionLabel } from '../tip';

describe('calculateTip', () => {
  it('sin propina es 0', () => {
    expect(calculateTip(12500, NO_TIP)).toBe(0);
  });

  it('calcula porcentajes exactos', () => {
    expect(calculateTip(12500, { kind: 'percent', percent: 10 })).toBe(1250);
    expect(calculateTip(20000, { kind: 'percent', percent: 15 })).toBe(3000);
  });

  it('redondea al peso más cercano', () => {
    // 10 % de 12.345 = 1.234,5 → 1.235
    expect(calculateTip(12345, { kind: 'percent', percent: 10 })).toBe(1235);
    // 15 % de 1.001 = 150,15 → 150
    expect(calculateTip(1001, { kind: 'percent', percent: 15 })).toBe(150);
  });

  it('no pierde precisión con montos grandes', () => {
    expect(calculateTip(9_999_999, { kind: 'percent', percent: 10 })).toBe(1_000_000);
  });

  it('usa el valor propio tal cual', () => {
    expect(calculateTip(12500, { kind: 'custom', amount: 2000 })).toBe(2000);
    expect(calculateTip(12500, { kind: 'custom', amount: 0 })).toBe(0);
  });

  it('no acepta un valor propio con decimales o negativo', () => {
    expect(() => calculateTip(12500, { kind: 'custom', amount: 10.5 })).toThrow();
    expect(() => calculateTip(12500, { kind: 'custom', amount: -100 })).toThrow();
  });
});

describe('tipOptionLabel', () => {
  it('muestra el porcentaje y cuánto es en pesos', () => {
    expect(tipOptionLabel(12500, NO_TIP)).toBe('Sin propina');
    expect(tipOptionLabel(12500, { kind: 'percent', percent: 10 })).toBe('10 % · $1.250');
    expect(tipOptionLabel(12500, { kind: 'custom', amount: 0 })).toBe('Otro valor');
    expect(tipOptionLabel(12500, { kind: 'custom', amount: 3000 })).toBe('Otro valor · $3.000');
  });
});

describe('isSameTipOption', () => {
  it('compara por tipo y porcentaje', () => {
    expect(isSameTipOption(NO_TIP, { kind: 'none' })).toBe(true);
    expect(
      isSameTipOption({ kind: 'percent', percent: 10 }, { kind: 'percent', percent: 10 }),
    ).toBe(true);
    expect(
      isSameTipOption({ kind: 'percent', percent: 10 }, { kind: 'percent', percent: 15 }),
    ).toBe(false);
    expect(isSameTipOption({ kind: 'custom', amount: 1 }, { kind: 'custom', amount: 2 })).toBe(
      true,
    );
    expect(isSameTipOption(NO_TIP, { kind: 'custom', amount: 0 })).toBe(false);
  });
});
