import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { createMerchant } from '@/data/merchants';
import { supabase } from '@/data/supabase';
import { BUSINESS_TYPES, LEGAL_TYPES, validateBusiness, type BusinessType, type LegalType } from '@/lib/business';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { ChoiceButton } from '@/ui/ChoiceButton';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { colors, spacing } from '@/ui/theme';

/** Divide una lista en filas de 2 (para la cuadrícula de opciones). */
function pairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/**
 * "Su negocio": se pide una sola vez, después del primer ingreso.
 * Nombre, tipo de negocio y si está a nombre de una persona o de una empresa.
 */
export default function NegocioScreen() {
  const { setMerchant } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType | null>(null);
  const [legal, setLegal] = useState<LegalType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const validation = validateBusiness({ businessName: name, businessType: type, legalType: legal });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (!supabase) return;

    setError(null);
    setSaving(true);
    try {
      const merchant = await createMerchant(supabase, validation.value);
      setMerchant(merchant); // la app pasa sola a "Cobrar"
    } catch {
      setError('No se pudo guardar. Revise su conexión e intente de nuevo.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']} showModeBanner={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="title">Cuéntenos de su negocio</AppText>

          <TextField
            testID="business-name"
            label="Nombre del negocio"
            placeholder="Ej. Tienda Doña Rosa"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={80}
          />

          <View style={styles.section}>
            <AppText variant="label">¿Qué tipo de negocio es?</AppText>
            {pairs(BUSINESS_TYPES).map((row) => (
              <View key={row[0].id} style={styles.row}>
                {row.map((option) => (
                  <ChoiceButton
                    key={option.id}
                    testID={`type-${option.id}`}
                    label={option.label}
                    selected={type === option.id}
                    onPress={() => setType(option.id)}
                  />
                ))}
                {row.length === 1 ? <View style={styles.spacer} /> : null}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <AppText variant="label">¿A nombre de quién está el negocio?</AppText>
            <View style={styles.row}>
              {LEGAL_TYPES.map((option) => (
                <ChoiceButton
                  key={option.id}
                  testID={`legal-${option.id}`}
                  label={option.label}
                  selected={legal === option.id}
                  onPress={() => setLegal(option.id)}
                />
              ))}
            </View>
            <AppText variant="small" muted>
              {legal === 'empresa'
                ? 'Para el modo Real le pediremos el NIT, la Cámara de Comercio y el documento del representante legal.'
                : 'Para el modo Real le pediremos su cédula, cédula de extranjería, PPT o pasaporte.'}
            </AppText>
          </View>

          {error ? (
            <AppText variant="label" style={styles.error} testID="business-error">
              {error}
            </AppText>
          ) : null}

          <BigButton testID="save-business" label="Guardar y empezar" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  spacer: { flex: 1 },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
