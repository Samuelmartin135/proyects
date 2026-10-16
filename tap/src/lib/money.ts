/**
 * Dinero en TAP.
 *
 * Todos los montos son ENTEROS en pesos colombianos (COP), sin centavos.
 * Ejemplo: doce mil quinientos pesos = 12500.
 * Cada proveedor de pagos convierte a su propio formato en su adaptador.
 */

export const CURRENCY = 'COP' as const;

/**
 * Límites por cobro.
 * TODO(SumUp): confirmar los mínimos y máximos reales para Tap to Pay en Colombia.
 */
export const MIN_CHARGE_COP = 1_000;
export const MAX_CHARGE_COP = 10_000_000;

/** true si el valor es un monto válido: entero, no negativo y sin decimales. */
export function isWholePesos(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Formatea pesos al estilo colombiano: 12500 → "$12.500".
 *
 * No usamos Intl.NumberFormat a propósito: según el celular puede agregar
 * espacios, ",00" o usar otro separador. Aquí el resultado es siempre igual.
 */
export function formatCOP(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  // Inserta un punto cada tres dígitos, de derecha a izquierda.
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${grouped}`;
}

// ---------------------------------------------------------------------------
// Teclado numérico
// ---------------------------------------------------------------------------

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type KeypadKey = Digit | '000' | 'backspace' | 'clear';

/**
 * Aplica una tecla del teclado al monto actual y devuelve el nuevo monto.
 *
 * - Los dígitos se agregan a la derecha: 12 + "5" → 125.
 * - "000" multiplica por mil (muy útil en COP: 5 + "000" → 5.000).
 * - Los ceros a la izquierda se ignoran: 0 + "0" → 0.
 * - Si la tecla haría pasar el máximo, se ignora y el monto no cambia.
 */
export function applyKeypadKey(current: number, key: KeypadKey, max = MAX_CHARGE_COP): number {
  switch (key) {
    case 'clear':
      return 0;
    case 'backspace':
      return Math.floor(current / 10);
    case '000': {
      const next = current * 1000;
      return next <= max ? next : current;
    }
    default: {
      const next = current * 10 + Number(key);
      return next <= max ? next : current;
    }
  }
}

// ---------------------------------------------------------------------------
// Validación de un cobro
// ---------------------------------------------------------------------------

export type ValidationResult = { ok: true } | { ok: false; message: string };

/** Valida solo el valor de la venta (sin propina), p. ej. para habilitar el botón "Cobrar". */
export function validateSaleAmount(amount: number): ValidationResult {
  if (!isWholePesos(amount)) {
    return { ok: false, message: 'El valor no es válido.' };
  }
  if (amount < MIN_CHARGE_COP) {
    return { ok: false, message: `El valor mínimo es ${formatCOP(MIN_CHARGE_COP)}.` };
  }
  if (amount > MAX_CHARGE_COP) {
    return { ok: false, message: `El valor máximo es ${formatCOP(MAX_CHARGE_COP)}.` };
  }
  return { ok: true };
}

/** Valida el cobro completo: valor de la venta + propina. */
export function validateCharge(amount: number, tip: number): ValidationResult {
  const sale = validateSaleAmount(amount);
  if (!sale.ok) return sale;

  if (!isWholePesos(tip)) {
    return { ok: false, message: 'La propina no es válida.' };
  }
  // Una propina mayor que la venta casi siempre es un error al digitar.
  if (tip > amount) {
    return { ok: false, message: 'La propina no puede ser mayor que el valor de la venta.' };
  }
  if (amount + tip > MAX_CHARGE_COP) {
    return {
      ok: false,
      message: `El total con propina no puede pasar de ${formatCOP(MAX_CHARGE_COP)}.`,
    };
  }
  return { ok: true };
}

/**
 * Convierte un parámetro de navegación (texto) en un monto.
 * Devuelve null si no es un entero válido, para no cobrar nunca un valor dañado.
 */
export function parseAmountParam(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string' || !/^\d{1,12}$/.test(value)) return null;
  const amount = Number(value);
  return isWholePesos(amount) ? amount : null;
}
