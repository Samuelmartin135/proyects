import { StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { colors, fontSize } from '@/ui/theme';

/**
 * Pestaña "Cobrar".
 * Paso 1: solo la estructura. En el paso 2 llegan el teclado numérico y la propina.
 */
export default function CobrarScreen() {
  return (
    <Screen>
      <AppText variant="title">Cobrar</AppText>

      <View style={styles.amountBox}>
        <AppText muted>Valor a cobrar</AppText>
        <AppText style={styles.amount}>$0</AppText>
      </View>

      <AppText muted style={styles.center}>
        Aquí irá el teclado numérico.
      </AppText>

      <BigButton label="Cobrar" onPress={() => {}} disabled />
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: fontSize.amount,
    fontWeight: '800',
    color: colors.text,
  },
  center: { textAlign: 'center' },
});
