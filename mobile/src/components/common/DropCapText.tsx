import { useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  type TextLayoutEventData,
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
const CAP_WIDTH = 46;

/**
 * Paragraphe avec une lettrine sur deux lignes. React Native ne sait pas faire couler un texte
 * autour d'une lettre : on mesure d'abord le texte à la largeur restante à côté de la lettrine
 * (onTextLayout), puis on affiche ces deux premières lignes à côté d'elle et la suite en pleine
 * largeur. Une lettre imbriquée dans le Text serait coupée en haut et écarterait toutes les lignes.
 */
export function DropCapText({ text, textStyle, capColor, capFontFamily }: Props) {
  const [width, setWidth] = useState(0);
  const [splitAt, setSplitAt] = useState<number | null>(null);

  const cap = text.charAt(0);
  const rest = text.slice(1);
  const head = splitAt === null ? rest : rest.slice(0, splitAt);
  const tail = splitAt === null ? '' : rest.slice(splitAt).trimStart();

  const capHeight = textStyle.lineHeight * CAP_LINES;

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const onMeasure = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = event.nativeEvent.lines.slice(0, CAP_LINES);
    setSplitAt(lines.reduce((length, line) => length + line.text.length, 0));
  };

  return (
    // Lu d'un bloc par VoiceOver : sinon la lettrine serait annoncée seule, puis « haque pas… »
    <View onLayout={onLayout} accessible accessibilityLabel={text}>
      {width > 0 && splitAt === null ? (
        <Text
          style={[textStyle, styles.measure, { width: width - CAP_WIDTH }]}
          onTextLayout={onMeasure}
          aria-hidden
        >
          {rest}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text
          style={[
            styles.cap,
            {
              color: capColor,
              fontFamily: capFontFamily ?? textStyle.fontFamily,
              height: capHeight,
              fontSize: capHeight * 1.12,
              lineHeight: capHeight * 1.12,
            },
          ]}
        >
          {cap}
        </Text>
        <Text style={[textStyle, styles.head]}>{head}</Text>
      </View>
      {tail ? <Text style={textStyle}>{tail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: { position: 'absolute', opacity: 0 },
  row: { flexDirection: 'row' },
  cap: { width: CAP_WIDTH, marginTop: -4, includeFontPadding: false },
  head: { flex: 1 },
});
