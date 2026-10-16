/**
 * Fechas en hora de Colombia.
 *
 * Colombia usa UTC−5 todo el año (no tiene horario de verano), así que basta
 * con un desfase fijo. Esto evita depender de la configuración de zona horaria
 * del celular, que a veces está mal puesta.
 *
 * Un "día" de ventas va de las 00:00 a las 24:00 hora Colombia y se identifica
 * con una clave de texto "AAAA-MM-DD" (DayKey).
 */

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Día en formato "AAAA-MM-DD", según la hora de Colombia. */
export type DayKey = string;

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Devuelve un Date "corrido" a hora Colombia para leerlo con getUTC*(). */
function toBogotaWallClock(date: Date): Date {
  return new Date(date.getTime() + BOGOTA_OFFSET_MS);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseDayKey(dayKey: DayKey): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) throw new Error(`Día inválido: ${dayKey}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Clave del día (hora Colombia) en que ocurrió `date`. */
export function toBogotaDayKey(date: Date): DayKey {
  const local = toBogotaWallClock(date);
  return `${local.getUTCFullYear()}-${pad2(local.getUTCMonth() + 1)}-${pad2(local.getUTCDate())}`;
}

/** Clave del día de hoy en Colombia. */
export function todayKey(now: Date = new Date()): DayKey {
  return toBogotaDayKey(now);
}

/**
 * Rango [inicio, fin) del día en instantes reales (UTC), para consultar la base.
 * Ej.: "2026-10-16" → 2026-10-16T05:00:00Z hasta 2026-10-17T05:00:00Z.
 */
export function bogotaDayRange(dayKey: DayKey): { start: Date; end: Date } {
  const { year, month, day } = parseDayKey(dayKey);
  const start = new Date(Date.UTC(year, month - 1, day) - BOGOTA_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Suma (o resta) días a una clave de día. */
export function addDays(dayKey: DayKey, days: number): DayKey {
  const { year, month, day } = parseDayKey(dayKey);
  const moved = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
  return `${moved.getUTCFullYear()}-${pad2(moved.getUTCMonth() + 1)}-${pad2(moved.getUTCDate())}`;
}

/** "Hoy", "Ayer" o "lunes 13 de octubre" (agrega el año si no es el actual). */
export function formatDayLabel(dayKey: DayKey, today: DayKey = todayKey()): string {
  if (dayKey === today) return 'Hoy';
  if (dayKey === addDays(today, -1)) return 'Ayer';

  const { year, month, day } = parseDayKey(dayKey);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const label = `${weekday} ${day} de ${MONTHS[month - 1]}`;
  return year === parseDayKey(today).year ? label : `${label} de ${year}`;
}

/** Hora en Colombia con formato de 12 horas: "3:05 p. m.". */
export function formatTime(date: Date): string {
  const local = toBogotaWallClock(date);
  const hours24 = local.getUTCHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const suffix = hours24 < 12 ? 'a. m.' : 'p. m.';
  return `${hours12}:${pad2(local.getUTCMinutes())} ${suffix}`;
}

/** Fecha y hora completas para el recibo: "16 de octubre de 2026, 3:05 p. m.". */
export function formatDateTime(date: Date): string {
  const { year, month, day } = parseDayKey(toBogotaDayKey(date));
  return `${day} de ${MONTHS[month - 1]} de ${year}, ${formatTime(date)}`;
}
