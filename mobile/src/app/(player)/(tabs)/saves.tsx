import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { StoryCover } from '@/components/library/StoryCover';
import { Button, Screen } from '@/components/ui';
import { useSaves } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, spacing, typography } from '@/theme';
import type { GameStatus } from '@/types/api';

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  );
}

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

  const total = saves.data?.length ?? 0;
  const inProgressCount = saves.data?.filter((save) => save.status === 'IN_PROGRESS').length ?? 0;
  const subtitle =
    total > 0
      ? `${total} ${total > 1 ? fr.saves.adventurePlural : fr.saves.adventureSingular}` +
        (inProgressCount > 0 ? `, ${fr.saves.inProgressPrefix} ${inProgressCount} ${fr.saves.inProgressSuffix}.` : '.')
      : null;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {fr.saves.title}
        </Text>
        {subtitle ? <Text style={[typography.body, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>

      <LoadState loading={saves.loading && !saves.data} error={saves.error} onRetry={saves.reload} />

      {saves.data && saves.data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.body, styles.emptyText, { color: colors.textMuted }]}>{fr.saves.empty}</Text>
          <Button label={fr.saves.browse} variant="secondary" icon="book-open" onPress={() => router.navigate('/')} />
        </View>
      ) : null}

      {saves.data && saves.data.length > 0 ? (
        <View style={styles.listWrap}>
          <View style={styles.list}>
            {saves.data.map((save) => {
              const status = fr.saves.status[save.status];
              const when = isToday(save.updatedAt)
                ? fr.saves.playedToday
                : `${fr.saves.playedOn} ${new Date(save.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
              return (
                <Pressable
                  key={save.story.id}
                  onPress={() => router.push({ pathname: '/story/[id]', params: { id: save.story.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${save.story.title}, ${status}, ${when}`}
                  style={({ pressed }) => [styles.row, { borderTopColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  {/* Marque-page : l'encoche en V est un carré tourné, de la couleur du fond. */}
                  <View style={[styles.ribbon, { backgroundColor: statusColor[save.status] }]}>
                    <View style={[styles.ribbonNotch, { backgroundColor: colors.background }]} />
                  </View>
                  <StoryCover uri={save.story.coverUrl} title={save.story.title} width={56} height={68} />
                  <View style={styles.body}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                      {save.story.title}
                    </Text>
                    <Text style={[styles.status, { color: statusColor[save.status] }]}>{status}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{when}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.footerNote, { color: colors.textMuted, borderTopColor: colors.border }]}>
            {fr.saves.oneGamePerStory}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  empty: { alignItems: 'center', gap: 16, paddingVertical: 32 },
  emptyText: { textAlign: 'center' },
  listWrap: { gap: 0 },
  list: { flexDirection: 'column' },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 96,
    paddingVertical: spacing.md,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    borderTopWidth: 1,
  },
  ribbon: { position: 'absolute', left: 4, top: -1, width: 12, height: 48, overflow: 'hidden' },
  ribbonNotch: { position: 'absolute', left: 1, bottom: -5, width: 10, height: 10, transform: [{ rotate: '45deg' }] },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 23, lineHeight: 26 },
  status: { fontFamily: fonts.bodyBold, fontSize: 14 },
  footerNote: { fontSize: 13, lineHeight: 19, paddingTop: spacing.lg, borderTopWidth: 1 },
});
