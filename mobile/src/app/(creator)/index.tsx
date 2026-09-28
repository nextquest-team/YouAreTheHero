import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { typography } from '@/theme';

// Liste des histoires : branchée sur useMyStories quand le back de B sera prêt
export default function MyStories() {
  const { colors } = useTheme();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.textMuted }]}>
          {fr.creatorStories.overline}
        </Text>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {fr.creatorStories.title}
        </Text>
      </View>

      <Button label={fr.creatorStories.newStory} variant="dashed" icon="plus" />

      <Text style={[typography.body, { color: colors.textMuted }]}>{fr.creatorStories.empty}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
});
