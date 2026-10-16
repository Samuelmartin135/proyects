import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, fontSize, MIN_TOUCH, radius, spacing } from './theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** Muestra un indicador de carga y bloquea el botón. */
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Botón grande, de ancho completo. Es el botón estándar de la app:
 * fácil de tocar con el pulgar y con texto bien visible.
 */
export function BigButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: Props) {
  const inactive = disabled || loading;
  const palette = PALETTES[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? palette.pressed : palette.background },
        palette.border && { borderWidth: 2, borderColor: palette.border },
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} size="large" />
      ) : (
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const PALETTES: Record<
  Variant,
  { background: string; pressed: string; text: string; border?: string }
> = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary },
  secondary: {
    background: colors.surface,
    pressed: colors.surfacePressed,
    text: colors.primary,
    border: colors.primary,
  },
  danger: { background: colors.danger, pressed: '#9E1F1F', text: colors.onPrimary },
};

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: fontSize.button,
    fontWeight: '800',
  },
  inactive: {
    opacity: 0.45,
  },
});
