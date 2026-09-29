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
};

const SEGMENTS = 10;

/**
 * Jauge en cases (PV, bouclier), toujours doublée des chiffres écrits, et lue par
 * VoiceOver comme une valeur « 12 sur 20 ».
 */
export function Gauge({ label, value, max, color, textColor, emptyColor }: Props) {
  const { colors } = useTheme();
  const ratio = max && max > 0 ? Math.max(0, Math.min(1, value / max)) : 1;
  // Une case reste pleine tant qu'il reste un point de vie
  const filled = value > 0 ? Math.max(1, Math.round(ratio * SEGMENTS)) : 0;
  const text = max ? `${value} / ${max}` : String(value);
  const ink = textColor ?? colors.text;

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
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < filled
                ? { backgroundColor: color, borderColor: color }
                : { borderColor: emptyColor ?? colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: { flex: 1, gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  track: { flexDirection: 'row', gap: 3 },
  // Case vide = simple contour : l'écart plein / vide ne tient pas qu'à la couleur
  segment: { flex: 1, height: 9, borderWidth: 1 },
});
