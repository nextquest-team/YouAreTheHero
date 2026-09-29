import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { StoryStatusBadge } from '@/components/editor/StoryStatusBadge';
import { StoryCover } from '@/components/library/StoryCover';
import { Button, Card, Input, Screen } from '@/components/ui';
import { useMyStories } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { spacing, typography } from '@/theme';

type FormErrors = { title?: string; genre?: string };

// Histoires du créateur : ouvrir l'éditeur d'une histoire, ou en créer une nouvelle.
export default function MyStories() {
  const { colors } = useTheme();
  const { data, loading, error, reload, creating, createError, create } = useMyStories();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [summary, setSummary] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Au retour de l'éditeur, le titre ou le statut a pu changer.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openEditor = (id: string) => router.push({ pathname: '/editor/[id]', params: { id } });

  const submit = async () => {
    const errors: FormErrors = {
      title: title.trim() ? undefined : fr.creatorStories.errorTitle,
      genre: genre.trim() ? undefined : fr.creatorStories.errorGenre,
    };
    setFormErrors(errors);
    if (errors.title || errors.genre) return;

    const story = await create({ title: title.trim(), genre: genre.trim(), summary: summary.trim() });
    if (story) {
      setFormOpen(false);
      setTitle('');
      setGenre('');
      setSummary('');
      openEditor(story.id);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.textMuted }]}>{fr.creatorStories.overline}</Text>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {fr.creatorStories.title}
        </Text>
      </View>

      {formOpen ? (
        <Card>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            {fr.creatorStories.formTitle}
          </Text>
          <Input
            label={fr.creatorStories.titleLabel}
            placeholder={fr.creatorStories.titlePlaceholder}
            value={title}
            onChangeText={setTitle}
            error={formErrors.title}
            maxLength={120}
          />
          <Input
            label={fr.creatorStories.genreLabel}
            placeholder={fr.creatorStories.genrePlaceholder}
            value={genre}
            onChangeText={setGenre}
            error={formErrors.genre}
            maxLength={40}
          />
          <Input
            label={fr.creatorStories.summaryLabel}
            placeholder={fr.creatorStories.summaryPlaceholder}
            value={summary}
            onChangeText={setSummary}
            multiline
          />
          {createError ? (
            <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
              {createError}
            </Text>
          ) : null}
          <View style={styles.formActions}>
            <Button label={fr.common.cancel} variant="ghost" onPress={() => setFormOpen(false)} style={styles.flex} />
            <Button label={fr.creatorStories.create} onPress={submit} loading={creating} style={styles.flex} />
          </View>
        </Card>
      ) : (
        <Button label={fr.creatorStories.newStory} variant="dashed" icon="plus" onPress={() => setFormOpen(true)} />
      )}

      {data === null ? (
        <LoadState loading={loading} error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>{fr.creatorStories.empty}</Text>
      ) : (
        <View style={styles.list}>
          {data.map((story) => (
            <Card
              key={story.id}
              onPress={() => openEditor(story.id)}
              accessibilityLabel={`${story.title}, ${story.published ? fr.creatorStories.published : fr.creatorStories.draft}`}
              style={styles.row}
            >
              <StoryCover uri={story.coverUrl} title={story.title} width={64} height={86} />
              <View style={styles.rowText}>
                <Text numberOfLines={2} style={[typography.cardTitle, { color: colors.text }]}>
                  {story.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{story.genre}</Text>
                <StoryStatusBadge published={story.published} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2 },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  rowText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
});
