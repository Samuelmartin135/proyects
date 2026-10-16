import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/config/app';
import { formatCOP } from '@/lib/money';

import { colors, radius, spacing } from './theme';

type Props = {
  businessName: string;
  /** Total vendido hoy (sin propinas). */
  soldToday: number;
  salesCount: number;
  /** Muestra la etiqueta DEMO cuando los cobros son simulados. */
  demo?: boolean;
};

/**
 * Tarjeta negra de la pantalla principal (estilo Jim).
 *
 * Importante: NO muestra un "saldo". TAP no guarda dinero; el proveedor de
 * pagos le consigna al comerciante en su cuenta bancaria. Por eso la tarjeta
 * muestra lo vendido hoy, no un saldo disponible.
 */
export function SalesCard({ businessName, soldToday, salesCount, demo = false }: Props) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${businessName}. Vendido hoy ${formatCOP(soldToday)} en ${salesCount} ${
        salesCount === 1 ? 'venta' : 'ventas'
      }`}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        {demo ? <Text style={styles.demo}>DEMO</Text> : null}
      </View>

      <View>
        <Text style={styles.muted}>Vendido hoy</Text>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {formatCOP(soldToday)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.business} numberOfLines={1}>
          {businessName} · {salesCount} {salesCount === 1 ? 'venta' : 'ventas'}
        </Text>
        <MaterialCommunityIcons name="contactless-payment" size={28} color={colors.onPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  demo: {
    color: colors.primary,
    backgroundColor: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  muted: {
    color: colors.onPrimaryMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  amount: {
    color: colors.onPrimary,
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  business: {
    flex: 1,
    color: colors.onPrimaryMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
