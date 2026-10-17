import { describeContact, normalizeOtp, parseContact } from '../contact';

describe('parseContact', () => {
  it('acepta correos y los pasa a minúsculas', () => {
    expect(parseContact('  Rosa.Tienda@Gmail.com ')).toEqual({
      ok: true,
      contact: { kind: 'email', email: 'rosa.tienda@gmail.com' },
    });
  });

  it('rechaza correos mal escritos', () => {
    expect(parseContact('rosa@gmail')).toEqual({
      ok: false,
      message: 'Revise el correo: debe ser como nombre@correo.com',
    });
    expect(parseContact('rosa @gmail.com').ok).toBe(false);
  });

  it.each([
    ['3001234567'],
    ['300 123 4567'],
    ['300-123-4567'],
    ['(300) 123 4567'],
    ['+57 300 123 4567'],
    ['573001234567'],
  ])('acepta el celular "%s" y lo normaliza a +57', (input) => {
    expect(parseContact(input)).toEqual({ ok: true, contact: { kind: 'phone', phone: '+573001234567' } });
  });

  it('exige 10 dígitos que empiecen por 3', () => {
    const msg = 'El celular debe tener 10 dígitos y empezar por 3.';
    expect(parseContact('300123456')).toEqual({ ok: false, message: msg }); // 9 dígitos
    expect(parseContact('6011234567')).toEqual({ ok: false, message: msg }); // fijo de Bogotá
    expect(parseContact('30012345678')).toEqual({ ok: false, message: msg }); // 11 dígitos
  });

  it('pide escribir algo si está vacío', () => {
    expect(parseContact('   ')).toEqual({ ok: false, message: 'Escriba su correo o su número de celular.' });
  });

  it('rechaza texto que no es ni correo ni celular', () => {
    expect(parseContact('doña rosa')).toEqual({ ok: false, message: 'Escriba un correo o un celular válido.' });
  });
});

describe('describeContact', () => {
  it('muestra el celular en grupos fáciles de leer', () => {
    expect(describeContact({ kind: 'phone', phone: '+573001234567' })).toBe('300 123 4567');
  });
  it('muestra el correo tal cual', () => {
    expect(describeContact({ kind: 'email', email: 'a@b.co' })).toBe('a@b.co');
  });
});

describe('normalizeOtp', () => {
  it('deja solo 6 dígitos', () => {
    expect(normalizeOtp('123 456')).toBe('123456');
    expect(normalizeOtp('12-34-56-78')).toBe('123456');
    expect(normalizeOtp('abc')).toBe('');
  });
});
