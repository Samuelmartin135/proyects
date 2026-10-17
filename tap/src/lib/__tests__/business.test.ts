import { readFileSync } from 'fs';
import { join } from 'path';

import { BUSINESS_TYPES, businessTypeLabel, legalTypeLabel, validateBusiness } from '../business';

describe('validateBusiness', () => {
  it('acepta datos completos y limpia espacios de más', () => {
    expect(
      validateBusiness({ businessName: '  Tienda   Doña Rosa ', businessType: 'tienda', legalType: 'persona_natural' }),
    ).toEqual({
      ok: true,
      value: { businessName: 'Tienda Doña Rosa', businessType: 'tienda', legalType: 'persona_natural' },
    });
  });

  it('pide el nombre', () => {
    expect(validateBusiness({ businessName: ' ', businessType: 'tienda', legalType: 'empresa' })).toEqual({
      ok: false,
      message: 'Escriba el nombre de su negocio.',
    });
  });

  it('limita el nombre a 80 letras', () => {
    expect(validateBusiness({ businessName: 'a'.repeat(81), businessType: 'tienda', legalType: 'empresa' }).ok).toBe(false);
  });

  it('pide el tipo de negocio y a nombre de quién está', () => {
    expect(validateBusiness({ businessName: 'Doña Rosa', businessType: null, legalType: 'empresa' })).toEqual({
      ok: false,
      message: 'Elija qué tipo de negocio es.',
    });
    expect(validateBusiness({ businessName: 'Doña Rosa', businessType: 'casino', legalType: 'empresa' }).ok).toBe(false);
    expect(validateBusiness({ businessName: 'Doña Rosa', businessType: 'tienda', legalType: null })).toEqual({
      ok: false,
      message: 'Elija si el negocio está a su nombre o de una empresa.',
    });
  });
});

describe('etiquetas', () => {
  it('traduce los tipos a texto', () => {
    expect(businessTypeLabel('drogueria')).toBe('Droguería');
    expect(businessTypeLabel('desconocido')).toBe('Otro');
    expect(legalTypeLabel('empresa')).toBe('Con NIT y Cámara de Comercio');
  });
});

describe('coherencia con la base de datos', () => {
  it('los tipos de negocio de la app son los mismos que acepta la migración SQL', () => {
    const sql = readFileSync(join(__dirname, '../../../supabase/migrations/20261017000000_init.sql'), 'utf8');
    const match = /business_type in \(([^)]*)\)/.exec(sql);
    expect(match).not.toBeNull();
    const sqlTypes = [...match![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(sqlTypes).toEqual(BUSINESS_TYPES.map((t) => t.id).sort());
  });
});
