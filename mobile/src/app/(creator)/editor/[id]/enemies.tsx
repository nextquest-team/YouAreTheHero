import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { confirmRemove } from '@/components/editor/confirm';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { EnemyForm } from '@/components/editor/EnemyForm';
import { Button, Card, Screen } from '@/components/ui';
import { useEnemyEditor } from '@/hooks/useEntityEditor';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import type { Enemy, EnemyInput } from '@/types/api';
import { fonts, radius, spacing, typography } from '@/theme';

// null : aucun formulaire ouvert ; 'new' : création ; sinon l'id de l'ennemi modifié.
type Editing = null | 'new' | string;

const THUMB = 56;

const summary = (enemy: Enemy) =>
  `${fr.enemies.attack} ${enemy.attack} · ${fr.enemies.hp} ${enemy.hp}` +
  (enemy.shield > 0 ? ` · ${fr.enemies.shield} ${enemy.shield}` : '');

// Ennemis de l'histoire : chaque scène de combat en affronte un.
export default function EnemiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const enemies = useEnemyEditor(id, editor.reload);
  const [editing, setEditing] = useState<Editing>(null);

  const data = editor.data;
  const locked = data?.published ?? false;
  const statTargets = data?.stats.filter((stat) => stat.type === 'number') ?? [];
  const itemTargets = data?.items ?? [];

  const open = (next: Editing) => {
    enemies.reset();
    setEditing(next);
  };

  const submit = async (enemyId: string | null, input: EnemyInput) => {
    if (await enemies.save(enemyId, input)) setEditing(null);
  };

  const renderForm = (enemy: Enemy | null) => (
    <EnemyForm
      key={enemy?.id ?? 'new'}
      enemy={enemy}
      stats={statTargets}
      items={itemTargets}
      busy={enemies.busy}
      fieldError={enemies.fieldError}
      error={enemies.error}
      onSubmit={(input) => submit(enemy?.id ?? null, input)}
      onCancel={() => setEditing(null)}
      onDelete={
        enemy
          ? () => confirmRemove(fr.enemies, enemy.name, () => enemies.remove(enemy.id), () => setEditing(null))
          : undefined
      }
    />
  );

  return (
    <Screen scroll>
      <EditorHeader overline={data?.title ?? ''} title={data ? fr.enemies.title : undefined} />

      {!data ? (
        <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
      ) : (
        <>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {locked ? fr.storyEditor.lockedNotice : fr.enemies.intro}
          </Text>
          {!data.hasCombat ? (
            <Text style={[typography.caption, { color: colors.danger }]}>{fr.enemies.combatOff}</Text>
          ) : null}

          {data.enemies.length === 0 && editing !== 'new' ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>{fr.enemies.empty}</Text>
          ) : null}

          <View style={styles.list}>
            {data.enemies.map((enemy) =>
              editing === enemy.id ? (
                renderForm(enemy)
              ) : (
                <Card
                  key={enemy.id}
                  onPress={locked ? undefined : () => open(enemy.id)}
                  accessibilityLabel={`${enemy.name}, ${summary(enemy)}`}
                  style={styles.row}
                >
                  {enemy.imageUrl ? (
                    <Image source={{ uri: assetUrl(enemy.imageUrl) ?? undefined }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]} />
                  )}
                  <View style={styles.rowText}>
                    <Text style={[styles.enemyName, { color: colors.text }]}>{enemy.name}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{summary(enemy)}</Text>
                  </View>
                </Card>
              ),
            )}
          </View>

          {locked ? null : editing === 'new' ? (
            renderForm(null)
          ) : (
            <Button label={fr.enemies.newEnemy} variant="dashed" icon="plus" onPress={() => open('new')} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.md },
  rowText: { flex: 1, gap: 2 },
  enemyName: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
