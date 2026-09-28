import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts } from '@/theme';

type Props = { compact?: boolean };

export function AuthHeader({ compact = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, compact && styles.compact]}>
      <Feather name="book-open" size={compact ? 44 : 64} color={colors.accent} />
      <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, { color: colors.text }]}>
        {fr.auth.appName}
      </Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>{fr.auth.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 12, paddingTop: 48 },
  compact: { paddingTop: 16, gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, textAlign: 'center' },
  titleCompact: { fontSize: 32, lineHeight: 36 },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
