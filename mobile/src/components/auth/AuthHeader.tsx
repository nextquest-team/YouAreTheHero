import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts } from '@/theme';

type Props = { compact?: boolean };

export function AuthHeader({ compact = false }: Props) {
  const { colors } = useTheme();

  if (compact) {
    // Maquette d'inscription : petit fil d'Ariane (icône + nom), pas de tagline.
    return (
      <View style={styles.row}>
        <Feather name="book-open" size={26} color={colors.accent} />
        <Text style={[styles.wordmark, { color: colors.text }]}>{fr.auth.appName}</Text>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <Feather name="book-open" size={64} color={colors.accent} />
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {fr.auth.appName}
      </Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>{fr.auth.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 12, paddingTop: 48 },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, textAlign: 'center' },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  wordmark: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
});
