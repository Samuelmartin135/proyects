# TAP

Cobros con tarjeta acercándola al celular (Tap to Phone en Android, Tap to Pay on iPhone) para pequeños negocios en Colombia.

> Estado: MVP en construcción. Por ahora los cobros son **simulados** (modo Prueba); todavía no se mueve dinero real.

## Requisitos
- Node.js 20 o superior
- Un celular Android o un iPhone
- Una cuenta gratis en [expo.dev](https://expo.dev), para compilar la app de desarrollo en la nube

## Instalar
```bash
git clone <este-repo>
cd proyects/tap
npm install
cp .env.example .env   # luego complete los valores (ver comentarios en el archivo)
```

Para registrarse e ingresar con código hace falta un proyecto de Supabase; siga [`supabase/README.md`](./supabase/README.md). Sin él, la app abre en **modo demo sin cuenta**.

## Probar en su celular

### Opción A: rápida, con Expo Go (Android o iPhone)
Sirve para todo el modo Prueba, mientras la app no use el SDK de SumUp.
1. Instale **Expo Go** desde Play Store o App Store.
2. En el computador ejecute `npm run start:go`.
3. Escanee el código QR: en Android, con Expo Go; en iPhone, con la cámara. El celular y el computador deben estar en la misma red Wi-Fi; si no funciona, use `npx expo start --tunnel`.

### Opción B: development build
Es la opción recomendada y la que se necesitará con SumUp.
1. Compile una vez la app de desarrollo en la nube de Expo:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build --platform android --profile development
   ```
2. Cuando termine, abra en el celular el enlace que muestra la terminal e instale el APK. Android le pedirá permitir "instalar apps desconocidas".
3. Inicie el servidor con `npm start` y escanee el QR con la app **TAP** recién instalada. También puede abrirla y elegir el servidor de la lista.

Solo hay que volver a compilar (paso 1) si cambian las dependencias nativas o `app.json`. Los cambios de código se ven al instante.

En iPhone, el development build exige una cuenta paga de Apple Developer ($99 USD al año) y registrar el iPhone: `npx eas-cli@latest device:create`, y luego compilar con `--platform ios`. Para cobrar de verdad con la pantalla nativa de Apple (Tap to Pay on iPhone) la cuenta debe ser de **organización** y Apple debe aprobar un permiso especial (ver `CLAUDE.md`).

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo para la app de desarrollo |
| `npm run start:go` | Servidor de desarrollo para Expo Go |
| `npm test` | Pruebas |
| `npm run typecheck` | Revisión de tipos TypeScript |
| `npm run lint` | Revisión de estilo |
| `npm run check` | Las tres anteriores |
| `npm run test:db` | Pruebas de seguridad de la base de datos (Postgres local) |

Las decisiones de diseño y técnicas están en [`CLAUDE.md`](./CLAUDE.md).
