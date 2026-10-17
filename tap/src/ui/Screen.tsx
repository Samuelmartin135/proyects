import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ModeBanner } from './ModeBanner';
import { colors, spacing } from './theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /**
   * Bordes de pantalla que deben respetar la zona segura (notch, barra de gestos).
   * En pantallas con pestañas abajo, la barra ya protege el borde inferior.
   */
  edges?: Edge[];
  /** Franja "MODO PRUEBA". Se oculta en las pantallas de ingreso y registro. */
  showModeBanner?: boolean;
};

/**
 * Contenedor base de cada pantalla: fondo, márgenes, zona segura y la franja
 * "MODO PRUEBA" cuando corresponde.
 */
export function Screen({ children, style, edges = ['top'], showModeBanner = true }: Props) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      {showModeBanner ? <ModeBanner /> : null}
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
});
