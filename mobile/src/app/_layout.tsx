import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider } from '@/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { colors, isDark } = useTheme();
  const { isLoading, user } = useAuth();
  const ready = fontsReady && !isLoading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Chaque rôle a sa propre navigation : (creator)/index et (player)/index répondent
  // tous deux à "/", c'est la garde qui choisit lequel existe.
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === 'PLAYER'}>
          <Stack.Screen name="(player)" />
        </Stack.Protected>
        <Stack.Protected guard={user?.role === 'CREATOR'}>
          <Stack.Screen name="(creator)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack fontsReady={Boolean(fontsLoaded || fontError)} />
      </AuthProvider>
    </ThemeProvider>
  );
}
