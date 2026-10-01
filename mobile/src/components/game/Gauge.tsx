import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/theme';

type Props = {
  label: string;
  value: number;
  max: number | null;
  color: string;
  textColor?: string; // sur fond d'encre, le texte passe en papier
  emptyColor?: string;
  // Case vide : contour (combat) ou teinte pâlie (feuille d'aventure du pied de scène)
  empty?: 'outline' | 'faded';
  segments?: number;
};

/**
 * Jauge en cases (PV), toujours doublée des chiffres écrits, et lue par VoiceOver comme
 * une valeur « 12 sur 20 ». Une case vide se distingue d'une pleine par sa clarté ou son
 * contour, pas par la teinte.
 */
export function Gauge({ label, value, max, color, textColor, emptyColor, empty = 'outline', segments = 10 }: Props) {
  const { colors } = useTheme();
  const ratio = max && max > 0 ? Math.max(0, Math.min(1, value / max)) : 1;
  // Une case reste pleine tant qu'il reste un point de vie
  const filled = value > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;
  const text = max ? `${value} / ${max}` : String(value);
  const ink = textColor ?? colors.text;
  const emptyInk = emptyColor ?? colors.border;

  return (
    <View
      style={styles.gauge}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: max ?? value, now: value, text }}
    >
      <View style={styles.labels}>
        <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.label, { color: ink }]}>{text}</Text>
      </View>
      <View style={styles.track}>
        {Array.from({ length: segments }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < filled
                ? { backgroundColor: color }
                : empty === 'outline'
                  ? { borderWidth: 1, borderColor: emptyInk }
                  : { backgroundColor: emptyInk, opacity: 0.2 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Grandit en ligne (pied de scène) sans s'écraser en colonne (combat), où flex: 1 la ramenait à 0
  gauge: { flexGrow: 1, flexShrink: 1, gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  track: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 9 },
});
