import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

// Pile de l'éditeur d'une histoire : infos et publication, puis stats, ennemis, objets et scènes.
export default function StoryEditorLayout() {
  const { colors } = useTheme();

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
