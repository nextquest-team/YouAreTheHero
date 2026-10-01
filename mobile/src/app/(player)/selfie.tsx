import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { type LayoutChangeEvent, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiveText } from '@/components/common/LiveText';
import { FaceOvalMask, faceOval } from '@/components/hero/FaceOvalMask';
import { HeroPortrait } from '@/components/hero/HeroPortrait';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useHeroPhoto } from '@/hooks/useHeroPhoto';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { updateMe } from '@/services/auth';
import { apiUpload } from '@/services/client';
import { updateHeroFace } from '@/services/play';
import { fonts, radius, spacing, touchTarget } from '@/theme';

type Step = 'portrait' | 'camera';
type Source = 'camera' | 'gallery';

const PORTRAIT_SIZE = 248;

/**
 * Portrait du héros. La permission caméra n'est demandée qu'au moment où le joueur touche
 * « Prendre un selfie », jamais à l'ouverture ; la galerie reste proposée dans tous les cas.
 * Avec `storyId`, la photo ne vaut que pour cette histoire (PATCH /play/:storyId/hero).
 */
export default function SelfieScreen() {
  const { storyId } = useLocalSearchParams<{ storyId?: string }>();
  const forStory = Boolean(storyId);
  const { colors } = useTheme();
  const { user, setUser } = useAuth();
  const insets = useSafeAreaInsets();

  // Lecture seule de l'état de la permission : aucune demande système ici.
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('portrait');
  const [source, setSource] = useState<Source>('camera');
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [viewfinder, setViewfinder] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<CameraView>(null);

  const { pickFromGallery, captureFromCamera, busy, error: photoError } = useHeroPhoto();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;
  const error = saveError ?? photoError;

  const openCamera = async () => {
    if (permission?.granted) {
      setStep('camera');
      return;
    }
    const answer = await requestPermission();
    if (answer.granted) setStep('camera');
  };

  const chooseFromGallery = async () => {
    const uri = await pickFromGallery();
    if (!uri) return;
    setPhotoUri(uri);
    setSource('gallery');
    setStep('portrait');
  };

  const shoot = async () => {
    const uri = await captureFromCamera(cameraRef.current, viewfinder, faceOval(viewfinder.width, viewfinder.height));
    if (!uri) return;
    setPhotoUri(uri);
    setSource('camera');
    setStep('portrait');
  };

  const retake = () => {
    if (source === 'camera') setStep('camera');
    else chooseFromGallery();
  };

  const save = async () => {
    if (!photoUri) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { url } = await apiUpload<{ url: string }>('/uploads', photoUri);
      if (storyId) await updateHeroFace(storyId, url);
      else setUser(await updateMe({ avatarUrl: url }));
      router.back();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'camera') {
    const oval = faceOval(viewfinder.width, viewfinder.height);
    return (
      <View style={styles.viewfinder} onLayout={(event: LayoutChangeEvent) => setViewfinder(event.nativeEvent.layout)}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mirror={facing === 'front'}
          onMountError={() => {
            setCameraUnavailable(true);
            setStep('portrait');
          }}
        />
        {viewfinder.width > 0 ? (
          <>
            <FaceOvalMask width={viewfinder.width} height={viewfinder.height} color={colors.accent} />
            <Text style={[styles.placeFace, { top: oval.cy - oval.ry - 52 }]} accessibilityRole="header">
              {fr.selfie.placeFace}
            </Text>
            <Text style={[styles.lightHint, { top: oval.cy + oval.ry + 20 }]}>{fr.selfie.lightHint}</Text>
          </>
        ) : null}

        <Pressable
          onPress={() => setStep('portrait')}
          accessibilityRole="button"
          accessibilityLabel={fr.selfie.closeCamera}
          style={[styles.closeButton, { top: insets.top + 12 }]}
        >
          <Feather name="x" size={22} color={CAMERA_TEXT} />
        </Pressable>

        <View style={[styles.controls, { bottom: insets.bottom + 28 }]}>
          <CameraControl icon="image" label={fr.selfie.galleryShort} onPress={chooseFromGallery} disabled={busy} />
          <Pressable
            onPress={shoot}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={fr.selfie.shutter}
            style={({ pressed }) => [styles.shutter, { borderColor: colors.accent, opacity: pressed || busy ? 0.7 : 1 }]}
          >
            <View style={[styles.shutterInner, { backgroundColor: colors.accent }]} />
          </Pressable>
          <CameraControl
            icon="refresh-cw"
            label={fr.selfie.flip}
            onPress={() => setFacing((current) => (current === 'front' ? 'back' : 'front'))}
            disabled={busy}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={fr.selfie.back}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {forStory ? fr.selfie.titleForStory : fr.selfie.title}
          </Text>
        </View>

        <View style={styles.portrait}>
          <HeroPortrait
            size={PORTRAIT_SIZE}
            photoUri={photoUri}
            blocked={!photoUri && blocked}
            accessibilityLabel={photoUri ? fr.selfie.portraitPhoto : fr.selfie.portraitEmpty}
          />
          {user ? <Text style={[styles.heroName, { color: colors.textMuted }]}>{user.displayName}</Text> : null}
        </View>

        {photoUri ? (
          <View style={styles.previewRow}>
            <Image source={{ uri: photoUri }} style={[styles.previewFace, { borderColor: colors.accent }]} contentFit="cover" />
            <Text style={[styles.previewCaption, { color: colors.textMuted }]}>{fr.selfie.previewCaption}</Text>
          </View>
        ) : (
          <View style={styles.message}>
            <Text style={[styles.heading, { color: colors.text }]}>
              {blocked ? fr.selfie.blockedTitle : cameraUnavailable ? fr.selfie.unavailableTitle : fr.selfie.heading}
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              {blocked
                ? fr.selfie.blockedBody
                : cameraUnavailable
                  ? fr.selfie.unavailableBody
                  : forStory
                    ? fr.selfie.bodyForStory
                    : fr.selfie.body}
            </Text>
          </View>
        )}

        {error ? (
          <LiveText style={[styles.error, { color: colors.danger }]}>
            {error}
          </LiveText>
        ) : null}

        <View style={styles.actions}>
          {photoUri ? (
            <>
              <Button label={fr.selfie.keep} onPress={save} loading={saving} disabled={busy} />
              <Button
                label={source === 'camera' ? fr.selfie.retakeCamera : fr.selfie.retakeGallery}
                variant="ghost"
                onPress={retake}
                disabled={saving || busy}
              />
            </>
          ) : (
            <>
              {blocked ? (
                <Button label={fr.selfie.openSettings} onPress={() => Linking.openSettings()} />
              ) : cameraUnavailable ? null : (
                <Button label={fr.selfie.takeSelfie} icon="camera" onPress={openCamera} disabled={busy} />
              )}
              <Button
                label={fr.selfie.gallery}
                icon="image"
                variant={blocked || cameraUnavailable ? 'primary' : 'secondary'}
                onPress={chooseFromGallery}
                loading={busy}
              />
              {!blocked && !cameraUnavailable && !permission?.granted ? (
                <Text style={[styles.note, { color: colors.textMuted }]}>{fr.selfie.permissionNote}</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ControlProps = {
  icon: 'image' | 'refresh-cw';
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Bouton rond du viseur, avec son libellé dessous (jamais une icône seule). */
function CameraControl({ icon, label, onPress, disabled }: ControlProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.control, { opacity: pressed || disabled ? 0.6 : 1 }]}
    >
      <View style={styles.controlCircle}>
        <Feather name={icon} size={22} color={CAMERA_TEXT} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

// Le viseur reste sombre quel que soit le thème : c'est une vue caméra.
const CAMERA_TEXT = '#F2EDE3';
const CAMERA_SURFACE = 'rgba(33, 30, 41, 0.9)';

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: touchTarget, height: touchTarget, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  portrait: { alignItems: 'center', marginTop: spacing.xl, gap: 14 },
  heroName: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  message: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  heading: { fontFamily: fonts.display, fontSize: 30, lineHeight: 33, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  previewFace: { width: 44, height: 44, borderRadius: 22, borderWidth: 2 },
  previewCaption: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 14, textAlign: 'center', marginTop: spacing.md },
  actions: { marginTop: 'auto', paddingTop: spacing.xl, gap: 10 },
  note: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4 },
  viewfinder: { flex: 1, backgroundColor: '#000' },
  placeFace: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 19,
    color: CAMERA_TEXT,
  },
  lightHint: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#D8D0C4',
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    backgroundColor: CAMERA_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  control: { minWidth: 76, alignItems: 'center', gap: 6 },
  controlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CAMERA_SURFACE,
    borderWidth: 1,
    borderColor: '#3A3546',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: CAMERA_TEXT },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, padding: 5 },
  shutterInner: { flex: 1, borderRadius: 40 },
});
