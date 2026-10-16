/**
 * Configuración común de las pruebas.
 */

// Los íconos cargan fuentes nativas que no existen en las pruebas:
// los reemplazamos por un componente vacío.
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// La vibración no existe en las pruebas: se registra la llamada y listo.
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
