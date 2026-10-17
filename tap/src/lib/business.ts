/**
 * Datos del negocio que se piden en el primer ingreso.
 */

/** Tipos de negocio. Debe coincidir con la lista de la migración SQL (hay una prueba). */
export const BUSINESS_TYPES = [
  { id: 'tienda', label: 'Tienda de barrio' },
  { id: 'minimercado', label: 'Minimercado' },
  { id: 'restaurante', label: 'Restaurante' },
  { id: 'cafeteria', label: 'Cafetería' },
  { id: 'panaderia', label: 'Panadería' },
  { id: 'drogueria', label: 'Droguería' },
  { id: 'peluqueria', label: 'Peluquería' },
  { id: 'ferreteria', label: 'Ferretería' },
  { id: 'ropa', label: 'Ropa y calzado' },
  { id: 'otro', label: 'Otro' },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]['id'];

export const LEGAL_TYPES = [
  { id: 'persona_natural', label: 'A mi nombre', hint: 'Persona natural' },
  { id: 'empresa', label: 'Una empresa', hint: 'Con NIT y Cámara de Comercio' },
] as const;

export type LegalType = (typeof LEGAL_TYPES)[number]['id'];

export type Merchant = {
  id: string;
  businessName: string;
  businessType: BusinessType;
  legalType: LegalType;
};

export type BusinessInput = {
  businessName: string;
  businessType: BusinessType;
  legalType: LegalType;
};

export type BusinessValidation =
  | { ok: true; value: BusinessInput }
  | { ok: false; message: string };

export function businessTypeLabel(type: string): string {
  return BUSINESS_TYPES.find((t) => t.id === type)?.label ?? 'Otro';
}

export function legalTypeLabel(type: string): string {
  return LEGAL_TYPES.find((t) => t.id === type)?.hint ?? '';
}

/** Valida y limpia los datos del formulario "Su negocio". */
export function validateBusiness(input: {
  businessName: string;
  businessType: string | null;
  legalType: string | null;
}): BusinessValidation {
  // Quita espacios de más: "  Tienda   Doña Rosa " → "Tienda Doña Rosa".
  const name = input.businessName.trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    return { ok: false, message: 'Escriba el nombre de su negocio.' };
  }
  if (name.length > 80) {
    return { ok: false, message: 'El nombre es muy largo (máximo 80 letras).' };
  }
  const type = BUSINESS_TYPES.find((t) => t.id === input.businessType);
  if (!type) {
    return { ok: false, message: 'Elija qué tipo de negocio es.' };
  }
  const legal = LEGAL_TYPES.find((t) => t.id === input.legalType);
  if (!legal) {
    return { ok: false, message: 'Elija si el negocio está a su nombre o de una empresa.' };
  }
  return { ok: true, value: { businessName: name, businessType: type.id, legalType: legal.id } };
}
