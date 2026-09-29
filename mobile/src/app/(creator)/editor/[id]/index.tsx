import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { PublishIssues } from '@/components/editor/PublishIssues';
import { StoryInfoForm } from '@/components/editor/StoryInfoForm';
import { StoryStatusBadge } from '@/components/editor/StoryStatusBadge';
import { Button, Card, Screen } from '@/components/ui';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { UpdateStoryInput } from '@/types/api';
import { spacing, touchTarget, typography } from '@/theme';

// Éditeur d'une histoire : infos, couverture, avec ou sans combats, publication et suppression.
export default function StoryEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const [notice, setNotice] = useState<string | null>(null);

  const data = editor.data;

  const save = async (input: UpdateStoryInput) => {
    setNotice(null);
    if (await editor.save(input)) setNotice(fr.storyEditor.saved);
  };

  const changeCover = async (uri: string) => {
    setNotice(null);
    await editor.changeCover(uri);
  };

  const publish = async () => {
    setNotice(null);
    await editor.publish();
  };

  const unpublish = async () => {
    setNotice(null);
    await editor.unpublish();
  };

  const confirmDelete = () =>
    Alert.alert(fr.storyEditor.deleteTitle, fr.storyEditor.deleteMessage, [
      { text: fr.common.cancel, style: 'cancel' },
      {
        text: fr.common.delete,
        style: 'destructive',
        onPress: async () => {
          if (await editor.remove()) router.back();
        },
      },
    ]);

  const sceneTitles = new Map(data?.scenes.map((scene) => [scene.id, scene.title]) ?? []);
  const justPublished = data?.published && editor.report !== null && editor.report.errors.length === 0;

  return (
    <Screen scroll>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={fr.common.back}
        style={styles.back}
      >
        <Feather name="arrow-left" size={24} color={colors.text} />
      </Pressable>

      {!data ? (
        <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[typography.label, { color: colors.textMuted }]}>{fr.storyEditor.overline}</Text>
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
              {data.title}
            </Text>
            <StoryStatusBadge published={data.published} />
          </View>

          {data.published ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>{fr.storyEditor.lockedNotice}</Text>
          ) : null}

          {/* La clé remonte le formulaire après chaque enregistrement, avec les valeurs relues de l'API. */}
          <StoryInfoForm
            key={data.updatedAt}
            story={data}
            busy={editor.busy}
            onSave={save}
            onCoverChange={changeCover}
          />

          {editor.busy ? <ActivityIndicator color={colors.accent} accessibilityLabel={fr.common.loading} /> : null}
          {editor.actionError ? (
            <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
              {editor.actionError}
            </Text>
          ) : null}
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.success }]}>
              {notice}
            </Text>
          ) : null}

          <Card>
            <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
              {fr.storyEditor.publicationTitle}
            </Text>
            {data.published && data.publishedAt ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {`${fr.storyEditor.publishedOn} ${new Date(data.publishedAt).toLocaleDateString('fr-FR')}`}
              </Text>
            ) : (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.storyEditor.publishHint}</Text>
            )}
            {justPublished ? (
              <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.success }]}>
                {fr.storyEditor.publishedDone}
              </Text>
            ) : null}
            {editor.report ? <PublishIssues report={editor.report} sceneTitles={sceneTitles} /> : null}
            {data.published ? (
              <Button label={fr.storyEditor.unpublish} variant="secondary" icon="eye-off" onPress={unpublish} disabled={editor.busy} />
            ) : (
              <Button label={fr.storyEditor.publish} icon="send" onPress={publish} disabled={editor.busy} />
            )}
          </Card>

          <Button
            label={fr.storyEditor.deleteStory}
            variant="ghost"
            icon="trash-2"
            onPress={confirmDelete}
            disabled={editor.busy}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: touchTarget, height: touchTarget, justifyContent: 'center', marginLeft: -spacing.sm, paddingLeft: spacing.sm },
  header: { gap: spacing.xs, alignItems: 'flex-start' },
});
