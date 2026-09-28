import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1280;
const QUALITY = 0.7;

// Redimensionne à 1280 px de large au plus et compresse en JPEG avant l'envoi
// (l'API refuse les fichiers de plus de 5 Mo).
export async function compressImage(uri: string, width: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}
