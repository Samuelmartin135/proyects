import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

/**
 * Pestaña "Hoy": resumen del día (total vendido, número de ventas, ticket promedio).
 * Se completa en el paso 5.
 */
export default function HoyScreen() {
  return (
    <Screen>
      <AppText variant="title">Hoy</AppText>
      <AppText muted>Aquí verá cuánto ha vendido hoy.</AppText>
    </Screen>
  );
}
