import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveText, useAnnounce } from '@/components/common/LiveText';
import { LoadState } from '@/components/common/LoadState';
import { ImagePickerField } from '@/components/editor/ImagePickerField';
import { Screen } from '@/components/ui';
import { useMedia } from '@/hooks/useMedia';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import type { Media as MediaItem, Usage } from '@/types/api';
import { radius, spacing, typography } from '@/theme';

/** « Couverture : La Crypte du Roi Oublié », une ligne par endroit qui utilise l'image. */
function usageLines(usedIn: Usage[]): string {
  return usedIn.map((usage) => `• ${fr.media.usageKinds[usage.kind]} : ${usage.label}`).join('\n');
}

// Médiathèque du créateur : les images envoyées ici servent ensuite de couverture,
// de décor, d'ennemi ou d'objet dans l'éditeur.
export default function Media() {
  const { colors } = useTheme();
  const { data, loading, error, reload, busy, actionError, upload, remove } = useMedia();
  useAnnounce(busy ? fr.media.working : null);
  // Taille des vignettes en pixels, 3 par ligne : sur iOS, une largeur en % avec aspectRatio
  // donnait des vignettes de taille nulle, et expo-image ne charge rien dans une vue vide.
  const [gridWidth, setGridWidth] = useState(0);
  const thumbSize = Math.floor((gridWidth - 2 * spacing.sm) / 3);

  const handleDelete = async (media: MediaItem) => {
    const result = await remove(media.id);
    if (!result.ok && result.usedIn.length > 0) {
      Alert.alert(fr.media.inUseTitle, `${fr.media.inUseIntro}\n\n${usageLines(result.usedIn)}`);
    }
  };

  const confirmDelete = (media: MediaItem) => {
    Alert.alert(fr.media.deleteTitle, fr.media.deleteMessage, [
      { text: fr.common.cancel, style: 'cancel' },
      { text: fr.common.delete, style: 'destructive', onPress: () => handleDelete(media) },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.textMuted }]}>{fr.media.overline}</Text>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {fr.media.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.media.intro}</Text>
      </View>

      <ImagePickerField label={fr.media.newImage} value={null} onChange={upload} height={140} />

      {busy ? (
        <View style={styles.status}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.media.working}</Text>
        </View>
      ) : null}
      {actionError ? (
        <LiveText style={[typography.caption, { color: colors.danger }]}>
          {actionError}
        </LiveText>
      ) : null}

      {data === null ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>{fr.media.empty}</Text>
      ) : (
        <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
          {data.map((media, index) => (
            <Pressable
              key={media.id}
              onPress={() => confirmDelete(media)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={fr.media.imageLabel(index + 1, data.length)}
              accessibilityHint={fr.media.deleteHint}
              style={({ pressed }) => [styles.thumb, { width: thumbSize, height: thumbSize, opacity: pressed ? 0.7 : 1 }]}
            >
              <Image
                source={{ uri: assetUrl(media.url) ?? undefined }}
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceAlt }]}
                contentFit="cover"
                onError={(event) => {
                  if (__DEV__) console.warn(`[image] ${assetUrl(media.url)}`, event.error);
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { borderRadius: radius.md, overflow: 'hidden' },
});
