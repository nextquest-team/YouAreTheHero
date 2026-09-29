import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import type { PublishReport } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { PublishIssue } from '@/types/api';
import { spacing, typography } from '@/theme';

type Props = {
  report: PublishReport;
  // Pour afficher « Scène : Le pont » à côté d'un problème qui vise une scène.
  sceneTitles: Map<string, string>;
};

/** Résultat de la vérification avant publication : erreurs bloquantes, puis avertissements. */
export function PublishIssues({ report, sceneTitles }: Props) {
  const { colors } = useTheme();

  const renderList = (title: string, issues: PublishIssue[], color: string, icon: 'x-circle' | 'alert-triangle') => (
    <View style={styles.group} accessibilityLiveRegion="polite">
      <Text style={[typography.label, { color }]}>{title}</Text>
      {issues.map((issue, index) => {
        const scene = issue.sceneId ? sceneTitles.get(issue.sceneId) : undefined;
        return (
          <View key={`${issue.code}-${issue.sceneId ?? ''}-${index}`} style={styles.issue}>
            <Feather name={icon} size={16} color={color} style={styles.icon} />
            <Text style={[typography.caption, styles.issueText, { color: colors.text }]}>
              {issue.message}
              {scene ? <Text style={{ color: colors.textMuted }}>{`\n${fr.storyEditor.sceneLabel} : ${scene}`}</Text> : null}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.box}>
      {report.errors.length > 0 ? renderList(fr.storyEditor.errorsTitle, report.errors, colors.danger, 'x-circle') : null}
      {report.warnings.length > 0
        ? renderList(fr.storyEditor.warningsTitle, report.warnings, colors.accent, 'alert-triangle')
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md },
  group: { gap: spacing.sm },
  issue: { flexDirection: 'row', gap: spacing.sm },
  icon: { marginTop: 1 },
  issueText: { flex: 1 },
});
