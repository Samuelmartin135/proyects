/**
 * Tema visual de TAP.
 *
 * Estilo limpio en blanco y negro (inspirado en Jim): fondo blanco, tarjeta
 * negra y botón negro en forma de píldora. Pensado para tiendas de barrio:
 * alto contraste, letra grande y botones fáciles de tocar con prisa.
 * El verde y el rojo se reservan para "Aprobado" y "Rechazado".
 */

export const colors = {
  primary: '#111111', // negro: acciones principales y tarjeta
  primaryPressed: '#3A3A3A',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#A1A1AA', // texto secundario sobre la tarjeta negra

  success: '#0E8A4F', // pago aprobado
  successSoft: '#E3F5EC',
  danger: '#C62828', // pago rechazado / acciones destructivas
  dangerSoft: '#FDECEC',
  warning: '#B26A00', // modo demo, avisos

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfacePressed: '#F1F1F3',
  border: '#E4E4E7',

  text: '#111111',
  textMuted: '#5F6068',
  disabled: '#B4B4BB',
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
  pill: 999,
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
