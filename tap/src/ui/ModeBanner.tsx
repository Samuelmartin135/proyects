import { StyleSheet, Text, View } from 'react-native';

import { useAppMode } from '@/mode/modeStore';

import { colors } from './theme';

/**
 * Franja naranja de "MODO PRUEBA" (como Stripe) para que nunca se confunda
 * un cobro simulado con uno real. En modo Real no se muestra nada.
 */
export function ModeBanner() {
  const mode = useAppMode();
  if (mode !== 'test') return null;

  return (
    <View style={styles.banner} accessibilityRole="text" testID="mode-banner">
      <Text style={styles.text}>MODO PRUEBA · Los cobros son simulados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.testMode,
    paddingVertical: 4,
    alignItems: 'center',
  },
  text: {
    color: colors.onTestMode,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
