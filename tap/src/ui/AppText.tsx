import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSize } from './theme';

type Variant = 'title' | 'body' | 'label' | 'small';

type Props = TextProps & {
  variant?: Variant;
  /** Texto en gris, para información secundaria. */
  muted?: boolean;
};

/** Texto con los tamaños del tema. Úselo en lugar de <Text> para mantener la app legible. */
export function AppText({ variant = 'body', muted = false, style, ...rest }: Props) {
  return <Text style={[styles.base, styles[variant], muted && styles.muted, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: { color: colors.text },
  title: { fontSize: fontSize.title, fontWeight: '800' },
  body: { fontSize: fontSize.body },
  label: { fontSize: fontSize.label, fontWeight: '600' },
  small: { fontSize: fontSize.small },
  muted: { color: colors.textMuted },
});
