import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { Button, Card, Input } from '@/components/ui';
import type { FieldError } from '@/hooks/useEntityEditor';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Enemy, EnemyInput } from '@/types/api';
import { fonts, spacing, touchTarget, typography } from '@/theme';

import { EffectDraft, EffectsEditor, fromDrafts, toDrafts } from './EffectsEditor';
import { ImagePickerField } from './ImagePickerField';

type Target = { id: string; name: string };
type ExtraDraft = { key: string; name: string; value: string };
type NumberField = 'attack' | 'hp' | 'shield';

// Bornes de l'API pour chaque valeur de combat.
const BOUNDS: Record<NumberField, { min: number; max: number }> = {
  attack: { min: 0, max: 1000 },
  hp: { min: 1, max: 1000 },
  shield: { min: 0, max: 1000 },
};
const MAX_EXTRA = 20;
const INTEGER = /^\d+$/;

let nextKey = 0;
const newKey = () => `extra-${nextKey++}`;

type Props = {
  enemy: Enemy | null; // null : nouvel ennemi
  stats: Target[];
  items: Target[];
  busy: boolean;
  fieldError: FieldError | null;
  error: string | null;
  onSubmit: (input: EnemyInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

/**
 * Formulaire d'un ennemi : image, nom, attaque, PV, bouclier, caractéristiques affichées
 * au joueur (sans effet sur le combat) et butin donné quand il est vaincu.
 */
export function EnemyForm({ enemy, stats, items, busy, fieldError, error, onSubmit, onCancel, onDelete }: Props) {
  const { colors } = useTheme();
  const [imageUrl, setImageUrl] = useState(enemy?.imageUrl ?? null);
  const [name, setName] = useState(enemy?.name ?? '');
  const [numbers, setNumbers] = useState<Record<NumberField, string>>({
    attack: String(enemy?.attack ?? ''),
    hp: String(enemy?.hp ?? ''),
    shield: String(enemy?.shield ?? 0),
  });
  const [extras, setExtras] = useState<ExtraDraft[]>(
    (enemy?.extraStats ?? []).map((extra) => ({ key: newKey(), ...extra })),
  );
  const [loot, setLoot] = useState<EffectDraft[]>(toDrafts(enemy?.defeatEffects ?? []));
  const [errors, setErrors] = useState<Partial<Record<NumberField | 'name' | 'extraStats' | 'defeatEffects', string>>>({});

  const serverError = (prefix: string) => (fieldError?.field.startsWith(prefix) ? fieldError.message : null);

  const setNumber = (field: NumberField, value: string) => setNumbers((current) => ({ ...current, [field]: value }));
  const patchExtra = (key: string, changes: Partial<ExtraDraft>) =>
    setExtras((current) => current.map((extra) => (extra.key === key ? { ...extra, ...changes } : extra)));

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = fr.enemies.errorName;
    for (const field of ['attack', 'hp', 'shield'] as const) {
      const value = numbers[field].trim();
      const { min, max } = BOUNDS[field];
      if (!INTEGER.test(value) || Number(value) < min || Number(value) > max) {
        next[field] = `${fr.enemies.errorBetween} ${min} ${fr.stats.to} ${max}.`;
      }
    }
    if (extras.some((extra) => !extra.name.trim())) next.extraStats = fr.enemies.errorExtraName;
    const converted = fromDrafts(loot);
    if ('error' in converted) next.defeatEffects = converted.error;
    setErrors(next);
    if (Object.keys(next).length > 0 || 'error' in converted) return;

    onSubmit({
      name: name.trim(),
      imageUrl,
      attack: Number(numbers.attack),
      hp: Number(numbers.hp),
      shield: Number(numbers.shield),
      extraStats: extras.map((extra) => ({ name: extra.name.trim(), value: extra.value.trim() })),
      defeatEffects: converted.effects,
    });
  };

  const numberInput = (field: NumberField, label: string) => (
    <View style={styles.flex}>
      <Input
        label={label}
        value={numbers[field]}
        onChangeText={(value) => setNumber(field, value)}
        error={errors[field] ?? serverError(field)}
        keyboardType="number-pad"
        maxLength={4}
      />
    </View>
  );

  return (
    <Card>
      <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
        {enemy ? fr.enemies.editTitle : fr.enemies.newTitle}
      </Text>
      <ImagePickerField label={fr.enemies.image} value={imageUrl} onChange={setImageUrl} height={160} />
      <Input
        label={fr.enemies.name}
        placeholder={fr.enemies.namePlaceholder}
        value={name}
        onChangeText={setName}
        error={errors.name ?? serverError('name')}
        maxLength={60}
      />
      <View style={styles.row}>
        {numberInput('attack', fr.enemies.attack)}
        {numberInput('hp', fr.enemies.hp)}
        {numberInput('shield', fr.enemies.shield)}
      </View>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.enemies.combatHint}</Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>{fr.enemies.extraStats}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.enemies.extraStatsHint}</Text>
        {extras.map((extra, index) => (
          <View key={extra.key} style={styles.extraRow}>
            <View style={styles.flex}>
              <Input
                label={`${fr.enemies.extraName} ${index + 1}`}
                placeholder={fr.enemies.extraNamePlaceholder}
                value={extra.name}
                onChangeText={(value) => patchExtra(extra.key, { name: value })}
                maxLength={40}
              />
            </View>
            <View style={styles.flex}>
              <Input
                label={`${fr.enemies.extraValue} ${index + 1}`}
                placeholder={fr.enemies.extraValuePlaceholder}
                value={extra.value}
                onChangeText={(value) => patchExtra(extra.key, { value })}
                maxLength={40}
              />
            </View>
            <Pressable
              onPress={() => setExtras((current) => current.filter((other) => other.key !== extra.key))}
              accessibilityRole="button"
              accessibilityLabel={`${fr.enemies.removeExtra} ${index + 1}`}
              style={styles.removeExtra}
            >
              <Feather name="x" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        {errors.extraStats ?? serverError('extraStats') ? (
          <LiveText style={[typography.caption, { color: colors.danger }]}>
            {errors.extraStats ?? serverError('extraStats')}
          </LiveText>
        ) : null}
        {extras.length < MAX_EXTRA ? (
          <Button
            label={fr.enemies.addExtra}
            variant="secondary"
            icon="plus"
            onPress={() => setExtras((current) => [...current, { key: newKey(), name: '', value: '' }])}
          />
        ) : null}
      </View>

      <EffectsEditor
        label={fr.enemies.loot}
        hint={fr.enemies.lootHint}
        drafts={loot}
        onChange={setLoot}
        stats={stats}
        items={items}
        error={errors.defeatEffects ?? serverError('defeatEffects')}
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
        <Button label={fr.enemies.delete} variant="ghost" icon="trash-2" onPress={onDelete} disabled={busy} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  extraRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  removeExtra: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
