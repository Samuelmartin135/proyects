# TAP

Cobros con tarjeta acercándola al celular (Tap to Phone) para pequeños negocios en Colombia.

> Estado: MVP en construcción. Por ahora los cobros son **simulados** (modo DEMO); todavía no se mueve dinero real.

## Requisitos
- Node.js 20 o superior
- Un celular Android
- Una cuenta gratis en [expo.dev](https://expo.dev), para compilar la app de desarrollo en la nube

## Instalar
```bash
git clone <este-repo>
cd proyects/tap
npm install
cp .env.example .env   # luego complete los valores (ver comentarios en el archivo)
```

## Probar en su celular

### Opción A: rápida, con Expo Go
Sirve mientras la app no use el SDK de SumUp.
1. Instale **Expo Go** desde Play Store.
2. En el computador ejecute `npm run start:go`.
3. Abra Expo Go y escanee el código QR. El celular y el computador deben estar en la misma red Wi-Fi; si no funciona, use `npx expo start --tunnel`.

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

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo para la app de desarrollo |
| `npm run start:go` | Servidor de desarrollo para Expo Go |
| `npm test` | Pruebas |
| `npm run typecheck` | Revisión de tipos TypeScript |
| `npm run lint` | Revisión de estilo |
| `npm run check` | Las tres anteriores |

Las decisiones de diseño y técnicas están en [`CLAUDE.md`](./CLAUDE.md).
