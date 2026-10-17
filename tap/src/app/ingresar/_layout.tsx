import { Stack } from 'expo-router';

import { colors, fontSize } from '@/ui/theme';

/** Ingreso: primero el correo o celular (index) y luego el código. */
export default function IngresarLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: fontSize.button, fontWeight: '800' },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="codigo" options={{ title: '' }} />
    </Stack>
  );
}
