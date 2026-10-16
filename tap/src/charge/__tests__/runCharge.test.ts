import { MemorySaleRepository } from '@/data/MemorySaleRepository';
import type { SaleRepository } from '@/data/SaleRepository';
import { MockPaymentProvider } from '@/payments/MockPaymentProvider';
import type { PaymentProvider } from '@/payments/PaymentProvider';
import { SumUpPaymentProvider } from '@/payments/SumUpPaymentProvider';

import { chargeReducer, initialChargeState, type ChargeEvent } from '../chargeMachine';
import { MESSAGES, runCharge, SAVE_ATTEMPTS, type ChargeDeps } from '../runCharge';

const instant = () => Promise.resolve();
const NOW = new Date('2026-10-16T15:00:00Z');

function setup(overrides: Partial<ChargeDeps> = {}) {
  const sales = new MemorySaleRepository();
  let n = 0;
  const deps: ChargeDeps = {
    provider: new MockPaymentProvider({ sleep: instant, random: () => 0 }),
    sales,
    newId: () => `sale-${++n}`,
    now: () => NOW,
    sleep: instant,
    ...overrides,
  };
  const events: ChargeEvent[] = [];
  return { deps, sales, events, dispatch: (e: ChargeEvent) => events.push(e) };
}

describe('runCharge', () => {
  it('cobro aprobado: registra la venta, cobra y guarda el resultado', async () => {
    const { deps, sales, events, dispatch } = setup();

    const report = await runCharge(deps, { amount: 12500, tip: 1250, mode: 'test' }, dispatch);

    expect(report.saved).toBe(true);
    expect(report.result.status).toBe('approved');
    expect(report.sale).toMatchObject({
      id: 'sale-1',
      amount: 12500,
      tip: 1250,
      mode: 'test',
      provider: 'mock',
      status: 'approved',
      cardBrand: 'Visa',
    });
    expect(await sales.get('sale-1')).toEqual(report.sale);

    // La máquina de estados termina en "finished" con ese resultado.
    const finalState = events.reduce(chargeReducer, initialChargeState);
    expect(finalState.phase).toBe('finished');
    expect(events.map((e) => e.type)).toEqual([
      'REGISTERING',
      'PROGRESS',
      'PROGRESS',
      'PROGRESS',
      'FINISHED',
    ]);
  });

  it('cobro rechazado: guarda el rechazo con su motivo', async () => {
    const { deps, sales } = setup();
    const report = await runCharge(deps, { amount: 5013, tip: 0, mode: 'test' });
    expect(report.result.status).toBe('declined');
    expect(await sales.get('sale-1')).toMatchObject({
      status: 'declined',
      failureReason: 'Fondos insuficientes.',
    });
  });

  it('usa el id de la venta como referencia ante el proveedor', async () => {
    const { deps } = setup();
    const charge = jest.spyOn(deps.provider, 'charge');
    await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' });
    expect(charge).toHaveBeenCalledWith(
      { reference: 'sale-1', amount: 12500, tip: 0, currency: 'COP', description: undefined },
      expect.any(Function),
    );
  });

  it('no cobra si el monto no es válido', async () => {
    const { deps, sales } = setup();
    const charge = jest.spyOn(deps.provider, 'charge');

    const report = await runCharge(deps, { amount: 500, tip: 0, mode: 'test' });

    expect(report).toEqual({
      sale: null,
      result: { status: 'failed', failureReason: 'El valor mínimo es $1.000.' },
      saved: true,
    });
    expect(charge).not.toHaveBeenCalled();
    expect(await sales.listByDay('2026-10-16', 'test')).toEqual([]);
  });

  it('en modo Prueba se niega a usar un proveedor real', async () => {
    const { deps } = setup({ provider: new SumUpPaymentProvider() });
    const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' });
    expect(report.result.failureReason).toBe(MESSAGES.modeMismatch);
  });

  it('si el proveedor no está listo, avisa el motivo y no registra nada', async () => {
    const { deps, sales } = setup({ provider: new SumUpPaymentProvider() });
    const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'live' });
    expect(report.sale).toBeNull();
    expect(report.result.failureReason).toMatch(/falta conectar SumUp/);
    expect(await sales.listByDay('2026-10-16', 'live')).toEqual([]);
  });

  it('si no se puede registrar la venta, NO cobra', async () => {
    const sales = new MemorySaleRepository();
    jest.spyOn(sales, 'create').mockRejectedValue(new Error('sin internet'));
    const { deps } = setup({ sales });
    const charge = jest.spyOn(deps.provider, 'charge');

    const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' });

    expect(charge).not.toHaveBeenCalled();
    expect(report.result).toEqual({ status: 'failed', failureReason: MESSAGES.registerFailed });
  });

  it('si el proveedor falla de forma inesperada, la venta queda como fallida', async () => {
    const provider: PaymentProvider = new MockPaymentProvider({ sleep: instant });
    jest.spyOn(provider, 'charge').mockRejectedValue(new Error('lector desconectado'));
    const { deps, sales } = setup({ provider });

    const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' });

    expect(report.result).toEqual({ status: 'failed', failureReason: MESSAGES.providerCrashed });
    expect(await sales.get('sale-1')).toMatchObject({ status: 'failed' });
  });

  describe('error al guardar el resultado', () => {
    it('reintenta y, si lo logra, queda guardado', async () => {
      const sales = new MemorySaleRepository();
      const complete = jest.spyOn(sales, 'complete');
      complete.mockRejectedValueOnce(new Error('timeout'));
      const { deps } = setup({ sales });

      const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' });

      expect(complete).toHaveBeenCalledTimes(2);
      expect(report.saved).toBe(true);
      expect(report.sale?.status).toBe('approved');
    });

    it('si nunca lo logra, informa que no se guardó pero NO repite el cobro', async () => {
      const failing: SaleRepository = new MemorySaleRepository();
      jest.spyOn(failing, 'complete').mockRejectedValue(new Error('sin internet'));
      const { deps, events, dispatch } = setup({ sales: failing });
      const charge = jest.spyOn(deps.provider, 'charge');

      const report = await runCharge(deps, { amount: 12500, tip: 0, mode: 'test' }, dispatch);

      expect(failing.complete).toHaveBeenCalledTimes(SAVE_ATTEMPTS);
      expect(charge).toHaveBeenCalledTimes(1);
      expect(report.saved).toBe(false);
      expect(report.result.status).toBe('approved'); // el pago sí se hizo
      expect(report.sale?.status).toBe('pending'); // en la base sigue pendiente
      expect(events.reduce(chargeReducer, initialChargeState).saveFailed).toBe(true);
    });
  });
});
