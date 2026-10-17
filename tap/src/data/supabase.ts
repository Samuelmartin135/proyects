/**
 * Cliente de Supabase.
 *
 * Usa solo la clave PUBLICABLE (EXPO_PUBLIC_SUPABASE_ANON_KEY): es segura dentro
 * de la app porque la base de datos está protegida con RLS. La clave secreta
 * (service_role) NUNCA va en la app.
 *
 * Si las variables no están configuradas, `supabase` es null y la app funciona
 * en modo demo sin cuenta (útil para demos antes de crear el proyecto).
 */

import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { LargeSecureStore } from './LargeSecureStore';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** true si hay URL y clave reales (no las de ejemplo de .env.example). */
export const isSupabaseConfigured =
  url.startsWith('https://') && !url.includes('xxxxxxxx') && publishableKey.length > 20;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Renueva la sesión solo mientras la app está abierta (recomendación de Supabase
// para apps móviles): ahorra batería y evita errores al volver del fondo.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
