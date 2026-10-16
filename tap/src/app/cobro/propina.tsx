import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { applyKeypadKey, formatCOP, parseAmountParam, validateCharge } from '@/lib/money';
import { calculateTip, isSameTipOption, NO_TIP, TIP_PERCENTS, tipOptionLabel, type TipOption } from '@/lib/tip';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { ChoiceButton } from '@/ui/ChoiceButton';
import { Keypad } from '@/ui/Keypad';
import { Screen } from '@/ui/Screen';
import { colors, spacing } from '@/ui/theme';

/**
 * Propina opcional. Por defecto está marcado "Sin propina",
 * así que si no hay propina basta con tocar "Cobrar".
 */
export default function PropinaScreen() {
  const params = useLocalSearchParams<{ amount?: string }>();
  const amount = parseAmountParam(params.amount);

  const [option, setOption] = useState<TipOption>(NO_TIP);

  if (amount === null) {
    // No debería pasar: solo se llega aquí desde "Cobrar" con un monto válido.
    return (
      <Screen edges={['bottom']}>
        <AppText>No se encontró el valor a cobrar. Vuelva atrás e intente de nuevo.</AppText>
      </Screen>
    );
  }

  const tip = calculateTip(amount, option);
  const total = amount + tip;
  const validation = validateCharge(amount, tip);

  const options: TipOption[] = [
    NO_TIP,
    ...TIP_PERCENTS.map((percent): TipOption => ({ kind: 'percent', percent })),
    // Al elegir "Otro valor" se conserva lo que ya se había digitado.
    option.kind === 'custom' ? option : { kind: 'custom', amount: 0 },
  ];

  function charge() {
    if (!validation.ok) return;
    // TODO(paso 3): ir a la pantalla "Acerque la tarjeta" con el cobro simulado.
    Alert.alert('Casi listo', `El cobro de ${formatCOP(total)} con tarjeta llega en el paso 3.`);
  }

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.saleRow}>
          <AppText muted>Valor de la venta</AppText>
          <AppText variant="label">{formatCOP(amount)}</AppText>
        </View>

        <AppText variant="label">¿Desea agregar propina?</AppText>
        <View style={styles.grid}>
          {[options.slice(0, 2), options.slice(2, 4)].map((row, i) => (
            <View key={i} style={styles.gridRow}>
              {row.map((opt) => (
                <ChoiceButton
                  key={opt.kind === 'percent' ? `p${opt.percent}` : opt.kind}
                  testID={`tip-${opt.kind === 'percent' ? opt.percent : opt.kind}`}
                  label={tipOptionLabel(amount, opt)}
                  selected={isSameTipOption(option, opt)}
                  onPress={() => setOption(opt)}
                />
              ))}
            </View>
          ))}
        </View>

        {option.kind === 'custom' ? (
          <View style={styles.custom}>
            <View style={styles.saleRow}>
              <AppText variant="label">Propina</AppText>
              <AppText variant="title" testID="custom-tip">
                {formatCOP(option.amount)}
              </AppText>
            </View>
            <Keypad
              layout="compact"
              onKey={(key) =>
                setOption({
                  kind: 'custom',
                  // La propina no puede ser mayor que la venta.
                  amount: applyKeypadKey(option.amount, key, amount),
                })
              }
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.saleRow}>
          <AppText variant="label">Total a cobrar</AppText>
          <AppText variant="title" testID="total">
            {formatCOP(total)}
          </AppText>
        </View>
        {!validation.ok ? (
          <AppText variant="label" style={styles.error}>
            {validation.message}
          </AppText>
        ) : null}
        <BigButton
          testID="confirm-charge"
          label={`Cobrar ${formatCOP(total)}`}
          onPress={charge}
          disabled={!validation.ok}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.md,
  },
  scroll: {
    gap: spacing.md,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  custom: {
    gap: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
