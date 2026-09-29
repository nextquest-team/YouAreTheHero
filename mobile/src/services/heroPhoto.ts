import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Le visage se loge dans un ovale vertical (4:5) : sous la capuche du portrait et, recadré
// en rond, dans la barre du héros.
const RATIO = 4 / 5;
const OUTPUT_WIDTH = 480;
const QUALITY = 0.85;

type Size = { width: number; height: number };

/**
 * Recadre la photo en 4:5 autour de son centre, puis la réduit et la compresse en JPEG
 * avant l'envoi à /uploads. Sans `region`, prend le plus grand cadre 4:5 possible (photo de
 * la galerie) ; avec `region`, la zone de l'ovale de cadrage, en pixels de la photo.
 */
export async function cropToHeroPhoto(uri: string, photo: Size, region?: Size): Promise<string> {
  const maxWidth = Math.min(photo.width, photo.height * RATIO);
  const width = Math.round(Math.min(region?.width ?? maxWidth, maxWidth));
  const height = Math.round(width / RATIO);
  const originX = Math.round((photo.width - width) / 2);
  const originY = Math.round((photo.height - height) / 2);

  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX, originY, width, height });
  context.resize({ width: OUTPUT_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}

/**
 * Zone de la photo qui correspond à l'ovale du viseur. L'aperçu de la caméra remplit l'écran
 * (« cover ») et l'ovale est centré : on convertit sa taille en pixels de la photo, avec une
 * petite marge pour ne couper ni le menton ni les cheveux.
 */
export function ovalRegion(photo: Size, preview: Size, oval: { rx: number; ry: number }): Size {
  const scale = Math.max(preview.width / photo.width, preview.height / photo.height);
  const margin = 1.15;
  return { width: ((oval.rx * 2) / scale) * margin, height: ((oval.ry * 2) / scale) * margin };
}
