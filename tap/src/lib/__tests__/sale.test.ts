import { countsTowardTotals, saleTotal, shortSaleCode } from '../sale';

describe('sale', () => {
  it('el total es venta + propina', () => {
    expect(saleTotal({ amount: 12500, tip: 1250 })).toBe(13750);
  });

  it('solo las aprobadas suman', () => {
    expect(countsTowardTotals('approved')).toBe(true);
    expect(countsTowardTotals('refunded')).toBe(false);
    expect(countsTowardTotals('pending')).toBe(false);
  });

  it('el código corto son los primeros 8 caracteres del id en mayúsculas', () => {
    expect(shortSaleCode('a1b2c3d4-e5f6-4789-8abc-def012345678')).toBe('A1B2C3D4');
  });
});
