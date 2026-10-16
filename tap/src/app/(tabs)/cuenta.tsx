import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { APP_NAME } from '@/config/app';
import { setMode, useAppMode, isLiveUnlocked } from '@/mode/modeStore';
import { AppText } from '@/ui/AppText';
import { ChoiceButton } from '@/ui/ChoiceButton';
import { Screen } from '@/ui/Screen';
import { colors, radius, spacing } from '@/ui/theme';

/** Montos especiales del simulador, para mostrar en demos. */
const TEST_AMOUNTS = [
  { example: '$5.013', result: 'Rechazado: fondos insuficientes' },
  { example: '$5.014', result: 'Rechazado: tarjeta no permitida' },
  { example: '$5.015', result: 'Nadie acerca la tarjeta (tiempo agotado)' },
  { example: 'Cualquier otro', result: 'Aprobado' },
];

/**
 * Pestaña "Cuenta": modo Prueba / Real (como Stripe) y datos del negocio.
 * Los datos del negocio y cerrar sesión llegan en el paso 4.
 */
export default function CuentaScreen() {
  const mode = useAppMode();
  const liveLocked = !isLiveUnlocked();

  function chooseLive() {
    const change = setMode('live');
    if (!change.ok) Alert.alert('Modo Real', change.reason);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="title">Cuenta</AppText>

        <View style={styles.section}>
          <AppText variant="label">Modo</AppText>
          <View style={styles.row}>
            <ChoiceButton
              testID="mode-test"
              label="Prueba"
              selected={mode === 'test'}
              onPress={() => setMode('test')}
            />
            <ChoiceButton
              testID="mode-live"
              label={liveLocked ? 'Real (bloqueado)' : 'Real'}
              selected={mode === 'live'}
              onPress={chooseLive}
            />
          </View>
          <AppText muted>
            {mode === 'test'
              ? 'Está en modo Prueba: puede practicar y hacer demostraciones sin mover dinero. Estas ventas se guardan aparte de las reales.'
              : 'Está en modo Real: los cobros son de verdad.'}
          </AppText>
          {liveLocked ? (
            <AppText variant="small" muted>
              El modo Real se activa cuando se verifique su identidad (cédula, cédula de extranjería, PPT o
              pasaporte). Esto llega pronto.
            </AppText>
          ) : null}
        </View>

        {mode === 'test' ? (
          <View style={styles.section}>
            <AppText variant="label">Valores para probar</AppText>
            <View style={styles.table}>
              {TEST_AMOUNTS.map((row, i) => (
                <View
                  key={row.example}
                  style={[styles.tableRow, i === TEST_AMOUNTS.length - 1 && styles.tableRowLast]}>
                  <AppText variant="label" style={styles.tableAmount}>
                    {row.example}
                  </AppText>
                  <AppText variant="small" muted style={styles.tableResult}>
                    {row.result}
                  </AppText>
                </View>
              ))}
            </View>
            <AppText variant="small" muted>
              Cuenta el total con propina: lo que importa es cómo termina el valor.
            </AppText>
          </View>
        ) : null}

        <AppText variant="small" muted>
          {APP_NAME} · versión de prueba
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableAmount: {
    width: 120,
  },
  tableResult: {
    flex: 1,
  },
});
