import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Input } from '@/components/ui';
import type { FieldError } from '@/hooks/useEntityEditor';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Item, ItemInput } from '@/types/api';
import { fonts, spacing, typography } from '@/theme';

import { EffectDraft, EffectsEditor, fromDrafts, toDrafts } from './EffectsEditor';
import { ImagePickerField } from './ImagePickerField';

type Target = { id: string; name: string };

type Props = {
  item: Item | null; // null : nouvel objet
  stats: Target[];
  items: Target[];
  busy: boolean;
  fieldError: FieldError | null;
  error: string | null;
  onSubmit: (input: ItemInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

/** Formulaire d'un objet : image, nom, description, et ses effets s'il s'utilise depuis le sac. */
export function ItemForm({ item, stats, items, busy, fieldError, error, onSubmit, onCancel, onDelete }: Props) {
  const { colors } = useTheme();
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? null);
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [usable, setUsable] = useState(item ? item.useEffects !== null : false);
  const [effects, setEffects] = useState<EffectDraft[]>(toDrafts(item?.useEffects ?? []));
  const [nameError, setNameError] = useState<string | null>(null);
  const [effectsError, setEffectsError] = useState<string | null>(null);

  const serverError = (prefix: string) => (fieldError?.field.startsWith(prefix) ? fieldError.message : null);

  const submit = () => {
    const converted = fromDrafts(usable ? effects : []);
    setNameError(name.trim() ? null : fr.items.errorName);
    setEffectsError('error' in converted ? converted.error : null);
    if (!name.trim() || 'error' in converted) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      imageUrl,
      useEffects: usable ? converted.effects : null,
    });
  };

  return (
    <Card>
      <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
        {item ? fr.items.editTitle : fr.items.newTitle}
      </Text>
      <ImagePickerField label={fr.items.image} value={imageUrl} onChange={setImageUrl} height={140} />
      <Input
        label={fr.items.name}
        placeholder={fr.items.namePlaceholder}
        value={name}
        onChangeText={setName}
        error={nameError ?? serverError('name')}
        maxLength={60}
      />
      <Input
        label={fr.items.description}
        placeholder={fr.items.descriptionPlaceholder}
        value={description}
        onChangeText={setDescription}
        error={serverError('description')}
        maxLength={500}
        multiline
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{fr.items.usable}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.items.usableHint}</Text>
        </View>
        <Switch
          value={usable}
          onValueChange={setUsable}
          accessibilityLabel={fr.items.usable}
          accessibilityHint={fr.items.usableHint}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      </View>

      {usable ? (
        <EffectsEditor
          label={fr.items.useEffects}
          drafts={effects}
          onChange={setEffects}
          stats={stats}
          items={items}
          error={effectsError ?? serverError('useEffects')}
        />
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label={fr.common.cancel} variant="ghost" onPress={onCancel} style={styles.flex} />
        <Button label={fr.common.save} onPress={submit} loading={busy} style={styles.flex} />
      </View>
      {onDelete ? (
        <Button label={fr.items.delete} variant="ghost" icon="trash-2" onPress={onDelete} disabled={busy} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: 16 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
