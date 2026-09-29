import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { ChoiceForm } from '@/components/editor/ChoiceForm';
import { describeCondition } from '@/components/editor/ConditionEditor';
import { confirmRemove } from '@/components/editor/confirm';
import { describeEffects } from '@/components/editor/EffectsEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { SceneForm } from '@/components/editor/SceneForm';
import { SceneTags } from '@/components/editor/SceneTags';
import { Button, Card, Screen } from '@/components/ui';
import { useChoiceEditor, useSceneEditor } from '@/hooks/useEntityEditor';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Choice, ChoiceInput, SceneInput } from '@/types/api';
import { fonts, spacing, typography } from '@/theme';

// null : aucun formulaire de choix ouvert ; 'new' : création ; sinon l'id du choix modifié.
type Editing = null | 'new' | string;

// Une scène : son contenu, puis ses choix (ou l'issue de son combat, ou rien pour une fin).
export default function SceneScreen() {
  const { id, sceneId } = useLocalSearchParams<{ id: string; sceneId: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const scenes = useSceneEditor(id, editor.reload);
  const choices = useChoiceEditor(sceneId, editor.reload);
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const data = editor.data;
  const scene = data?.scenes.find((candidate) => candidate.id === sceneId);
  const locked = data?.published ?? false;
  const statTargets = data?.stats.filter((stat) => stat.type === 'number') ?? [];
  const itemTargets = data?.items ?? [];
  const sceneTargets = data?.scenes.map((other) => ({ id: other.id, title: other.title })) ?? [];
  const titleOf = (targetId: string | null) => data?.scenes.find((other) => other.id === targetId)?.title ?? '?';

  const saveScene = async (input: SceneInput) => {
    setNotice(null);
    if (await scenes.save(sceneId, input)) setNotice(fr.scenes.saved);
  };

  const openChoice = (next: Editing) => {
    choices.reset();
    setEditing(next);
  };

  const saveChoice = async (choiceId: string | null, input: ChoiceInput) => {
    if (await choices.save(choiceId, input)) setEditing(null);
  };

  const choiceSummary = (choice: Choice) => {
    const parts = [`→ ${titleOf(choice.toSceneId)}`];
    if (choice.condition) parts.push(`${fr.choices.if} ${describeCondition(choice.condition, statTargets, itemTargets)}`);
    const effects = describeEffects(choice.effects, statTargets, itemTargets);
    if (effects) parts.push(effects);
    return parts.join(' · ');
  };

  const renderChoiceForm = (choice: Choice | null) => (
    <ChoiceForm
      key={choice?.id ?? 'new'}
      choice={choice}
      scenes={sceneTargets}
      stats={statTargets}
      items={itemTargets}
      busy={choices.busy}
      fieldError={choices.fieldError}
      error={choices.error}
      onSubmit={(input) => saveChoice(choice?.id ?? null, input)}
      onCancel={() => setEditing(null)}
      onDelete={
        choice
          ? () => confirmRemove(fr.choices, choice.label, () => choices.remove(choice.id), () => setEditing(null))
          : undefined
      }
    />
  );

  if (!data || !scene) {
    return (
      <Screen scroll>
        <EditorHeader overline="" />
        {data ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{fr.scenes.notFound}</Text>
        ) : (
          <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
        )}
      </Screen>
    );
  }

  const isStart = scene.id === data.startSceneId;

  return (
    <Screen scroll>
      <EditorHeader overline={data.title} title={scene.title}>
        <SceneTags scene={scene} isStart={isStart} />
      </EditorHeader>

      {locked ? <Text style={[typography.body, { color: colors.textMuted }]}>{fr.storyEditor.lockedNotice}</Text> : null}

      {/* La clé remonte le formulaire quand le contenu relu change (après un enregistrement),
          mais pas quand seuls les choix changent : le texte en cours de saisie est gardé. */}
      <SceneForm
        key={JSON.stringify({ ...scene, choices: null })}
        scene={scene}
        scenes={sceneTargets}
        enemies={data.enemies}
        stats={statTargets}
        items={itemTargets}
        hasCombat={data.hasCombat}
        locked={locked}
        busy={scenes.busy}
        fieldError={scenes.fieldError}
        error={scenes.error}
        onSubmit={saveScene}
      />
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.success }]}>
          {notice}
        </Text>
      ) : null}

      <Card>
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
          {fr.choices.title}
        </Text>
        {scene.isEnding ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.choices.endingNote}</Text>
        ) : scene.enemyId ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {`${fr.choices.combatNote} ${fr.scenes.win} : ${titleOf(scene.winSceneId)} · ${fr.scenes.lose} : ${titleOf(scene.loseSceneId)}`}
          </Text>
        ) : (
          <>
            {scene.choices.length === 0 && editing !== 'new' ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.choices.empty}</Text>
            ) : null}
            {scene.choices.map((choice) =>
              editing === choice.id ? (
                renderChoiceForm(choice)
              ) : (
                <Card
                  key={choice.id}
                  onPress={locked ? undefined : () => openChoice(choice.id)}
                  accessibilityLabel={`${choice.label}, ${choiceSummary(choice)}`}
                  style={{ ...styles.choice, backgroundColor: colors.surfaceAlt }}
                >
                  <View style={styles.choiceText}>
                    <Text style={[styles.choiceLabel, { color: colors.text }]}>{choice.label}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>{choiceSummary(choice)}</Text>
                  </View>
                  {choice.condition ? <Feather name="lock" size={18} color={colors.textMuted} /> : null}
                </Card>
              ),
            )}
            {locked ? null : editing === 'new' ? (
              renderChoiceForm(null)
            ) : (
              <Button label={fr.choices.newChoice} variant="dashed" icon="plus" onPress={() => openChoice('new')} />
            )}
          </>
        )}
      </Card>

      {locked ? null : (
        <>
          {isStart ? null : (
            <Button
              label={fr.scenes.makeStart}
              variant="secondary"
              icon="flag"
              onPress={() => editor.save({ startSceneId: scene.id })}
              disabled={editor.busy}
            />
          )}
          <Button
            label={fr.scenes.delete}
            variant="ghost"
            icon="trash-2"
            onPress={() => confirmRemove(fr.scenes, scene.title, () => scenes.remove(scene.id), () => router.back())}
            disabled={scenes.busy}
          />
        </>
      )}
      {editor.actionError ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {editor.actionError}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  choiceText: { flex: 1, gap: 2 },
  choiceLabel: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
