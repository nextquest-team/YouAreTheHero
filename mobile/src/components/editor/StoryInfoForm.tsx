import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { StoryCover } from '@/components/library/StoryCover';
import { Button, Card, Input } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { CreatorStory, UpdateStoryInput } from '@/types/api';
import { fonts, spacing, typography } from '@/theme';

import { ImagePickerField } from './ImagePickerField';

type Props = {
  story: CreatorStory;
  busy: boolean;
  onSave: (input: UpdateStoryInput) => void;
  onCoverChange: (fileUri: string) => void;
};

type FormErrors = { title?: string; genre?: string };

const COVER_HEIGHT = 200;

/**
 * Infos d'une histoire : couverture, titre, genre, résumé, avec ou sans combats.
 * Une histoire publiée est en lecture seule (l'API répond 409 STORY_PUBLISHED sinon).
 */
export function StoryInfoForm({ story, busy, onSave, onCoverChange }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(story.title);
  const [genre, setGenre] = useState(story.genre);
  const [summary, setSummary] = useState(story.summary);
  const [hasCombat, setHasCombat] = useState(story.hasCombat);
  const [errors, setErrors] = useState<FormErrors>({});
  const locked = story.published;

  const changed =
    title.trim() !== story.title ||
    genre.trim() !== story.genre ||
    summary.trim() !== story.summary ||
    hasCombat !== story.hasCombat;

  const submit = () => {
    const next: FormErrors = {
      title: title.trim() ? undefined : fr.creatorStories.errorTitle,
      genre: genre.trim() ? undefined : fr.creatorStories.errorGenre,
    };
    setErrors(next);
    if (next.title || next.genre) return;
    onSave({ title: title.trim(), genre: genre.trim(), summary: summary.trim(), hasCombat });
  };

  return (
    <View style={styles.form}>
      {locked ? (
        <StoryCover uri={story.coverUrl} title={story.title} width={COVER_HEIGHT * 0.75} height={COVER_HEIGHT} />
      ) : (
        <ImagePickerField label={fr.storyEditor.cover} value={story.coverUrl} onChange={onCoverChange} height={COVER_HEIGHT} />
      )}

      <Input
        label={fr.creatorStories.titleLabel}
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        editable={!locked}
        maxLength={120}
      />
      <Input
        label={fr.creatorStories.genreLabel}
        placeholder={fr.creatorStories.genrePlaceholder}
        value={genre}
        onChangeText={setGenre}
        error={errors.genre}
        editable={!locked}
        maxLength={40}
      />
      <Input
        label={fr.creatorStories.summaryLabel}
        placeholder={fr.creatorStories.summaryPlaceholder}
        value={summary}
        onChangeText={setSummary}
        editable={!locked}
        multiline
      />

      <Card style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{fr.storyEditor.combatLabel}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.storyEditor.combatHint}</Text>
        </View>
        <Switch
          value={hasCombat}
          onValueChange={setHasCombat}
          disabled={locked}
          accessibilityLabel={fr.storyEditor.combatLabel}
          accessibilityHint={fr.storyEditor.combatHint}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      </Card>

      {locked ? null : (
        <Button label={fr.common.save} icon="check" onPress={submit} disabled={!changed || busy} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
