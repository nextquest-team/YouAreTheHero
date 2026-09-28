import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const SIZE = 512;
const QUALITY = 0.85;

/**
 * Recadre l'image en carré centré (le cercle du héros n'affiche jamais de bords),
 * puis la redimensionne à 512 px et la compresse en JPEG avant l'envoi à /uploads.
 */
export async function cropToHeroPhoto(uri: string, width: number, height: number): Promise<string> {
  const side = Math.min(width, height);
  const originX = Math.round((width - side) / 2);
  const originY = Math.round((height - side) / 2);

  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX, originY, width: side, height: side });
  context.resize({ width: SIZE, height: SIZE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}
