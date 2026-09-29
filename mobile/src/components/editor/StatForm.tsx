import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { StatDefinition, StatInput } from '@/types/api';
import { spacing, typography } from '@/theme';

import { OptionChips } from './OptionChips';

type StatType = StatInput['type'];

type Props = {
  stat: StatDefinition | null; // null : nouvelle caractéristique
  busy: boolean;
  // Erreur 422 renvoyée par l'API pour un champ précis (name, type, defaultValue, min, max).
  fieldError: { field: string; message: string } | null;
  error: string | null;
  onSubmit: (input: StatInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

type Errors = Partial<Record<keyof StatInput, string>>;

const INTEGER = /^-?\d+$/;

const toText = (value: number | null) => (value === null ? '' : String(value));
const toBound = (value: string) => (value.trim() === '' ? null : Number(value.trim()));

/** Formulaire d'une caractéristique : nom, type, valeur de départ et bornes (pour un nombre). */
export function StatForm({ stat, busy, fieldError, error, onSubmit, onCancel, onDelete }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(stat?.name ?? '');
  const [type, setType] = useState<StatType>(stat?.type ?? 'number');
  const [defaultValue, setDefaultValue] = useState(stat?.defaultValue ?? '');
  const [min, setMin] = useState(toText(stat?.min ?? null));
  const [max, setMax] = useState(toText(stat?.max ?? null));
  const [errors, setErrors] = useState<Errors>({});

  const isNumber = type === 'number';
  const errorFor = (field: keyof StatInput) =>
    errors[field] ?? (fieldError?.field === field ? fieldError.message : undefined);

  const submit = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = fr.stats.errorName;
    if (isNumber) {
      if (!INTEGER.test(defaultValue.trim())) next.defaultValue = fr.stats.errorInteger;
      if (min.trim() !== '' && !INTEGER.test(min.trim())) next.min = fr.stats.errorInteger;
      if (max.trim() !== '' && !INTEGER.test(max.trim())) next.max = fr.stats.errorInteger;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      name: name.trim(),
      type,
      defaultValue: defaultValue.trim(),
      min: isNumber ? toBound(min) : null,
      max: isNumber ? toBound(max) : null,
    });
  };

  return (
    <Card>
      <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
        {stat ? fr.stats.editTitle : fr.stats.newTitle}
      </Text>
      <Input
        label={fr.stats.name}
        placeholder={fr.stats.namePlaceholder}
        value={name}
        onChangeText={setName}
        error={errorFor('name')}
        maxLength={40}
      />
      <OptionChips
        label={fr.stats.type}
        options={[
          { value: 'number', label: fr.stats.typeNumber },
          { value: 'text', label: fr.stats.typeText },
        ]}
        value={type}
        onChange={setType}
      />
      {errorFor('type') ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {errorFor('type')}
        </Text>
      ) : null}
      <Input
        label={isNumber ? fr.stats.defaultNumber : fr.stats.defaultText}
        placeholder={isNumber ? '10' : fr.stats.defaultTextPlaceholder}
        value={defaultValue}
        onChangeText={setDefaultValue}
        error={errorFor('defaultValue')}
        keyboardType={isNumber ? 'numbers-and-punctuation' : 'default'}
        maxLength={isNumber ? 9 : 50}
      />
      {isNumber ? (
        <View style={styles.bounds}>
          <View style={styles.flex}>
            <Input
              label={fr.stats.min}
              placeholder={fr.stats.boundPlaceholder}
              value={min}
              onChangeText={setMin}
              error={errorFor('min')}
              keyboardType="numbers-and-punctuation"
              maxLength={9}
            />
          </View>
          <View style={styles.flex}>
            <Input
              label={fr.stats.max}
              placeholder={fr.stats.boundPlaceholder}
              value={max}
              onChangeText={setMax}
              error={errorFor('max')}
              keyboardType="numbers-and-punctuation"
              maxLength={9}
            />
          </View>
        </View>
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
        <Button label={fr.stats.delete} variant="ghost" icon="trash-2" onPress={onDelete} disabled={busy} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  bounds: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
