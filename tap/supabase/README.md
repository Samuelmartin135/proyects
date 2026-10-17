# Supabase para TAP: guía de configuración

Siga estos pasos una sola vez. Calcule unos 20 minutos.

## 1. Crear el proyecto
1. Entre a [supabase.com](https://supabase.com) → **New project**.
2. Nombre: `tap-pruebas`. Más adelante cree otro, `tap-produccion`, para cobros reales.
3. Región: la más cercana a Colombia, por ejemplo **East US** o **São Paulo**.
4. Guarde la contraseña de la base de datos en un lugar seguro. La app no la usa.

## 2. Crear las tablas (migración)
1. En el panel, abra **SQL Editor** → **New query**.
2. Copie todo el contenido de `migrations/20261017000000_init.sql`, péguelo y presione **Run**.
3. Revise en **Table Editor** que aparezcan `merchants` y `sales`, las dos con el candado de **RLS activado**.

> Si instala la [CLI de Supabase](https://supabase.com/docs/guides/cli), también puede usar `supabase link` y `supabase db push`.

## 3. Ingreso con código por correo
1. Abra **Authentication → Sign In / Providers → Email** y verifique que esté activado.
2. Abra **Authentication → Emails → Templates**. En las plantillas **Magic Link** y **Confirm signup**, reemplace el contenido por algo así:
   ```html
   <h2>Su código para entrar a TAP</h2>
   <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
   <p>Escríbalo en la app. Vence en una hora. Si usted no lo pidió, ignore este correo.</p>
   ```
   Sin `{{ .Token }}`, el correo llega con un enlace en vez del código.
3. Revise que la longitud del código (**Email OTP Length**) sea **6**.
4. **Antes de lanzar:** el correo que trae Supabase envía muy pocos mensajes por hora. Configure un SMTP propio en **Authentication → Emails → SMTP Settings**. Por ejemplo, Resend tiene un plan gratis.

## 4. Ingreso con código por celular (SMS)
1. Abra **Authentication → Sign In / Providers → Phone** y actívelo.
2. Elija un proveedor de SMS, por ejemplo **Twilio**, y pegue sus credenciales. Cada SMS a Colombia cuesta unos centavos de dólar.
3. **Para probar sin pagar SMS:** en la misma pantalla, en **Test Phone Numbers and OTPs**, agregue `573001234567=123456`. Ese número siempre recibe el código `123456` y no se envía ningún SMS.

Si todavía no quiere configurar SMS, ingrese con el correo; la app funciona igual.

## 5. Conectar la app
1. Abra **Project Settings → API** (o **API Keys**) y copie la **Project URL** y la clave **publishable / anon**.
2. En `tap/`, copie el archivo de ejemplo y pegue los valores:
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SU-PROYECTO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```
3. Reinicie el servidor de desarrollo con `npm start` o `npm run start:go`.

> ⚠️ **Nunca** ponga en la app la clave **secret / service_role**: esa salta la seguridad de la base de datos.

## Pruebas de seguridad de la base de datos
Las reglas de RLS se prueban en un Postgres local, sin tocar su proyecto:
```bash
npm run test:db
```
Verifican, entre otras cosas, que:
- un comercio no puede ver ni tocar las ventas de otro;
- no se puede guardar un número de tarjeta;
- una venta aprobada no se puede cambiar;
- el modo Real está bloqueado sin verificación.
