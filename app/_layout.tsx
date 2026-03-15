import toastConfig from '@/components/CustomToast';
import { Colors } from '@/constants/Colors';
import '@/constants/GlobalStyles';
import AuthProvider from '@/providers/AuthProvider';
import QueryProvider from '@/providers/QueryProvider';
import { Agbalumo_400Regular, useFonts as useAgbalumo } from '@expo-google-fonts/agbalumo';
import { IrishGrover_400Regular, useFonts as useIrishGrover } from '@expo-google-fonts/irish-grover';
import { Roboto_400Regular, Roboto_700Bold, useFonts as useRoboto } from '@expo-google-fonts/roboto';
import { Tinos_400Regular, Tinos_700Bold, useFonts as useTinos } from '@expo-google-fonts/tinos';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const [tinosLoaded] = useTinos({ Tinos: Tinos_400Regular, TinosBold: Tinos_700Bold });
  const [irishLoaded] = useIrishGrover({ IrishGrover: IrishGrover_400Regular });
  const [robotoLoaded] = useRoboto({ Roboto: Roboto_400Regular, RobotoBold: Roboto_700Bold });
  const [agbalumoLoaded] = useAgbalumo({ Agbalumo: Agbalumo_400Regular });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  const loaded = tinosLoaded && irishLoaded && robotoLoaded && agbalumoLoaded;

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
          <Toast config={toastConfig} />
        </QueryProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}