import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';

import { canCancel, chargeReducer, initialChargeState, phaseCopy } from '@/charge/chargeMachine';
import { runCharge } from '@/charge/runCharge';
import { formatCOP, parseAmountParam } from '@/lib/money';
import { getMode } from '@/mode/modeStore';
import { getPaymentProvider } from '@/payments';
import { newSaleId, saleRepository } from '@/services';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { colors, spacing } from '@/ui/theme';

/**
 * Pantalla "Acerque la tarjeta".
 * Inicia el cobro apenas se abre y, al terminar, pasa a la pantalla de resultado.
 */
export default function TarjetaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; tip?: string }>();
  const amount = parseAmountParam(params.amount);
  const tip = parseAmountParam(params.tip) ?? 0;

  // El modo y el proveedor se fijan al abrir la pantalla: un cobro nunca
  // cambia de Prueba a Real a mitad de camino.
  const [mode] = useState(getMode);
  const [provider] = useState(() => getPaymentProvider(mode));
  const startedRef = useRef(false);
  const [state, dispatch] = useReducer(chargeReducer, initialChargeState);

  useEffect(() => {
    if (startedRef.current || amount === null) return; // evita cobrar dos veces
    startedRef.current = true;

    runCharge(
      { provider, sales: saleRepository, newId: newSaleId },
      { amount, tip, mode },
      dispatch,
    ).then(({ sale, result, saved }) => {
      router.replace({
        pathname: '/cobro/resultado',
        params: {
          status: result.status,
          amount: String(amount),
          tip: String(tip),
          mode,
          saved: saved ? '1' : '0',
          ...(sale ? { saleId: sale.id } : {}),
          ...(result.cardBrand ? { brand: result.cardBrand } : {}),
          ...(result.failureReason ? { reason: result.failureReason } : {}),
        },
      });
    });
  }, [amount, tip, mode, provider, router]);

  // El botón "atrás" de Android cancela el cobro (si todavía se puede).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canCancel(state)) {
        dispatch({ type: 'CANCEL_REQUESTED' });
        void provider.cancel();
      }
      return true; // nunca salir de esta pantalla a mitad de un cobro
    });
    return () => sub.remove();
  }, [state, provider]);

  if (amount === null) {
    return (
      <Screen>
        <AppText>No se encontró el valor a cobrar.</AppText>
        <BigButton label="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  // Modo Real con SumUp: la lectura de la tarjeta la muestra el sistema
  // (en iPhone, la pantalla nativa de Apple "Tap to Pay on iPhone"; en Android,
  // la del SDK de SumUp). Esa pantalla queda encima y trae su propio botón
  // para cancelar; aquí solo dejamos un fondo sencillo.
  if (provider.showsOwnCardScreen) {
    return (
      <Screen edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.center} testID="native-card-screen">
          <AppText muted>Total a cobrar</AppText>
          <AppText style={styles.total} testID="card-total">
            {formatCOP(amount + tip)}
          </AppText>
          <ActivityIndicator size="large" color={colors.text} />
          <AppText muted style={styles.text}>
            Siga las instrucciones en la pantalla de pago.
          </AppText>
        </View>
      </Screen>
    );
  }

  const copy = phaseCopy(state);
  const waitingCard = state.phase === 'waiting_card' && !state.cancelRequested;

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.center}>
        <AppText muted>Total a cobrar</AppText>
        <AppText style={styles.total} testID="card-total">
          {formatCOP(amount + tip)}
        </AppText>

        <ContactlessIcon active={waitingCard} />

        <AppText variant="title" style={styles.text} testID="card-title">
          {copy.title}
        </AppText>
        <AppText muted style={styles.text}>
          {copy.subtitle}
        </AppText>
        {state.phase === 'processing' ? <ActivityIndicator size="large" color={colors.text} /> : null}
      </View>

      {canCancel(state) ? (
        <BigButton
          testID="cancel-charge"
          label="Cancelar"
          variant="secondary"
          onPress={() => {
            dispatch({ type: 'CANCEL_REQUESTED' });
            void provider.cancel();
          }}
        />
      ) : (
        // Mantiene el espacio para que la pantalla no salte.
        <View style={styles.buttonSpace} />
      )}
    </Screen>
  );
}

/** Ícono de pago sin contacto que "late" mientras espera la tarjeta. */
function ContactlessIcon({ active }: { active: boolean }) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [active, scale]);

  return (
    <Animated.View style={[styles.iconCircle, { transform: [{ scale }] }]}>
      <MaterialCommunityIcons name="contactless-payment" size={88} color={colors.onPrimary} />
    </Animated.View>
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
  total: {
    fontSize: 44,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  text: {
    textAlign: 'center',
  },
  buttonSpace: {
    height: 64,
  },
});
