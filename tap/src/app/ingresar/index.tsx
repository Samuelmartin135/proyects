import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { sendCode } from '@/auth/otp';
import { APP_NAME } from '@/config/app';
import { supabase } from '@/data/supabase';
import { parseContact } from '@/lib/contact';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { spacing } from '@/ui/theme';

/**
 * Ingresar o registrarse: un solo campo para correo o celular.
 * Se envía un código de 6 dígitos; no hay contraseñas que olvidar.
 */
export default function IngresarScreen() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    const parsed = parseContact(value);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    if (!supabase) return;

    setError(null);
    setSending(true);
    const result = await sendCode(supabase, parsed.contact);
    setSending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    const contact = parsed.contact;
    router.push({
      pathname: '/ingresar/codigo',
      params: contact.kind === 'email' ? { email: contact.email } : { phone: contact.phone },
    });
  }

  return (
    <Screen edges={['top', 'bottom']} showModeBanner={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <AppText style={styles.logo}>{APP_NAME}</AppText>
            <AppText muted style={styles.center}>
              Cobre con tarjeta desde su celular
            </AppText>
          </View>

          <TextField
            testID="contact-input"
            label="Su correo o número de celular"
            placeholder="Ej. 300 123 4567"
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (error) setError(null);
            }}
            error={error}
            hint="Le enviaremos un código de 6 dígitos. No necesita contraseña."
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={submit}
          />

          <BigButton testID="send-code" label="Recibir código" onPress={submit} loading={sending} />

          {/* TODO(abogado): enlazar los Términos y la Política de tratamiento de datos definitivos. */}
          <AppText variant="small" muted style={styles.center}>
            Al continuar acepta los Términos y la Política de tratamiento de datos de {APP_NAME}.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 6,
  },
  center: { textAlign: 'center' },
});
