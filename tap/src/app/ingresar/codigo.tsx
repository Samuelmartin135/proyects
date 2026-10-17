import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { sendCode, verifyCode } from '@/auth/otp';
import { supabase } from '@/data/supabase';
import { describeContact, normalizeOtp, OTP_LENGTH, parseContact, type Contact } from '@/lib/contact';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { spacing } from '@/ui/theme';

/** Segundos de espera antes de poder pedir otro código. */
export const RESEND_SECONDS = 60;

/**
 * Escribir el código de 6 dígitos. Al acertar, la sesión queda abierta y la app
 * lleva sola a "Su negocio" (primera vez) o a "Cobrar".
 */
export default function CodigoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const parsed = parseContact(params.email ?? params.phone ?? '');
  const contact: Contact | null = parsed.ok ? parsed.contact : null;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Cuenta regresiva para "Reenviar código".
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function verify(token: string) {
    if (!contact || !supabase || token.length !== OTP_LENGTH || verifying) return;
    setError(null);
    setVerifying(true);
    const result = await verifyCode(supabase, contact, token);
    setVerifying(false);
    if (!result.ok) setError(result.message);
    // Si salió bien, AuthProvider detecta la sesión y la app cambia de pantalla sola.
  }

  async function resend() {
    if (!contact || !supabase) return;
    setError(null);
    const result = await sendCode(supabase, contact);
    if (result.ok) {
      setNotice('Le enviamos un código nuevo.');
      setSecondsLeft(RESEND_SECONDS);
    } else {
      setError(result.message);
    }
  }

  if (!contact) {
    return (
      <Screen edges={['bottom']} showModeBanner={false}>
        <AppText>Falta el correo o celular. Vuelva atrás e intente de nuevo.</AppText>
        <BigButton label="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} showModeBanner={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="title">Escriba el código</AppText>
          <AppText muted>
            Se lo enviamos a <AppText style={styles.bold}>{describeContact(contact)}</AppText>
            {contact.kind === 'email' ? '. Revise también la carpeta de correo no deseado.' : ' por mensaje de texto.'}
          </AppText>

          <TextField
            testID="code-input"
            label="Código de 6 dígitos"
            value={code}
            onChangeText={(text) => {
              const clean = normalizeOtp(text);
              setCode(clean);
              setNotice(null);
              if (clean.length === OTP_LENGTH) void verify(clean); // entra solo al completar
            }}
            error={error}
            hint={notice ?? undefined}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            maxLength={OTP_LENGTH + 2}
            autoFocus
            style={styles.codeInput}
          />

          <BigButton
            testID="verify-code"
            label="Entrar"
            onPress={() => verify(code)}
            disabled={code.length !== OTP_LENGTH}
            loading={verifying}
          />

          <BigButton
            testID="resend-code"
            variant="secondary"
            label={secondsLeft > 0 ? `Reenviar código en ${secondsLeft} s` : 'Reenviar código'}
            onPress={resend}
            disabled={secondsLeft > 0}
          />
          <BigButton variant="secondary" label="Cambiar correo o celular" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    gap: spacing.md,
  },
  bold: {
    fontWeight: '800',
  },
  codeInput: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
  },
});
