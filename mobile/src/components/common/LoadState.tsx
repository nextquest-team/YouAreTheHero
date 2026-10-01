import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { typography } from '@/theme';

type Props = {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

/** Chargement ou erreur d'une ressource ; ne rend rien quand les données sont là. */
export function LoadState({ loading, error, onRetry }: Props) {
  const { colors } = useTheme();

  if (error) {
    return (
      <View style={styles.box}>
        <LiveText style={[typography.body, styles.text, { color: colors.textMuted }]}>
          {errorMessage(error)}
        </LiveText>
        <Button label={fr.library.retry} variant="secondary" icon="refresh-cw" onPress={onRetry} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.accent} accessibilityLabel={fr.common.loading} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 16, paddingVertical: 32 },
  text: { textAlign: 'center' },
});
