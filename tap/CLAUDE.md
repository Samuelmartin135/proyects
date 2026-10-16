# TAP: decisiones del proyecto

App Android para que tiendas de barrio en Colombia cobren con tarjeta acercándola al celular (Tap to Phone).
Usuarios no técnicos: **simple, en español, botones grandes**.

Guía general de Expo (versiones, comandos, reglas de CNG): @AGENTS.md

## Stack
- **App:** Expo SDK 58 · React Native 0.88 · TypeScript estricto · Expo Router (rutas en `src/app/`).
- **Development build** (`expo-dev-client`): el SDK de pagos necesitará módulos nativos. Las carpetas `android/` e `ios/` se generan solas; no se editan a mano, se configuran en `app.json` o con config plugins.
- **Backend:** Supabase (Auth, Postgres, RLS). La app usa solo la clave publicable; la seguridad la da RLS.
- **Pruebas:** Jest (`jest-expo`) + Testing Library (render es `async` en v14: `await render(...)`).

## Comandos (dentro de `tap/`)
```bash
npm test              # pruebas
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npm run check         # las tres
npx expo start --dev-client
EXPO_OFFLINE=1 npx expo export --platform android   # verifica que el bundle compila
```
- Instalar paquetes con `npx expo install <paquete>` (versiones compatibles con el SDK). En este entorno de nube `api.expo.dev` está bloqueado: usar `EXPO_OFFLINE=1 npx expo install ...`.
- `package.json` tiene `overrides` de `react-native-worklets` a 0.13.0. Sin eso, npm anida `expo-modules-core` dentro de `expo/` (conflicto de peer opcional) y fallan Jest y Metro. Si se actualiza el SDK, revisar si sigue haciendo falta.

## Pagos: reglas no negociables
- **No procesamos pagos.** Todo cobro pasa por la interfaz `PaymentProvider` (`src/payments/`):
  - `MockPaymentProvider`: demos y desarrollo.
  - `SumUpPaymentProvider`: esqueleto con TODOs hasta tener el SDK.
  - Se elige con `EXPO_PUBLIC_PAYMENT_PROVIDER=mock|sumup`.
- **Nunca guardar ni registrar datos de tarjeta.** Eso incluye número, últimos 4 dígitos, vencimiento, titular y CVV. Lo único permitido es la marca (Visa, Mastercard…).
  - Los tipos propios no tienen campos para esos datos.
  - Los resultados del SDK se traducen con lista blanca (`sumupMapper.ts`) y hay pruebas que verifican que se descartan.
  - Nunca hacer `console.log` de respuestas crudas del proveedor.
- **Idempotencia:** antes de cobrar se crea la venta en Supabase como `pending`, con un UUID generado en la app. Ese UUID es la referencia ante el proveedor.
- **Claves secretas** del proveedor (API key de SumUp): nunca en la app. Reembolsos, historial del proveedor y verificación de ventas van por una Edge Function de Supabase (pendiente).
- **Limitación conocida del MVP:** es la app la que marca la venta como `approved`. RLS y un trigger limitan qué cambios se permiten, pero la verificación real contra SumUp en el servidor queda pendiente.

## Dinero y fechas
- Montos: **enteros en pesos colombianos** (sin centavos), en `bigint` en la base. Cada adaptador del proveedor convierte al formato que pida su SDK.
- Formato: `formatCOP(12500)` → `"$12.500"`. Es un formateador propio: no se usa `Intl`, porque varía entre dispositivos.
- Teclado: dígitos, tecla "000" y borrar.
- Límites en `src/lib/money.ts`: mínimo $1.000 y máximo $10.000.000. **Hay que confirmarlos con SumUp.**
- Propina: Sin propina / 10 % / 15 % / valor propio. Se redondea al peso.
- Zona horaria: `America/Bogota` (UTC−5 fijo, sin horario de verano). El "día" va de 00:00 a 24:00 hora Colombia.
- Resumen del día (solo ventas `approved`):
  - total vendido = Σ montos sin propina;
  - propinas = Σ propinas;
  - n.º de ventas;
  - ticket promedio = total vendido ÷ ventas, redondeado, o 0 si no hay ventas.
  - Las ventas rechazadas o reembolsadas se muestran en el historial pero no suman.
- Las ventas del mock (`provider = 'mock'`) se marcan como **DEMO** en el historial y en el recibo.

## Auth y datos
- Ingreso **sin contraseña**: código de 6 dígitos por correo o por SMS (`signInWithOtp` / `verifyOtp`).
  - Celular colombiano: 10 dígitos que empiezan por 3, normalizado a `+57…`.
  - En el primer ingreso se pide nombre y tipo de negocio (tabla `merchants`).
- Tablas: `merchants` (1 dueño = 1 comercio en el MVP) y `sales`. RLS en todas.
- Sesión guardada cifrada (patrón LargeSecureStore: clave en SecureStore y datos cifrados con AES).

## Interfaz y textos
- Se trata al usuario de **usted**. Textos de pantalla y comentarios en español; nombres de código en inglés.
- **Diseño estilo Jim** (pedido del dueño):
  - Fondo blanco, botón principal negro en forma de píldora y tarjeta negra arriba en "Cobrar".
  - El teclado no tiene bordes y los números van en negro. Jim los usa en gris claro, pero aquí se prioriza que se lean bien.
  - Verde y rojo se usan solo para "Aprobado" y "Rechazado".
- **La tarjeta negra NO muestra un saldo**, porque TAP no guarda dinero (el proveedor le paga al comerciante en su banco). Muestra "Vendido hoy" y el número de ventas. No usar logos de Visa ni "Agregar a Wallet".
- Usar los componentes de `src/ui/` (`Screen`, `AppText`, `BigButton`, `Keypad`, `SalesCard`…) y los valores de `theme.ts`.
  - Mínimo táctil: 64 dp.
  - Monto: 56 sp.
- **Capturas para revisar el diseño:** hay un export web (`react-native-web` está solo como dependencia de desarrollo):
  1. `EXPO_OFFLINE=1 npx expo export --platform web --output-dir <carpeta>`.
  2. Servir la carpeta y tomar capturas con Playwright (Chromium en `/opt/pw-browsers`), en 393×851 y 360×720.
  3. En las pruebas, los íconos se reemplazan en `jest.setup.ts`.
- Recibo: **imagen** (`react-native-view-shot` + `expo-sharing`) que se comparte por WhatsApp. El enlace web queda para después.

## Estructura
```
src/app/       pantallas (Expo Router): (tabs)/ Cobrar·Ventas·Hoy·Cuenta, (auth)/, cobro/, venta/[id]
src/payments/  PaymentProvider + Mock + SumUp
src/charge/    máquina de estados del cobro (pura) + hook
src/lib/       lógica pura: dinero, propina, fechas, resumen, recibo, contacto
src/data/      Supabase
src/ui/        tema y componentes
supabase/      migraciones SQL + pruebas de RLS
```

## Forma de trabajo
- Pasos pequeños. Cada paso termina con `npm run check` y el bundle de Android en verde, más instrucciones para probar en el celular.
- La lógica de pagos y montos vive en funciones puras con pruebas.
- Fuera del MVP por ahora:
  - botón de reembolso en la interfaz (la interfaz `PaymentProvider` y el mock sí lo tienen);
  - recibo por enlace web;
  - varios empleados por comercio;
  - modo sin internet.
