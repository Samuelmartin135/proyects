import { APP_NAME } from '@/config/app';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

/**
 * Pestaña "Cuenta": datos del negocio y cerrar sesión.
 * Se completa en el paso 4.
 */
export default function CuentaScreen() {
  return (
    <Screen>
      <AppText variant="title">Cuenta</AppText>
      <AppText muted>Aquí verá los datos de su negocio.</AppText>
      <AppText variant="small" muted>
        {APP_NAME} · versión de prueba
      </AppText>
    </Screen>
  );
}
