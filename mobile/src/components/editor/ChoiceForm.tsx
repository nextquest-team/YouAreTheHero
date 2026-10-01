import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { Button, Card, Input } from '@/components/ui';
import type { FieldError } from '@/hooks/useEntityEditor';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Choice, ChoiceInput } from '@/types/api';
import { spacing, typography } from '@/theme';

import { ConditionDraft, ConditionEditor, fromConditionDraft, toConditionDraft } from './ConditionEditor';
import { EffectDraft, EffectsEditor, fromDrafts, toDrafts } from './EffectsEditor';
import { OptionChips } from './OptionChips';

type Target = { id: string; name: string };

type Props = {
  choice: Choice | null; // null : nouveau choix
  scenes: { id: string; title: string }[];
  stats: Target[];
  items: Target[];
  busy: boolean;
  fieldError: FieldError | null;
  error: string | null;
  onSubmit: (input: ChoiceInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

type Errors = { label?: string; toSceneId?: string; condition?: string; effects?: string };

/** Formulaire d'un choix : son texte, la scène où il mène, sa condition et ses effets. */
export function ChoiceForm({ choice, scenes, stats, items, busy, fieldError, error, onSubmit, onCancel, onDelete }: Props) {
  const { colors } = useTheme();
  const [label, setLabel] = useState(choice?.label ?? '');
  const [toSceneId, setToSceneId] = useState<string | null>(choice?.toSceneId ?? null);
  const [condition, setCondition] = useState<ConditionDraft>(toConditionDraft(choice?.condition ?? null));
  const [effects, setEffects] = useState<EffectDraft[]>(toDrafts(choice?.effects ?? []));
  const [errors, setErrors] = useState<Errors>({});

  const serverError = (prefix: string) => (fieldError?.field.startsWith(prefix) ? fieldError.message : null);

  const submit = () => {
    const convertedCondition = fromConditionDraft(condition);
    const convertedEffects = fromDrafts(effects);
    const next: Errors = {
      label: label.trim() ? undefined : fr.choices.errorLabel,
      toSceneId: toSceneId ? undefined : fr.choices.errorTarget,
      condition: 'error' in convertedCondition ? convertedCondition.error : undefined,
      effects: 'error' in convertedEffects ? convertedEffects.error : undefined,
    };
    setErrors(next);
    if (!toSceneId || 'error' in convertedCondition || 'error' in convertedEffects || next.label) return;

    onSubmit({
      label: label.trim(),
      toSceneId,
      condition: convertedCondition.condition,
      effects: convertedEffects.effects,
    });
  };

  return (
    <Card>
      <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
        {choice ? fr.choices.editTitle : fr.choices.newTitle}
      </Text>
      <Input
        label={fr.choices.label}
        placeholder={fr.choices.labelPlaceholder}
        value={label}
        onChangeText={setLabel}
        error={errors.label ?? serverError('label')}
        maxLength={120}
      />
      <OptionChips
        label={fr.choices.target}
        options={scenes.map((scene) => ({ value: scene.id, label: scene.title }))}
        value={toSceneId}
        onChange={setToSceneId}
      />
      {errors.toSceneId ?? serverError('toSceneId') ? (
        <LiveText style={[typography.caption, { color: colors.danger }]}>
          {errors.toSceneId ?? serverError('toSceneId')}
        </LiveText>
      ) : null}

      <ConditionEditor
        draft={condition}
        onChange={setCondition}
        stats={stats}
        items={items}
        error={errors.condition ?? serverError('condition')}
      />

      <EffectsEditor
        label={fr.choices.effects}
        hint={fr.choices.effectsHint}
        drafts={effects}
        onChange={setEffects}
        stats={stats}
        items={items}
        error={errors.effects ?? serverError('effects')}
      />

      {error ? (
        <LiveText style={[typography.caption, { color: colors.danger }]}>
          {error}
        </LiveText>
      ) : null}
      <View style={styles.actions}>
        <Button label={fr.common.cancel} variant="ghost" onPress={onCancel} style={styles.flex} />
        <Button label={fr.common.save} onPress={submit} loading={busy} style={styles.flex} />
      </View>
      {onDelete ? (
        <Button label={fr.choices.delete} variant="ghost" icon="trash-2" onPress={onDelete} disabled={busy} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
