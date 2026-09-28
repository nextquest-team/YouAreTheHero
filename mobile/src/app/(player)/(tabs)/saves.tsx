import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { StoryCover } from '@/components/library/StoryCover';
import { Button, Screen } from '@/components/ui';
import { useSaves } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing, typography } from '@/theme';
import type { GameStatus } from '@/types/api';

export default function Saves() {
  const { colors } = useTheme();
  const saves = useSaves();
  const reload = saves.reload;

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const statusColor: Record<GameStatus, string> = {
    IN_PROGRESS: colors.accent,
    FINISHED: colors.success,
    DEAD: colors.danger,
  };

  return (
    <Screen scroll>
      <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
        {fr.saves.title}
      </Text>

      <LoadState loading={saves.loading && !saves.data} error={saves.error} onRetry={saves.reload} />

      {saves.data && saves.data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.body, styles.emptyText, { color: colors.textMuted }]}>{fr.saves.empty}</Text>
          <Button label={fr.saves.browse} variant="secondary" icon="book-open" onPress={() => router.navigate('/')} />
        </View>
      ) : null}

      <View style={styles.list}>
        {saves.data?.map((save) => {
          const status = fr.saves.status[save.status];
          const date = new Date(save.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
          return (
            <Pressable
              key={save.story.id}
              onPress={() => router.push({ pathname: '/story/[id]', params: { id: save.story.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${save.story.title}, ${status}, ${fr.saves.updated} ${date}`}
              style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
            >
              <StoryCover uri={save.story.coverUrl} width={56} height={68} />
              <View style={styles.body}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {save.story.title}
                </Text>
                <Text style={[styles.status, { color: statusColor[save.status] }]}>{status}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {fr.saves.updated} {date}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 16, paddingVertical: 32 },
  emptyText: { textAlign: 'center' },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, borderRadius: radius.xl },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  status: { fontFamily: fonts.bodyBold, fontSize: 13 },
});
