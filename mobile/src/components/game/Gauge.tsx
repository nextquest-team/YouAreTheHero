import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/theme';

type Props = { label: string; value: number; max: number | null; color: string };

/** Jauge étiquetée (PV, bouclier), lue par VoiceOver comme une valeur « 12 sur 20 ». */
export function Gauge({ label, value, max, color }: Props) {
  const { colors } = useTheme();
  const ratio = max && max > 0 ? Math.max(0, Math.min(1, value / max)) : 1;
  const text = max ? `${value} / ${max}` : String(value);

  return (
    <View
      style={styles.gauge}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: max ?? value, now: value, text }}
    >
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.label, { color: colors.text }]}>{text}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: { flex: 1, gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: fonts.bodyBold, fontSize: 12 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
});
