import {
  getMode,
  isLiveUnlocked,
  LIVE_LOCKED_REASON,
  resetModeForTests,
  setLiveUnlocked,
  setMode,
} from '../modeStore';

describe('modo Prueba / Real', () => {
  beforeEach(() => resetModeForTests());

  it('arranca en modo Prueba', () => {
    expect(getMode()).toBe('test');
    expect(isLiveUnlocked()).toBe(false);
  });

  it('el modo Real está bloqueado sin verificación', () => {
    expect(setMode('live')).toEqual({ ok: false, reason: LIVE_LOCKED_REASON });
    expect(getMode()).toBe('test');
  });

  it('con la verificación aprobada se puede pasar a Real y volver', () => {
    setLiveUnlocked(true);
    expect(setMode('live')).toEqual({ ok: true });
    expect(getMode()).toBe('live');
    expect(setMode('test')).toEqual({ ok: true });
    expect(getMode()).toBe('test');
  });

  it('si se pierde la verificación estando en Real, vuelve a Prueba', () => {
    setLiveUnlocked(true);
    setMode('live');
    setLiveUnlocked(false);
    expect(getMode()).toBe('test');
  });
});
