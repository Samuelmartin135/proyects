import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/ui/theme';

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
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
