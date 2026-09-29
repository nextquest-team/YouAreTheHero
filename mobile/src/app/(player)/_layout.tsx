import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

// Pile de l'espace joueur : les onglets, puis les écrans poussés par-dessus (fiche d'une histoire, page d'un auteur, jeu).
export default function PlayerLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="story/[id]" />
      <Stack.Screen name="author/[id]" />
      <Stack.Screen name="play/[storyId]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="selfie" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
