import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { LoadState } from '@/components/common/LoadState';
import { confirmRemove } from '@/components/editor/confirm';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { OptionChips } from '@/components/editor/OptionChips';
import { StatForm } from '@/components/editor/StatForm';
import { Button, Card, Screen } from '@/components/ui';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useStatEditor } from '@/hooks/useStatEditor';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { StatDefinition, StatInput } from '@/types/api';
import { fonts, radius, spacing, typography } from '@/theme';

// null : aucun formulaire ouvert ; 'new' : création ; sinon l'id de la stat modifiée.
type Editing = null | 'new' | string;

function statSummary(stat: StatDefinition): string {
  if (stat.type === 'text') {
    return stat.defaultValue ? `${fr.stats.typeText} · « ${stat.defaultValue} »` : fr.stats.typeText;
  }
  const bounds =
    stat.min !== null && stat.max !== null
      ? ` · ${fr.stats.from} ${stat.min} ${fr.stats.to} ${stat.max}`
      : stat.min !== null
        ? ` · ${fr.stats.min} ${stat.min}`
        : stat.max !== null
          ? ` · ${fr.stats.max} ${stat.max}`
          : '';
  return `${fr.stats.start} ${stat.defaultValue}${bounds}`;
}

// Caractéristiques du héros, et choix de la stat d'attaque et de la stat de PV pour les combats.
export default function StatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const stats = useStatEditor(id, editor.reload);
  const [editing, setEditing] = useState<Editing>(null);

  const data = editor.data;
  const locked = data?.published ?? false;

  const open = (next: Editing) => {
    stats.reset();
    setEditing(next);
  };

  const submit = async (statId: string | null, input: StatInput) => {
    if (await stats.save(statId, input)) setEditing(null);
  };

  const confirmDelete = (stat: StatDefinition) =>
    confirmRemove(fr.stats, stat.name, () => stats.remove(stat.id), () => setEditing(null));

  const numberStats = data?.stats.filter((stat) => stat.type === 'number') ?? [];
  const numberOptions = numberStats.map((stat) => ({ value: stat.id, label: stat.name }));

  const renderForm = (stat: StatDefinition | null) => (
    <StatForm
      key={stat?.id ?? 'new'}
      stat={stat}
      busy={stats.busy}
      fieldError={stats.fieldError}
      error={stats.error}
      onSubmit={(input) => submit(stat?.id ?? null, input)}
      onCancel={() => setEditing(null)}
      onDelete={stat ? () => confirmDelete(stat) : undefined}
    />
  );

  return (
    <Screen scroll>
      <EditorHeader overline={data?.title ?? ''} title={data ? fr.stats.title : undefined} />

      {!data ? (
        <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
      ) : (
        <>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {locked ? fr.storyEditor.lockedNotice : fr.stats.intro}
          </Text>

          {data.stats.length === 0 && editing !== 'new' ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>{fr.stats.empty}</Text>
          ) : null}

          <View style={styles.list}>
            {data.stats.map((stat) =>
              editing === stat.id ? (
                renderForm(stat)
              ) : (
                <Card
                  key={stat.id}
                  onPress={locked ? undefined : () => open(stat.id)}
                  accessibilityLabel={`${stat.name}, ${statSummary(stat)}`}
                  style={styles.row}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.statName, { color: colors.text }]}>{stat.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{statSummary(stat)}</Text>
                  </View>
                  {data.hasCombat && stat.id === data.hpStatId ? (
                    <Text style={[styles.role, { color: colors.danger, backgroundColor: colors.dangerSoft }]}>{fr.stats.hpBadge}</Text>
                  ) : null}
                  {data.hasCombat && stat.id === data.attackStatId ? (
                    <Text style={[styles.role, { color: colors.accent, backgroundColor: colors.accentSoft }]}>
                      {fr.stats.attackBadge}
                    </Text>
                  ) : null}
                </Card>
              ),
            )}
          </View>

          {locked ? null : editing === 'new' ? (
            renderForm(null)
          ) : (
            <Button label={fr.stats.newStat} variant="dashed" icon="plus" onPress={() => open('new')} />
          )}

          {data.hasCombat ? (
            <Card>
              <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
                {fr.stats.combatTitle}
              </Text>
              {numberOptions.length === 0 ? (
                <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.stats.combatNeedsNumber}</Text>
              ) : (
                <>
                  <OptionChips
                    label={fr.stats.attackStat}
                    options={numberOptions}
                    value={data.attackStatId}
                    onChange={(statId) => editor.save({ attackStatId: statId })}
                    disabled={locked || editor.busy}
                  />
                  <OptionChips
                    label={fr.stats.hpStat}
                    options={numberOptions}
                    value={data.hpStatId}
                    onChange={(statId) => editor.save({ hpStatId: statId })}
                    disabled={locked || editor.busy}
                  />
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.stats.hpHint}</Text>
                </>
              )}
              {editor.actionError ? (
                <LiveText style={[typography.caption, { color: colors.danger }]}>
                  {editor.actionError}
                </LiveText>
              ) : null}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  rowText: { flex: 1, gap: 2 },
  statName: { fontFamily: fonts.bodyBold, fontSize: 16 },
  role: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
