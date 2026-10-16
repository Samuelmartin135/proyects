import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors, fontSize } from '@/ui/theme';

/**
 * Raíz de la navegación.
 * Aquí se agregarán los proveedores globales (sesión, comercio) y la guardia
 * que separa las pantallas de ingreso de las pantallas de la app.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          // Encabezado de las pantallas internas (propina, tarjeta, recibo…).
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontSize: fontSize.button, fontWeight: '800' },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cobro/propina" options={{ headerShown: true, title: 'Propina' }} />
        {/* Durante el cobro y en el resultado no se puede "deslizar para volver". */}
        <Stack.Screen name="cobro/tarjeta" options={{ gestureEnabled: false }} />
        <Stack.Screen name="cobro/resultado" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
