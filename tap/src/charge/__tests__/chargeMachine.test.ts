import {
  canCancel,
  chargeReducer,
  initialChargeState,
  phaseCopy,
  type ChargeEvent,
  type ChargeState,
} from '../chargeMachine';

function run(events: ChargeEvent[], start: ChargeState = initialChargeState): ChargeState {
  return events.reduce(chargeReducer, start);
}

describe('chargeReducer', () => {
  it('recorre el camino feliz', () => {
    const state = run([
      { type: 'REGISTERING', saleId: 's1' },
      { type: 'PROGRESS', progress: 'preparing' },
      { type: 'PROGRESS', progress: 'waiting_card' },
      { type: 'PROGRESS', progress: 'processing' },
      { type: 'FINISHED', result: { status: 'approved' }, saved: true },
    ]);
    expect(state).toEqual({
      phase: 'finished',
      saleId: 's1',
      result: { status: 'approved' },
      saveFailed: false,
      cancelRequested: false,
    });
  });

  it('el progreso nunca retrocede', () => {
    const state = run([
      { type: 'REGISTERING', saleId: 's1' },
      { type: 'PROGRESS', progress: 'processing' },
      { type: 'PROGRESS', progress: 'waiting_card' },
    ]);
    expect(state.phase).toBe('processing');
  });

  it('después de terminar ignora cualquier evento', () => {
    const finished = run([{ type: 'FINISHED', result: { status: 'declined' }, saved: true }]);
    expect(run([{ type: 'PROGRESS', progress: 'waiting_card' }], finished)).toBe(finished);
    expect(run([{ type: 'FINISHED', result: { status: 'approved' }, saved: true }], finished)).toBe(
      finished,
    );
  });

  it('marca cuando el resultado no se pudo guardar', () => {
    const state = run([{ type: 'FINISHED', result: { status: 'approved' }, saved: false }]);
    expect(state.saveFailed).toBe(true);
  });

  describe('cancelar', () => {
    it('se permite mientras prepara o espera la tarjeta', () => {
      const waiting = run([
        { type: 'REGISTERING', saleId: 's1' },
        { type: 'PROGRESS', progress: 'waiting_card' },
      ]);
      expect(canCancel(waiting)).toBe(true);
      expect(run([{ type: 'CANCEL_REQUESTED' }], waiting).cancelRequested).toBe(true);
    });

    it('no se permite cuando ya está procesando la tarjeta', () => {
      const processing = run([
        { type: 'REGISTERING', saleId: 's1' },
        { type: 'PROGRESS', progress: 'processing' },
      ]);
      expect(canCancel(processing)).toBe(false);
      expect(run([{ type: 'CANCEL_REQUESTED' }], processing).cancelRequested).toBe(false);
    });

    it('no se pide dos veces', () => {
      const canceled = run([
        { type: 'REGISTERING', saleId: 's1' },
        { type: 'PROGRESS', progress: 'preparing' },
        { type: 'CANCEL_REQUESTED' },
      ]);
      expect(canCancel(canceled)).toBe(false);
    });
  });
});

describe('phaseCopy', () => {
  it('dice "Acerque la tarjeta" mientras espera la tarjeta', () => {
    const waiting = run([
      { type: 'REGISTERING', saleId: 's1' },
      { type: 'PROGRESS', progress: 'waiting_card' },
    ]);
    expect(phaseCopy(waiting).title).toBe('Acerque la tarjeta');
  });

  it('pide no retirar la tarjeta mientras procesa', () => {
    const processing = run([{ type: 'PROGRESS', progress: 'processing' }]);
    expect(phaseCopy(processing).subtitle).toBe('No retire la tarjeta todavía.');
  });

  it('avisa que está cancelando', () => {
    const canceling = run([{ type: 'PROGRESS', progress: 'waiting_card' }, { type: 'CANCEL_REQUESTED' }]);
    expect(phaseCopy(canceling).title).toBe('Cancelando…');
  });
});
