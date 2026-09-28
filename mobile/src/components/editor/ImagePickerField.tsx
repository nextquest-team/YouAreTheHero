import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { ImageSource, useImagePicker } from '@/hooks/useImagePicker';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, radius, spacing } from '@/theme';

type Props = {
  label: string; // ex. « Décor de la scène »
  value: string | null; // URI locale ou chemin renvoyé par l'API ("/uploads/abc.jpg")
  onChange: (uri: string) => void;
  height?: number;
};

// Aperçu d'une image avec deux boutons : appareil photo et galerie
export function ImagePickerField({ label, value, onChange, height = 180 }: Props) {
  const { colors } = useTheme();
  const { pick, busy, error } = useImagePicker();

  const handle = async (source: ImageSource) => {
    const uri = await pick(source);
    if (uri) onChange(uri);
  };

  return (
    <View style={styles.field}>
      <View
        style={[
          styles.frame,
          { height, backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong },
          !value && styles.empty,
        ]}
      >
        {value ? (
          <Image
            source={{ uri: value.startsWith('/uploads/') ? (assetUrl(value) ?? undefined) : value }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={label}
          />
        ) : (
          <Text style={[styles.placeholder, { color: colors.textMuted }]}>{label}</Text>
        )}

        <View style={styles.actions}>
          <Button
            label={fr.imagePicker.camera}
            icon="camera"
            variant="secondary"
            loading={busy}
            accessibilityHint={fr.imagePicker.cameraHint}
            onPress={() => handle('camera')}
            style={[styles.action, { backgroundColor: colors.background }]}
          />
          <Button
            label={fr.imagePicker.library}
            icon="image"
            variant="secondary"
            disabled={busy}
            accessibilityHint={fr.imagePicker.libraryHint}
            onPress={() => handle('library')}
            style={[styles.action, { backgroundColor: colors.background }]}
          />
        </View>
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  frame: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { borderWidth: 2, borderStyle: 'dashed' },
  placeholder: { fontFamily: fonts.bodySemiBold, fontSize: 14, marginBottom: 56 },
  actions: {
    position: 'absolute',
    right: spacing.sm + 2,
    bottom: spacing.sm + 2,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: { paddingHorizontal: spacing.md, borderRadius: radius.sm },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
});
