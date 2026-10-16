import { MemorySaleRepository } from '../MemorySaleRepository';
import { canTransition, type NewSale } from '../SaleRepository';

function newSale(id: string, overrides: Partial<NewSale> = {}): NewSale {
  return {
    id,
    amount: 10000,
    tip: 0,
    mode: 'test',
    provider: 'mock',
    createdAt: new Date('2026-10-16T15:00:00Z'),
    ...overrides,
  };
}

describe('canTransition', () => {
  it('permite cerrar una venta pendiente y reembolsar una aprobada', () => {
    expect(canTransition('pending', 'approved')).toBe(true);
    expect(canTransition('pending', 'declined')).toBe(true);
    expect(canTransition('approved', 'refunded')).toBe(true);
  });

  it('no permite cambios raros', () => {
    expect(canTransition('declined', 'approved')).toBe(false);
    expect(canTransition('approved', 'declined')).toBe(false);
    expect(canTransition('pending', 'refunded')).toBe(false);
    expect(canTransition('refunded', 'approved')).toBe(false);
  });
});

describe('MemorySaleRepository', () => {
  it('crea ventas como pendientes y las cierra con el resultado', async () => {
    const repo = new MemorySaleRepository();
    expect((await repo.create(newSale('a'))).status).toBe('pending');

    const done = await repo.complete('a', { status: 'approved', cardBrand: 'Visa' });

    expect(done).toMatchObject({ status: 'approved', cardBrand: 'Visa', failureReason: null });
  });

  it('no deja crear dos veces la misma venta ni cerrarla dos veces', async () => {
    const repo = new MemorySaleRepository();
    await repo.create(newSale('a'));
    await expect(repo.create(newSale('a'))).rejects.toThrow();
    await repo.complete('a', { status: 'approved' });
    await expect(repo.complete('a', { status: 'declined' })).rejects.toThrow();
  });

  it('lista por día (hora Colombia) y por modo, de la más reciente a la más antigua', async () => {
    const repo = new MemorySaleRepository();
    await repo.create(newSale('temprano', { createdAt: new Date('2026-10-16T13:00:00Z') }));
    await repo.create(newSale('tarde', { createdAt: new Date('2026-10-17T04:30:00Z') })); // 11:30 p. m. del 16
    await repo.create(newSale('otro-dia', { createdAt: new Date('2026-10-17T05:00:00Z') }));
    await repo.create(newSale('real', { mode: 'live', provider: 'sumup' }));

    const list = await repo.listByDay('2026-10-16', 'test');

    expect(list.map((s) => s.id)).toEqual(['tarde', 'temprano']);
    expect((await repo.listByDay('2026-10-16', 'live')).map((s) => s.id)).toEqual(['real']);
  });

  it('avisa a los suscriptores cuando algo cambia', async () => {
    const repo = new MemorySaleRepository();
    const listener = jest.fn();
    const unsubscribe = repo.subscribe(listener);

    await repo.create(newSale('a'));
    await repo.complete('a', { status: 'approved' });
    unsubscribe();
    await repo.create(newSale('b'));

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
