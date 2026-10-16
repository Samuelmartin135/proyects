import type { SaleStatus } from '../sale';
import { summarizeSales } from '../summary';

function sale(amount: number, tip = 0, status: SaleStatus = 'approved') {
  return { amount, tip, status };
}

describe('summarizeSales', () => {
  it('un día sin ventas da todo en cero (sin dividir por cero)', () => {
    expect(summarizeSales([])).toEqual({
      totalSold: 0,
      tips: 0,
      totalCharged: 0,
      salesCount: 0,
      averageTicket: 0,
    });
  });

  it('suma ventas y propinas por separado', () => {
    const summary = summarizeSales([sale(10000, 1000), sale(5000), sale(15000, 1500)]);
    expect(summary).toEqual({
      totalSold: 30000,
      tips: 2500,
      totalCharged: 32500,
      salesCount: 3,
      averageTicket: 10000,
    });
  });

  it('solo cuenta las ventas aprobadas', () => {
    const summary = summarizeSales([
      sale(10000),
      sale(99000, 0, 'declined'),
      sale(99000, 0, 'canceled'),
      sale(99000, 0, 'failed'),
      sale(99000, 0, 'pending'),
      sale(99000, 9900, 'refunded'),
    ]);
    expect(summary.totalSold).toBe(10000);
    expect(summary.tips).toBe(0);
    expect(summary.salesCount).toBe(1);
  });

  it('el ticket promedio no incluye propinas y se redondea al peso', () => {
    // (1.000 + 1.000 + 1.001) / 3 = 1.000,33 → 1.000
    expect(summarizeSales([sale(1000, 500), sale(1000), sale(1001)]).averageTicket).toBe(1000);
    // (1.000 + 1.001) / 2 = 1.000,5 → 1.001
    expect(summarizeSales([sale(1000), sale(1001)]).averageTicket).toBe(1001);
  });
});
