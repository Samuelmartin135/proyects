import {
  addDays,
  bogotaDayRange,
  formatDateTime,
  formatDayLabel,
  formatTime,
  toBogotaDayKey,
  todayKey,
} from '../dates';

describe('toBogotaDayKey', () => {
  it('usa la hora de Colombia (UTC−5), no la del servidor', () => {
    // 11:59:59 p. m. del 15 en Colombia
    expect(toBogotaDayKey(new Date('2026-10-16T04:59:59.999Z'))).toBe('2026-10-15');
    // 12:00 a. m. del 16 en Colombia
    expect(toBogotaDayKey(new Date('2026-10-16T05:00:00.000Z'))).toBe('2026-10-16');
  });

  it('cambia bien de año', () => {
    expect(toBogotaDayKey(new Date('2027-01-01T04:00:00Z'))).toBe('2026-12-31');
    expect(toBogotaDayKey(new Date('2027-01-01T05:00:00Z'))).toBe('2027-01-01');
  });

  it('todayKey usa el reloj que se le pase', () => {
    expect(todayKey(new Date('2026-10-16T15:00:00Z'))).toBe('2026-10-16');
  });
});

describe('bogotaDayRange', () => {
  it('devuelve el día completo en hora Colombia como instantes UTC', () => {
    const { start, end } = bogotaDayRange('2026-10-16');
    expect(start.toISOString()).toBe('2026-10-16T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-10-17T05:00:00.000Z');
  });

  it('es coherente con toBogotaDayKey en los bordes', () => {
    const { start, end } = bogotaDayRange('2026-02-28');
    expect(toBogotaDayKey(start)).toBe('2026-02-28');
    expect(toBogotaDayKey(new Date(end.getTime() - 1))).toBe('2026-02-28');
    expect(toBogotaDayKey(end)).toBe('2026-03-01');
  });

  it('rechaza claves mal formadas', () => {
    expect(() => bogotaDayRange('16/10/2026')).toThrow();
  });
});

describe('addDays', () => {
  it('suma y resta días cruzando meses y años', () => {
    expect(addDays('2026-10-16', 1)).toBe('2026-10-17');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // año bisiesto
  });
});

describe('formatDayLabel', () => {
  const today = '2026-10-16'; // viernes

  it('dice "Hoy" y "Ayer"', () => {
    expect(formatDayLabel('2026-10-16', today)).toBe('Hoy');
    expect(formatDayLabel('2026-10-15', today)).toBe('Ayer');
  });

  it('muestra día de la semana y fecha para otros días', () => {
    expect(formatDayLabel('2026-10-12', today)).toBe('lunes 12 de octubre');
  });

  it('agrega el año si no es el actual', () => {
    expect(formatDayLabel('2025-12-24', today)).toBe('miércoles 24 de diciembre de 2025');
  });
});

describe('formatTime y formatDateTime', () => {
  it('usa 12 horas con a. m. / p. m. en hora Colombia', () => {
    expect(formatTime(new Date('2026-10-16T05:00:00Z'))).toBe('12:00 a. m.');
    expect(formatTime(new Date('2026-10-16T14:05:00Z'))).toBe('9:05 a. m.');
    expect(formatTime(new Date('2026-10-16T17:00:00Z'))).toBe('12:00 p. m.');
    expect(formatTime(new Date('2026-10-16T20:30:00Z'))).toBe('3:30 p. m.');
  });

  it('arma la fecha completa para el recibo', () => {
    expect(formatDateTime(new Date('2026-10-16T20:30:00Z'))).toBe(
      '16 de octubre de 2026, 3:30 p. m.',
    );
  });
});
