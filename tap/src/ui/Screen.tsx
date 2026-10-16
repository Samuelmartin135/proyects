import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from './theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /**
   * Bordes de pantalla que deben respetar la zona segura (notch, barra de gestos).
   * En pantallas con pestañas abajo, la barra ya protege el borde inferior.
   */
  edges?: Edge[];
};

/** Contenedor base de cada pantalla: fondo, márgenes y zona segura. */
export function Screen({ children, style, edges = ['top'] }: Props) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
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
