import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { fr } from '@/i18n/fr';
import { compressImage } from '@/services/images';

export type ImageSource = 'camera' | 'library';

const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };

// Prend une photo avec l'appareil ou choisit une image dans la galerie,
// puis renvoie l'URI locale de l'image compressée (null si l'utilisateur annule).
export function useImagePicker() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: ImageSource): Promise<string | null> => {
    setError(null);

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(fr.imagePicker.cameraDenied);
        return null;
      }
    }

    setBusy(true);
    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return null;

      const asset = result.assets[0];
      return await compressImage(asset.uri, asset.width);
    } catch {
      setError(fr.imagePicker.failed);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { pick, busy, error };
}
