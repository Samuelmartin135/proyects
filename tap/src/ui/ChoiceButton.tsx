import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, MIN_TOUCH, radius, spacing } from './theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** Opción seleccionable grande (p. ej. las opciones de propina). */
export function ChoiceButton({ label, selected, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  label: {
    fontSize: fontSize.label,
    fontWeight: '700',
    color: colors.text,
  },
  labelSelected: {
    color: colors.onPrimary,
  },
});
