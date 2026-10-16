import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { KeypadKey } from '@/lib/money';

import { colors, radius, spacing } from './theme';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['000', '0', 'backspace'],
];

type Props = {
  onKey: (key: KeypadKey) => void;
  /**
   * "fill": las teclas crecen para ocupar el espacio disponible (pantalla Cobrar).
   * "compact": teclas de altura fija, para pantallas con más contenido.
   */
  layout?: 'fill' | 'compact';
};

/**
 * Teclado numérico grande y limpio (sin bordes, estilo calculadora).
 * Los números van en negro para que se lean bien con cualquier luz.
 * Mantener presionada la tecla de borrar limpia todo el monto.
 */
export function Keypad({ onKey, layout = 'fill' }: Props) {
  const fill = layout === 'fill';

  return (
    <View style={[styles.grid, fill && styles.fill]}>
      {ROWS.map((row) => (
        <View key={row.join()} style={[styles.row, fill && styles.fill]}>
          {row.map((key) => (
            <Pressable
              key={key}
              testID={`key-${key}`}
              accessibilityRole="button"
              accessibilityLabel={key === 'backspace' ? 'Borrar' : key}
              accessibilityHint={key === 'backspace' ? 'Mantenga presionado para borrar todo' : undefined}
              onPress={() => onKey(key)}
              onLongPress={key === 'backspace' ? () => onKey('clear') : undefined}
              style={({ pressed }) => [
                styles.key,
                fill ? styles.keyFill : styles.keyCompact,
                pressed && styles.keyPressed,
              ]}>
              {key === 'backspace' ? (
                <Ionicons name="backspace-outline" size={30} color={colors.text} />
              ) : (
                <Text style={styles.keyLabel}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fill: {
    flex: 1,
  },
  key: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFill: {
    minHeight: 52,
    maxHeight: 76,
  },
  keyCompact: {
    height: 56,
  },
  keyPressed: {
    backgroundColor: colors.surfacePressed,
  },
  keyLabel: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.text,
  },
});
