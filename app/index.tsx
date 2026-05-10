import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';

// Phase 0: Show wordmark and redirect to welcome.
// Phase 1: Replace with auth-aware redirect (session check → (auth)/welcome or (app)/(tabs)).
export default function RootIndex() {
  return <Redirect href="/(auth)/welcome" />;
}
