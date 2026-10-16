import { MOCK_TIMINGS, MockPaymentProvider } from '../MockPaymentProvider';
import type { ChargeProgress, ChargeRequest } from '../PaymentProvider';

const instant = () => Promise.resolve();

function request(amount: number, tip = 0, reference = 'ref-1'): ChargeRequest {
  return { reference, amount, tip, currency: 'COP' };
}

/** "sleep" controlable: cada espera queda pendiente hasta que la prueba la libere. */
function manualSleep() {
  const pending: { ms: number; resolve: () => void }[] = [];
  const sleep = (ms: number) => new Promise<void>((resolve) => pending.push({ ms, resolve }));
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { sleep, pending, flush };
}

describe('MockPaymentProvider', () => {
  it('aprueba un cobro normal y reporta las etapas en orden', async () => {
    const provider = new MockPaymentProvider({ sleep: instant, random: () => 0 });
    const progress: ChargeProgress[] = [];

    const result = await provider.charge(request(12500, 1250), (p) => progress.push(p));

    expect(result.status).toBe('approved');
    expect(result.providerTransactionId).toMatch(/^mock_/);
    expect(result.cardBrand).toBe('Visa');
    expect(progress).toEqual(['preparing', 'waiting_card', 'processing']);
  });

  it('nunca devuelve datos de la tarjeta (solo la marca)', async () => {
    const provider = new MockPaymentProvider({ sleep: instant });
    const result = await provider.charge(request(12500));
    expect(Object.keys(result).sort()).toEqual(['cardBrand', 'providerTransactionId', 'status']);
  });

  describe('montos especiales para demos (según el total)', () => {
    const provider = () => new MockPaymentProvider({ sleep: instant });

    it('…013 → fondos insuficientes', async () => {
      expect(await provider().charge(request(5013))).toEqual({
        status: 'declined',
        failureReason: 'Fondos insuficientes.',
      });
    });

    it('…014 → tarjeta no permitida', async () => {
      const result = await provider().charge(request(5014));
      expect(result.status).toBe('declined');
      expect(result.failureReason).toMatch(/Tarjeta no permitida/);
    });

    it('…015 → tiempo agotado sin tarjeta', async () => {
      const progress: ChargeProgress[] = [];
      const result = await provider().charge(request(5015), (p) => progress.push(p));
      expect(result).toEqual({
        status: 'canceled',
        failureReason: 'Se agotó el tiempo: no se acercó ninguna tarjeta.',
      });
      expect(progress).toEqual(['preparing', 'waiting_card']); // nunca llegó a procesar
    });

    it('cuenta la propina: $5.000 + $13 de propina termina en 013', async () => {
      expect((await provider().charge(request(5000, 13))).status).toBe('declined');
    });
  });

  it('puede rechazar al azar si se configura una tasa de rechazo', async () => {
    const provider = new MockPaymentProvider({ sleep: instant, random: () => 0.1, declineRate: 0.2 });
    expect((await provider.charge(request(12500))).status).toBe('declined');
  });

  it('usa tiempos realistas', async () => {
    const waits: number[] = [];
    const provider = new MockPaymentProvider({
      sleep: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
      random: () => 0.5,
    });
    await provider.charge(request(12500));

    const [preparing, waiting, processing] = waits;
    expect(preparing).toBeGreaterThanOrEqual(MOCK_TIMINGS.preparing[0]);
    expect(waiting).toBeGreaterThanOrEqual(MOCK_TIMINGS.waitingCard[0]);
    expect(waiting).toBeLessThanOrEqual(MOCK_TIMINGS.waitingCard[1]);
    expect(processing).toBeGreaterThanOrEqual(MOCK_TIMINGS.processing[0]);
    // El cobro completo dura varios segundos, como uno real.
    expect(preparing + waiting + processing).toBeGreaterThan(3500);
  });

  describe('idempotencia', () => {
    it('la misma referencia no se cobra dos veces: devuelve el mismo resultado', async () => {
      const provider = new MockPaymentProvider({ sleep: instant });
      const first = await provider.charge(request(12500, 0, 'misma'));
      const progress: ChargeProgress[] = [];
      const second = await provider.charge(request(12500, 0, 'misma'), (p) => progress.push(p));

      expect(second).toEqual(first);
      expect(progress).toEqual([]); // no volvió a pedir la tarjeta
      expect(await provider.listTransactions({ from: new Date(0), to: new Date(8e15) })).toHaveLength(1);
    });

    it('también conserva el motivo de un rechazo', async () => {
      const provider = new MockPaymentProvider({ sleep: instant });
      await provider.charge(request(5013, 0, 'r'));
      expect(await provider.charge(request(5013, 0, 'r'))).toEqual({
        status: 'declined',
        failureReason: 'Fondos insuficientes.',
      });
    });
  });

  describe('cancelar', () => {
    it('se puede cancelar mientras espera la tarjeta', async () => {
      const { sleep, pending, flush } = manualSleep();
      const provider = new MockPaymentProvider({ sleep });
      const progress: ChargeProgress[] = [];

      const charging = provider.charge(request(12500), (p) => progress.push(p));
      pending[0].resolve(); // termina "preparando"
      await flush();
      expect(progress).toEqual(['preparing', 'waiting_card']);

      await provider.cancel();

      expect(await charging).toEqual({ status: 'canceled', failureReason: 'Cobro cancelado.' });
      expect(progress).not.toContain('processing');
    });

    it('NO se puede cancelar cuando la tarjeta ya se está procesando', async () => {
      const { sleep, pending, flush } = manualSleep();
      const provider = new MockPaymentProvider({ sleep, random: () => 0 });

      const charging = provider.charge(request(12500));
      pending[0].resolve(); // preparando
      await flush();
      pending[1].resolve(); // esperando tarjeta
      await flush();

      await provider.cancel(); // llega tarde: se ignora
      pending[2].resolve(); // procesando

      expect((await charging).status).toBe('approved');
    });

    it('cancelar sin cobro en curso no hace nada', async () => {
      const provider = new MockPaymentProvider({ sleep: instant });
      await expect(provider.cancel()).resolves.toBeUndefined();
    });
  });

  it('no permite dos cobros al mismo tiempo', async () => {
    const { sleep, pending } = manualSleep();
    const provider = new MockPaymentProvider({ sleep });
    const first = provider.charge(request(12500, 0, 'a'));

    expect(await provider.charge(request(9000, 0, 'b'))).toEqual({
      status: 'failed',
      failureReason: 'Ya hay un cobro en curso.',
    });

    await provider.cancel();
    pending.forEach((p) => p.resolve());
    await first;
  });

  describe('estado, reembolso e historial', () => {
    it('getStatus encuentra cobros hechos y no inventa los que no existen', async () => {
      const provider = new MockPaymentProvider({ sleep: instant });
      await provider.charge(request(12500, 0, 'x'));
      expect(await provider.getStatus('x')).toMatchObject({ found: true, status: 'approved' });
      expect(await provider.getStatus('no-existe')).toEqual({ found: false });
    });

    it('reembolsa solo pagos aprobados, y una sola vez', async () => {
      const provider = new MockPaymentProvider({ sleep: instant });
      await provider.charge(request(12500, 0, 'ok'));
      await provider.charge(request(5013, 0, 'rechazado'));

      expect(await provider.refund({ reference: 'ok' })).toEqual({ status: 'refunded' });
      expect(await provider.getStatus('ok')).toMatchObject({ status: 'refunded' });
      expect(await provider.refund({ reference: 'ok' })).toEqual({ status: 'refunded' });

      expect(await provider.refund({ reference: 'rechazado' })).toEqual({
        status: 'failed',
        failureReason: 'Solo se pueden reembolsar pagos aprobados.',
      });
      expect((await provider.refund({ reference: 'nada' })).status).toBe('failed');
    });

    it('listTransactions filtra por rango de fechas', async () => {
      let now = new Date('2026-10-16T15:00:00Z');
      const provider = new MockPaymentProvider({ sleep: instant, now: () => now });
      await provider.charge(request(1000, 0, 'hoy'));
      now = new Date('2026-10-17T15:00:00Z');
      await provider.charge(request(2000, 0, 'manana'));

      const list = await provider.listTransactions({
        from: new Date('2026-10-16T05:00:00Z'),
        to: new Date('2026-10-17T05:00:00Z'),
      });
      expect(list.map((t) => t.reference)).toEqual(['hoy']);
    });
  });
});
