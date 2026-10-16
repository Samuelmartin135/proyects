/**
 * Tema visual de TAP.
 *
 * Pensado para tiendas de barrio: alto contraste, letra grande y botones
 * fáciles de tocar incluso con prisa o con el celular sobre el mostrador.
 */

export const colors = {
  primary: '#2443D6', // azul TAP: acciones principales
  primaryPressed: '#1A32A8',
  onPrimary: '#FFFFFF',

  success: '#0E8A4F', // pago aprobado
  successSoft: '#E3F5EC',
  danger: '#C62828', // pago rechazado / acciones destructivas
  dangerSoft: '#FDECEC',
  warning: '#B26A00', // modo demo, avisos

  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfacePressed: '#ECEEF2',
  border: '#DADDE3',

  text: '#111827',
  textMuted: '#5B6170',
  disabled: '#A9AEB8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 12,
  lg: 20,
} as const;

/** Tamaños de letra (en sp). El monto a cobrar es lo más grande de la app. */
export const fontSize = {
  amount: 56,
  title: 28,
  button: 22,
  body: 20,
  label: 17,
  small: 15,
} as const;

/** Altura mínima de cualquier elemento que se pueda tocar (en dp). */
export const MIN_TOUCH = 64;
