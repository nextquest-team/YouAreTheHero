import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';

import { HeartIcon } from '@/components/common/InkIcons';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { offsetShadow, radius, touchTarget } from '@/theme';

type Props = { storyId: string; initial: boolean };

/** Cœur posé sur la couverture de la fiche : ajoute ou retire l'histoire des favoris. */
export function FavoriteButton({ storyId, initial }: Props) {
  const { colors } = useTheme();
  const { isFavorite, error, toggle } = useFavoriteToggle(storyId, initial);

  const press = async () => {
    const next = !isFavorite;
    await toggle();
    AccessibilityInfo.announceForAccessibility(next ? fr.favorites.added : fr.favorites.removed);
  };

  // L'API a refusé : le cœur est revenu en arrière, on dit pourquoi.
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? fr.favorites.remove : fr.favorites.add}
      accessibilityState={{ selected: isFavorite }}
      style={[
        styles.button,
        { backgroundColor: colors.background },
        isFavorite && { boxShadow: offsetShadow(colors.borderStrong, 3) },
      ]}
    >
      <HeartIcon size={22} color={isFavorite ? colors.accent : colors.text} filled={isFavorite} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
