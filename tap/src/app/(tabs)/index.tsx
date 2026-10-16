import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { applyKeypadKey, formatCOP, validateSaleAmount } from '@/lib/money';
import { AmountDisplay } from '@/ui/AmountDisplay';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Keypad } from '@/ui/Keypad';
import { SalesCard } from '@/ui/SalesCard';
import { Screen } from '@/ui/Screen';
import { colors, spacing } from '@/ui/theme';

/**
 * Pantalla principal "Cobrar" (diseño estilo Jim):
 * tarjeta negra con lo vendido hoy, el monto, el teclado y el botón negro "Cobrar".
 * Después sigue la pantalla de propina y luego "Acerque la tarjeta".
 */
export default function CobrarScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(0);

  // TODO(paso 4): nombre real del negocio. TODO(paso 5): ventas reales de hoy.
  const businessName = 'Su negocio';
  const soldToday = 0;
  const salesCount = 0;

  const validation = validateSaleAmount(amount);
  // Solo mostramos el aviso cuando ya hay algo digitado: en $0 sería ruido.
  const hint = amount === 0 ? 'Digite el valor a cobrar' : validation.ok ? ' ' : validation.message;

  function startCharge() {
    if (!validation.ok) return;
    router.push({ pathname: '/cobro/propina', params: { amount: String(amount) } });
    setAmount(0); // al volver, el teclado queda listo para la siguiente venta
  }

  return (
    <Screen style={styles.screen}>
      <SalesCard businessName={businessName} soldToday={soldToday} salesCount={salesCount} demo />

      <View style={styles.amountArea}>
        <AmountDisplay amount={amount} testID="charge-amount" />
        <AppText
          variant="label"
          style={[styles.hint, !validation.ok && amount > 0 && styles.hintError]}>
          {hint}
        </AppText>
      </View>

      <Keypad onKey={(key) => setAmount((current) => applyKeypadKey(current, key))} />

      <BigButton
        testID="charge-button"
        label={validation.ok ? `Cobrar ${formatCOP(amount)}` : 'Cobrar'}
        onPress={startCharge}
        disabled={!validation.ok}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.sm,
  },
  amountArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  hintError: {
    color: colors.danger,
  },
});
