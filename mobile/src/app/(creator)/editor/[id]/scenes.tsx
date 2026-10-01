import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { LoadState } from '@/components/common/LoadState';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { SceneTags } from '@/components/editor/SceneTags';
import { Button, Card, Input, Screen } from '@/components/ui';
import { useSceneEditor } from '@/hooks/useEntityEditor';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, spacing, typography } from '@/theme';

// Scènes de l'histoire. Une nouvelle scène est créée avec son seul titre, puis s'ouvre pour l'écrire.
export default function ScenesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const scenes = useSceneEditor(id, editor.reload);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  const { reload } = editor;
  // Au retour d'une scène, son titre ou ses choix ont pu changer.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const data = editor.data;
  const locked = data?.published ?? false;

  const openScene = (sceneId: string) =>
    router.push({ pathname: '/editor/[id]/scene/[sceneId]', params: { id, sceneId } });

  const create = async () => {
    if (!title.trim()) {
      setTitleError(fr.scenes.errorTitle);
      return;
    }
    setTitleError(null);
    const scene = await scenes.save(null, {
      title: title.trim(),
      text: '',
      backgroundUrl: null,
      isEnding: false,
      enemyId: null,
      winSceneId: null,
      loseSceneId: null,
      onEnterEffects: [],
    });
    if (!scene) return;
    // La première scène écrite devient la scène de départ : c'est presque toujours ce qu'on veut.
    if (data && !data.startSceneId) await editor.save({ startSceneId: scene.id });
    setTitle('');
    setCreating(false);
    openScene(scene.id);
  };

  return (
    <Screen scroll>
      <EditorHeader overline={data?.title ?? ''} title={data ? fr.scenes.title : undefined} />

      {!data ? (
        <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
      ) : (
        <>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {locked ? fr.storyEditor.lockedNotice : fr.scenes.intro}
          </Text>

          {data.scenes.length === 0 && !creating ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>{fr.scenes.empty}</Text>
          ) : null}
          {data.scenes.length > 0 && !data.startSceneId ? (
            <Text style={[typography.caption, { color: colors.danger }]}>{fr.scenes.noStart}</Text>
          ) : null}

          <View style={styles.list}>
            {data.scenes.map((scene) => (
              <Card
                key={scene.id}
                onPress={() => openScene(scene.id)}
                accessibilityLabel={scene.title}
                style={styles.row}
              >
                <Text style={[styles.sceneTitle, { color: colors.text }]}>{scene.title}</Text>
                <SceneTags scene={scene} isStart={scene.id === data.startSceneId} />
              </Card>
            ))}
          </View>

          {locked ? null : creating ? (
            <Card>
              <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
                {fr.scenes.newTitle}
              </Text>
              <Input
                label={fr.scenes.titleLabel}
                placeholder={fr.scenes.titlePlaceholder}
                value={title}
                onChangeText={setTitle}
                error={titleError ?? scenes.fieldError?.message ?? null}
                maxLength={120}
                autoFocus
              />
              {scenes.error ? (
                <LiveText style={[typography.caption, { color: colors.danger }]}>
                  {scenes.error}
                </LiveText>
              ) : null}
              <View style={styles.actions}>
                <Button label={fr.common.cancel} variant="ghost" onPress={() => setCreating(false)} style={styles.flex} />
                <Button label={fr.scenes.create} onPress={create} loading={scenes.busy} style={styles.flex} />
              </View>
            </Card>
          ) : (
            <Button label={fr.scenes.newScene} variant="dashed" icon="plus" onPress={() => setCreating(true)} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { gap: spacing.xs, paddingVertical: spacing.md },
  sceneTitle: { fontFamily: fonts.bodyBold, fontSize: 16 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
