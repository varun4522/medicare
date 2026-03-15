// Global stylesheet — imported once in _layout.tsx to register font faces
// and any shared baseline styles for the app.
import { StyleSheet } from 'react-native';

// Baseline styles applied globally (no-op on native, useful for web)
export const globalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
});
