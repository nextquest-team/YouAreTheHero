import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

// Pile de l'espace créateur : les onglets, puis l'éditeur d'une histoire poussé par-dessus.
// L'éditeur vit sous /editor (et non /story) pour ne pas partager d'URL avec la fiche joueur.
export default function CreatorLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="editor/[id]" />
    </Stack>
  );
}
