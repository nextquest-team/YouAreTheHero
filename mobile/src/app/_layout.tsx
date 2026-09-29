import { IMFellEnglish_400Regular, IMFellEnglish_400Regular_Italic } from '@expo-google-fonts/im-fell-english';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import {
  Spectral_400Regular,
  Spectral_400Regular_Italic,
  Spectral_600SemiBold,
  Spectral_700Bold,
} from '@expo-google-fonts/spectral';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';

import { AuthProvider } from '@/auth/AuthProvider';
import { AnimatedSplash } from '@/components/common/AnimatedSplash';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootStack({ fontsReady }: { fontsReady: boolean }) {
  const { colors, isDark } = useTheme();
  const { isLoading, user } = useAuth();
  const ready = fontsReady && !isLoading;
  // Le splash natif (fond papier, sans image) passe la main au splash animé, joué une fois au lancement
  const [splashDone, setSplashDone] = useState(false);
  const endSplash = useCallback(() => setSplashDone(true), []);

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
      {splashDone ? null : <AnimatedSplash onDone={endSplash} />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IMFellEnglish_400Regular,
    IMFellEnglish_400Regular_Italic,
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    Spectral_600SemiBold,
    Spectral_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack fontsReady={Boolean(fontsLoaded || fontError)} />
      </AuthProvider>
    </ThemeProvider>
  );
}
