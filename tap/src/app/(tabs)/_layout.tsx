import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize } from '@/ui/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ícono de pestaña: relleno cuando está activa, contorno cuando no. */
function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    // Los colores del tema son siempre texto (#RRGGBB).
    const iconColor = typeof color === 'string' ? color : undefined;
    return <Ionicons name={focused ? active : inactive} size={30} color={iconColor} />;
  }
  return TabIcon;
}

/** Pestañas principales: Cobrar, Ventas, Hoy y Cuenta. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.small, fontWeight: '700' },
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Cobrar', tabBarIcon: tabIcon('card', 'card-outline') }}
      />
      <Tabs.Screen
        name="ventas"
        options={{ title: 'Ventas', tabBarIcon: tabIcon('receipt', 'receipt-outline') }}
      />
      <Tabs.Screen
        name="hoy"
        options={{ title: 'Hoy', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{ title: 'Cuenta', tabBarIcon: tabIcon('storefront', 'storefront-outline') }}
      />
    </Tabs>
  );
}
