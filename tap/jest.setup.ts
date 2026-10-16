/**
 * Configuración común de las pruebas.
 */

// Los íconos cargan fuentes nativas que no existen en las pruebas:
// los reemplazamos por un componente vacío.
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
