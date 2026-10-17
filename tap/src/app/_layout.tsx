import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { colors, fontSize, spacing } from '@/ui/theme';

// La pantalla de bienvenida se queda hasta saber si hay sesión guardada.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      {Platform.OS === 'web' ? (
        // En el navegador (demo web) la app se ve del ancho de un celular,
        // centrada, en vez de estirarse por toda la pantalla del computador.
        <View style={styles.webBackdrop}>
          <View style={styles.webPhone}>
            <RootNavigator />
          </View>
        </View>
      ) : (
        <RootNavigator />
      )}
    </AuthProvider>
  );
}

/**
 * Cada grupo de pantallas se muestra solo en su momento:
 * - sin sesión → ingresar y código
 * - con sesión pero sin negocio → "Su negocio"
 * - listo → la app (pestañas y cobro)
 */
function RootNavigator() {
  const { status, retry } = useAuth();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.center, styles.padded]}>
        <AppText variant="title" style={styles.text}>
          Sin conexión
        </AppText>
        <AppText muted style={styles.text}>
          No pudimos cargar los datos de su negocio. Revise su internet.
        </AppText>
        <BigButton label="Intentar de nuevo" onPress={retry} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Encabezado de las pantallas internas (propina, recibo…).
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: fontSize.button, fontWeight: '800' },
        headerShadowVisible: false,
      }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="ingresar" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'needsBusiness'}>
        <Stack.Screen name="negocio" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cobro/propina" options={{ headerShown: true, title: 'Propina' }} />
        {/* Durante el cobro y en el resultado no se puede "deslizar para volver". */}
        <Stack.Screen name="cobro/tarjeta" options={{ gestureEnabled: false }} />
        <Stack.Screen name="cobro/resultado" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E9E9EC',
  },
  webPhone: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  padded: {
    padding: spacing.lg,
  },
  text: {
    textAlign: 'center',
  },
});
