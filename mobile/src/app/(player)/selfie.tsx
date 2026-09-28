import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { CircleIconButton } from '@/components/hero/CircleIconButton';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useHeroPhoto } from '@/hooks/useHeroPhoto';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { updateMe } from '@/services/auth';
import { apiUpload } from '@/services/client';
import { updateHeroFace } from '@/services/play';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';

const FRAME_HEIGHT = 300;
const GUIDE_SIZE = 180;

// Selfie du héros : profil (avatarUrl) par défaut, ou photo propre à une histoire
// (heroFaceUrl) quand l'écran reçoit un storyId (ouvert depuis le rond du héros en jeu).
export default function SelfieScreen() {
  const { storyId } = useLocalSearchParams<{ storyId?: string }>();
  const forStory = Boolean(storyId);
  const { colors } = useTheme();
  const { setUser } = useAuth();

  // La vérification ne déclenche jamais la demande système : seul un appui explicite le fait.
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { pickFromGallery, captureFromCamera, busy: photoBusy, error: photoError } = useHeroPhoto();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cameraActive = Boolean(permission?.granted) && !cameraUnavailable;
  const busy = photoBusy || saving;

  const onPickGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setPhotoUri(uri);
  };

  const onCapture = async () => {
    const uri = await captureFromCamera(cameraRef.current);
    if (uri) setPhotoUri(uri);
  };

  const toggleFacing = () => {
    setCameraReady(false);
    setFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const onSave = async () => {
    if (!photoUri) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { url } = await apiUpload<{ url: string }>('/uploads', photoUri);
      if (forStory && storyId) {
        await updateHeroFace(storyId, url);
      } else {
        setUser(await updateMe({ avatarUrl: url }));
      }
      router.back();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const renderFrameContent = () => {
    if (permission === null) {
      return <ActivityIndicator color={colors.accent} accessibilityLabel={fr.common.loading} />;
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionBox}>
          <Feather name="camera-off" size={40} color={colors.textMuted} />
          <Text style={[typography.body, styles.permissionText, { color: colors.textSoft }]}>
            {permission.canAskAgain ? fr.selfie.permissionExplain : fr.selfie.permissionDeniedExplain}
          </Text>
          {permission.canAskAgain ? (
            <Button label={fr.selfie.takeSelfie} onPress={() => requestPermission()} />
          ) : (
            <Button label={fr.selfie.openSettings} onPress={() => Linking.openSettings()} />
          )}
        </View>
      );
    }

    if (cameraUnavailable) {
      return (
        <View style={styles.permissionBox}>
          <Feather name="camera-off" size={40} color={colors.textMuted} />
          <Text style={[typography.body, styles.permissionText, { color: colors.textSoft }]}>
            {fr.selfie.cameraUnavailable}
          </Text>
        </View>
      );
    }

    return (
      <>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => setCameraUnavailable(true)}
        />
        <View pointerEvents="none" style={[styles.guide, { borderColor: colors.accent }]} />
        <View style={[styles.facingBadge, { backgroundColor: colors.background }]}>
          <Text style={[styles.facingBadgeText, { color: colors.textMuted }]}>
            {facing === 'front' ? fr.selfie.frontLabel : fr.selfie.backLabel}
          </Text>
        </View>
      </>
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={fr.common.back}
          style={[styles.iconButton, { backgroundColor: colors.surfaceAlt }]}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>
          {forStory ? fr.selfie.titleForStory : fr.selfie.title}
        </Text>
      </View>

      <Text style={[typography.body, { color: colors.textMuted }]}>
        {forStory ? fr.selfie.introForStory : fr.selfie.intro}
      </Text>

      {photoUri ? (
        <>
          <View style={[styles.frame, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Image
              source={photoUri}
              style={[styles.previewImage, { borderColor: colors.accent }]}
              contentFit="cover"
              accessibilityLabel={fr.selfie.previewAlt}
            />
          </View>

          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.previewCardIcon, { borderColor: colors.accent, backgroundColor: colors.surfaceAlt }]}>
              <Feather name="user" size={26} color={colors.accent} />
            </View>
            <View style={styles.previewCardText}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>{fr.selfie.previewCardTitle}</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.selfie.previewCardBody}</Text>
            </View>
          </View>

          {saveError ? (
            <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.danger }]}>
              {saveError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button label={forStory ? fr.selfie.saveForStory : fr.selfie.save} onPress={onSave} loading={saving} />
            <Button
              label={fr.selfie.retake}
              variant="ghost"
              onPress={() => {
                setCameraReady(false);
                setPhotoUri(null);
              }}
              disabled={saving}
            />
          </View>
        </>
      ) : (
        <>
          <View style={[styles.frame, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            {renderFrameContent()}
          </View>

          {photoError ? (
            <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.danger }]}>
              {photoError}
            </Text>
          ) : null}

          <View style={styles.controlsRow}>
            <CircleIconButton
              icon="image"
              accessibilityLabel={fr.selfie.galleryButton}
              onPress={onPickGallery}
              disabled={busy}
            />
            {cameraActive ? (
              <>
                <Pressable
                  onPress={onCapture}
                  disabled={!cameraReady || busy}
                  accessibilityRole="button"
                  accessibilityLabel={fr.selfie.shutterButton}
                  style={({ pressed }) => [
                    styles.shutter,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.text,
                      opacity: !cameraReady || busy ? 0.5 : pressed ? 0.8 : 1,
                    },
                  ]}
                />
                <CircleIconButton
                  icon="refresh-cw"
                  accessibilityLabel={fr.selfie.flipButton}
                  onPress={toggleFacing}
                  disabled={busy}
                />
              </>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    height: FRAME_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  guide: {
    position: 'absolute',
    width: GUIDE_SIZE,
    height: GUIDE_SIZE,
    borderRadius: GUIDE_SIZE / 2,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  facingBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  facingBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  permissionBox: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  permissionText: { textAlign: 'center' },
  previewImage: {
    width: GUIDE_SIZE,
    height: GUIDE_SIZE,
    borderRadius: GUIDE_SIZE / 2,
    borderWidth: 3,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  previewCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardText: { flex: 1, gap: 2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
  },
  actions: { gap: spacing.sm },
});
