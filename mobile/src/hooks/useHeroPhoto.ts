import type { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { fr } from '@/i18n/fr';
import { cropToHeroPhoto } from '@/services/heroPhoto';

type RawPhoto = { uri: string; width: number; height: number };

/**
 * Recadrage carré + redimensionnement communs à la capture caméra et à la galerie.
 * La galerie n'exige aucune permission sur iOS récent (sélecteur système) : on ne
 * demande donc rien avant de l'ouvrir, contrairement à la caméra (gérée dans l'écran).
 */
export function useHeroPhoto() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<RawPhoto | null>, failMessage: string): Promise<string | null> => {
    setError(null);
    setBusy(true);
    try {
      const raw = await task();
      if (!raw) return null;
      return await cropToHeroPhoto(raw.uri, raw.width, raw.height);
    } catch {
      setError(failMessage);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = () =>
    run(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled) return null;
      const asset = result.assets[0];
      return { uri: asset.uri, width: asset.width, height: asset.height };
    }, fr.selfie.pickFailed);

  const captureFromCamera = (camera: CameraView | null) =>
    run(async () => {
      if (!camera) return null;
      const photo = await camera.takePictureAsync({ quality: 0.9 });
      if (!photo) return null;
      return { uri: photo.uri, width: photo.width, height: photo.height };
    }, fr.selfie.captureFailed);

  return { pickFromGallery, captureFromCamera, busy, error };
}
