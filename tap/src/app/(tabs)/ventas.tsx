import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

/**
 * Pestaña "Ventas": historial de ventas por día con su total.
 * Se completa en el paso 5.
 */
export default function VentasScreen() {
  return (
    <Screen>
      <AppText variant="title">Ventas</AppText>
      <AppText muted>Aquí verá sus ventas de cada día y el total.</AppText>
    </Screen>
  );
}
