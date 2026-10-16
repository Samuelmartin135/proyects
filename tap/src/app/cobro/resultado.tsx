import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, type ComponentProps } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { formatCOP, parseAmountParam } from '@/lib/money';
import type { ChargeOutcome } from '@/payments/PaymentProvider';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { colors, radius, spacing } from '@/ui/theme';

type Params = {
  status?: string;
  amount?: string;
  tip?: string;
  mode?: string;
  saved?: string;
  saleId?: string;
  brand?: string;
  reason?: string;
};

const LOOK: Record<
  ChargeOutcome,
  { title: string; icon: ComponentProps<typeof Ionicons>['name']; color: string; soft: string }
> = {
  approved: { title: 'Pago aprobado', icon: 'checkmark', color: colors.success, soft: colors.successSoft },
  declined: { title: 'Pago rechazado', icon: 'close', color: colors.danger, soft: colors.dangerSoft },
  canceled: { title: 'Cobro cancelado', icon: 'remove', color: colors.textMuted, soft: colors.surfacePressed },
  failed: { title: 'No se pudo cobrar', icon: 'alert', color: colors.danger, soft: colors.dangerSoft },
};

function toOutcome(value: string | undefined): ChargeOutcome {
  return value === 'approved' || value === 'declined' || value === 'canceled' ? value : 'failed';
}

/** Resultado del cobro: aprobado (verde) o no aprobado (rojo/gris), en grande. */
export default function ResultadoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const outcome = toOutcome(params.status);
  const amount = parseAmountParam(params.amount) ?? 0;
  const tip = parseAmountParam(params.tip) ?? 0;
  const look = LOOK[outcome];
  const approved = outcome === 'approved';

  /** Vuelve a la pantalla "Cobrar", lista para la siguiente venta. */
  const newCharge = () => router.dismissAll();

  // El botón "atrás" de Android también lleva a "Cobrar" (no a la propina).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.dismissAll();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: look.soft }]}>
          <Ionicons name={look.icon} size={88} color={look.color} />
        </View>

        <AppText variant="title" style={[styles.title, { color: look.color }]} testID="result-title">
          {look.title}
        </AppText>
        <AppText style={styles.total} testID="result-total">
          {formatCOP(amount + tip)}
        </AppText>

        {approved ? (
          <AppText muted style={styles.centerText}>
            {[params.brand, tip > 0 ? `Incluye propina de ${formatCOP(tip)}` : null]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        ) : params.reason ? (
          <AppText variant="label" style={styles.centerText} testID="result-reason">
            {params.reason}
          </AppText>
        ) : null}

        {params.mode === 'test' ? (
          <AppText variant="small" muted style={styles.centerText}>
            Cobro de prueba: no se movió dinero real.
          </AppText>
        ) : null}

        {params.saved === '0' ? (
          <View style={styles.warning}>
            <AppText variant="label" style={styles.warningText}>
              {approved
                ? 'El pago se hizo, pero no se pudo guardar en el historial. Se volverá a intentar. No cobre de nuevo.'
                : 'No se pudo guardar este resultado en el historial.'}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.buttons}>
        {approved ? (
          // TODO(paso 7): botón "Compartir recibo" por WhatsApp.
          <BigButton testID="new-charge" label="Nuevo cobro" onPress={newCharge} />
        ) : (
          <>
            <BigButton
              testID="retry-charge"
              label="Intentar de nuevo"
              onPress={() =>
                router.replace({
                  pathname: '/cobro/tarjeta',
                  params: { amount: String(amount), tip: String(tip) },
                })
              }
            />
            <BigButton testID="new-charge" label="Nuevo cobro" variant="secondary" onPress={newCharge} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  total: {
    fontSize: 44,
    fontWeight: '800',
  },
  centerText: {
    textAlign: 'center',
  },
  warning: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  warningText: {
    color: colors.danger,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.sm,
  },
});
