import { StyleSheet, View } from 'react-native';

import { formatCOP } from '@/lib/money';

import { AppText } from './AppText';
import { colors, fontSize } from './theme';

type Props = {
  amount: number;
  label?: string;
  /** "large" para el monto principal; "medium" para montos secundarios. */
  size?: 'large' | 'medium';
  testID?: string;
};

/** Monto en pesos, bien grande. Se achica solo si no cabe en una línea. */
export function AmountDisplay({ amount, label, size = 'large', testID }: Props) {
  const isEmpty = amount === 0;
  return (
    <View style={styles.container}>
      {label ? <AppText muted>{label}</AppText> : null}
      <AppText
        testID={testID}
        accessibilityLiveRegion="polite"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.amount, size === 'medium' && styles.medium, isEmpty && styles.empty]}>
        {formatCOP(amount)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: fontSize.amount,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  medium: {
    fontSize: 36,
  },
  empty: {
    color: colors.disabled,
  },
});
