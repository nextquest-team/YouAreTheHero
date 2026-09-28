import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ImagePickerField } from '@/components/editor/ImagePickerField';
import { Screen } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { radius, spacing, typography } from '@/theme';

// Médiathèque du créateur. Les images restent locales en attendant l'API :
// elles passeront par useMedia (POST /me/media) quand le back sera prêt.
export default function Media() {
  const { colors } = useTheme();
  const [images, setImages] = useState<string[]>([]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.textMuted }]}>{fr.media.overline}</Text>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {fr.media.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.media.intro}</Text>
      </View>

      <ImagePickerField
        label={fr.media.newImage}
        value={null}
        onChange={(uri) => setImages((list) => [uri, ...list])}
        height={140}
      />

      {images.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>{fr.media.empty}</Text>
      ) : (
        <View style={styles.grid}>
          {images.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}
              contentFit="cover"
              accessibilityLabel={fr.media.imageLabel}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: '31.5%', aspectRatio: 1, borderRadius: radius.md },
});
