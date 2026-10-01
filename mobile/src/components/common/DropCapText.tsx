import { useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  type TextLayoutEventData,
  type TextLayoutLine,
  type TextStyle,
  View,
} from 'react-native';

type Props = {
  text: string;
  textStyle: TextStyle & { lineHeight: number };
  capColor: string;
  capFontFamily?: string; // par défaut, celle du texte
};

// La lettrine occupe la hauteur de deux lignes de texte.
const CAP_LINES = 2;
const CAP_GAP = 8;
// Taille de référence à laquelle on mesure la lettre, avant de la mettre à l'échelle.
const PROBE_SIZE = 100;
const CAP_RATIO = 0.68;

type Metrics = { ascender: number; descender: number; capHeight: number; width: number };

const toMetrics = (line: TextLayoutLine): Metrics => ({
  ascender: line.ascender,
  descender: Math.abs(line.descender),
  capHeight: line.capHeight,
  width: line.width,
});

/**
 * Paragraphe avec une lettrine sur deux lignes. React Native ne sait pas faire couler un texte
 * autour d'une lettre : on mesure d'abord la lettre et le texte (onTextLayout), puis on affiche
 * les deux premières lignes à côté de la lettrine et la suite en pleine largeur.
 *
 * La lettre n'est jamais enfermée dans une boîte à sa taille : elle garde sa hauteur de ligne
 * naturelle (sinon iOS rogne le haut des capitales) et sa largeur réelle (un M est plus large
 * qu'un I). Sa taille est calculée pour que le haut de la capitale s'aligne sur celui de la
 * première ligne, et sa ligne de base sur celle de la deuxième.
 */
export function DropCapText({ text, textStyle, capColor, capFontFamily }: Props) {
  const [width, setWidth] = useState(0);
  const [capProbe, setCapProbe] = useState<Metrics | null>(null);
  const [bodyProbe, setBodyProbe] = useState<Metrics | null>(null);
  const [split, setSplit] = useState<{ at: number; width: number } | null>(null);

  const cap = text.charAt(0);
  const rest = text.slice(1);
  const lineHeight = textStyle.lineHeight;
  const capFamily = capFontFamily ?? textStyle.fontFamily;

  // Géométrie de la lettrine, une fois la lettre et le texte mesurés.
  let geometry: { fontSize: number; width: number; top: number } | null = null;
  if (capProbe && bodyProbe) {
    // Si la plateforme ne donne pas la hauteur de capitale, on prend la proportion usuelle.
    const capCapHeight = capProbe.capHeight || PROBE_SIZE * CAP_RATIO;
    const bodyCapHeight = bodyProbe.capHeight || (textStyle.fontSize ?? lineHeight / 1.4) * CAP_RATIO;
    // Avec une hauteur de ligne imposée, le texte est centré verticalement dans sa ligne.
    const bodyGlyph = bodyProbe.ascender + bodyProbe.descender;
    const firstBaseline = (lineHeight - bodyGlyph) / 2 + bodyProbe.ascender;
    const lastBaseline = firstBaseline + lineHeight * (CAP_LINES - 1);
    const capTop = firstBaseline - bodyCapHeight;
    const scale = (lastBaseline - capTop) / capCapHeight;
    geometry = {
      fontSize: PROBE_SIZE * scale,
      width: Math.ceil(capProbe.width * scale) + CAP_GAP,
      top: lastBaseline - capProbe.ascender * scale,
    };
  }

  const headWidth = geometry ? width - geometry.width : 0;
  // Une mesure faite pour une autre largeur (première mise en page, rotation) est ignorée.
  const splitAt = split && split.width === headWidth ? split.at : null;
  const ready = geometry !== null && splitAt !== null;
  const head = splitAt === null ? rest : rest.slice(0, splitAt);
  const tail = splitAt === null ? '' : rest.slice(splitAt).trimStart();

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const firstLine = (setter: (metrics: Metrics) => void) => (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const line = event.nativeEvent.lines[0];
    if (line) setter(toMetrics(line));
  };
  const onMeasure = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = event.nativeEvent.lines.slice(0, CAP_LINES);
    setSplit({ at: lines.reduce((length, line) => length + line.text.length, 0), width: headWidth });
  };

  return (
    // Lu d'un bloc par VoiceOver : sinon la lettrine serait annoncée seule, puis « haque pas… »
    <View onLayout={onLayout} accessible accessibilityLabel={text}>
      {!capProbe ? (
        <Text
          style={[styles.probe, styles.capText, { fontFamily: capFamily, fontSize: PROBE_SIZE }]}
          onTextLayout={firstLine(setCapProbe)}
          aria-hidden
        >
          {cap}
        </Text>
      ) : null}
      {!bodyProbe ? (
        <Text style={[textStyle, styles.probe]} onTextLayout={firstLine(setBodyProbe)} aria-hidden>
          H
        </Text>
      ) : null}
      {geometry && headWidth > 0 && splitAt === null ? (
        <Text style={[textStyle, styles.probe, { width: headWidth }]} onTextLayout={onMeasure} aria-hidden>
          {rest}
        </Text>
      ) : null}

      {/* Masqué le temps des mesures (quelques images), pour ne pas voir le texte sauter. */}
      <View style={!ready && styles.hidden}>
        <View style={styles.row}>
          <View style={{ width: geometry?.width ?? 0, height: lineHeight * CAP_LINES }}>
            {geometry ? (
              <Text
                style={[
                  styles.capText,
                  styles.capPlaced,
                  { top: geometry.top, color: capColor, fontFamily: capFamily, fontSize: geometry.fontSize },
                ]}
              >
                {cap}
              </Text>
            ) : null}
          </View>
          <Text style={[textStyle, styles.head]}>{head}</Text>
        </View>
        {tail ? <Text style={textStyle}>{tail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  probe: { position: 'absolute', opacity: 0 },
  hidden: { opacity: 0 },
  row: { flexDirection: 'row' },
  capText: { includeFontPadding: false },
  capPlaced: { position: 'absolute', left: 0 },
  head: { flex: 1 },
});
