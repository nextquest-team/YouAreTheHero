import { StyleSheet, Text, View } from 'react-native';

import { LiveText } from '@/components/common/LiveText';
import { Input } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Condition } from '@/types/api';
import { spacing, typography } from '@/theme';

import { OptionChips } from './OptionChips';

type Target = { id: string; name: string };
type Kind = 'none' | Condition['type'];
type StatOp = '>=' | '<=' | '==';
type ItemOp = 'has' | 'not_has';

// Condition en cours de saisie : la valeur reste du texte tant que la personne tape.
export type ConditionDraft = { type: Kind; targetId: string | null; op: StatOp | ItemOp; value: string };

const INTEGER = /^-?\d+$/;

export function toConditionDraft(condition: Condition | null): ConditionDraft {
  if (!condition) return { type: 'none', targetId: null, op: '>=', value: '' };
  return condition.type === 'stat'
    ? { type: 'stat', targetId: condition.statId, op: condition.op, value: String(condition.value) }
    : { type: 'item', targetId: condition.itemId, op: condition.op, value: '' };
}

/** Convertit le brouillon pour l'API, ou renvoie le message à afficher s'il est incomplet. */
export function fromConditionDraft(draft: ConditionDraft): { condition: Condition | null } | { error: string } {
  if (draft.type === 'none') return { condition: null };
  if (!draft.targetId) return { error: fr.conditions.errorTarget };
  if (draft.type === 'item') {
    return { condition: { type: 'item', itemId: draft.targetId, op: draft.op === 'not_has' ? 'not_has' : 'has' } };
  }
  if (!INTEGER.test(draft.value.trim())) return { error: fr.conditions.errorValue };
  const op = draft.op === '<=' || draft.op === '==' ? draft.op : '>=';
  return { condition: { type: 'stat', statId: draft.targetId, op, value: Number(draft.value.trim()) } };
}

/** Résumé lisible : « Force ≥ 5 », « Possède Clé rouillée ». */
export function describeCondition(condition: Condition, stats: Target[], items: Target[]): string {
  if (condition.type === 'item') {
    const name = items.find((item) => item.id === condition.itemId)?.name ?? '?';
    return `${condition.op === 'has' ? fr.conditions.has : fr.conditions.notHas} ${name}`;
  }
  const name = stats.find((stat) => stat.id === condition.statId)?.name ?? '?';
  const symbol = { '>=': '≥', '<=': '≤', '==': '=' }[condition.op];
  return `${name} ${symbol} ${condition.value}`;
}

type Props = {
  draft: ConditionDraft;
  onChange: (draft: ConditionDraft) => void;
  stats: Target[]; // seules les stats numériques peuvent servir de condition
  items: Target[];
  error?: string | null;
};

/** Condition d'un choix : aucune, une caractéristique comparée à une valeur, ou un objet possédé. */
export function ConditionEditor({ draft, onChange, stats, items, error }: Props) {
  const { colors } = useTheme();

  const kinds = [
    { value: 'none' as const, label: fr.conditions.none },
    ...(stats.length > 0 ? [{ value: 'stat' as const, label: fr.conditions.kindStat }] : []),
    ...(items.length > 0 ? [{ value: 'item' as const, label: fr.conditions.kindItem }] : []),
  ];

  const setKind = (type: Kind) =>
    onChange({ type, targetId: null, op: type === 'item' ? 'has' : '>=', value: '' });

  return (
    <View style={styles.field}>
      <OptionChips label={fr.conditions.label} options={kinds} value={draft.type} onChange={setKind} />
      <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.conditions.hint}</Text>

      {draft.type === 'stat' ? (
        <>
          <OptionChips
            label={fr.conditions.kindStat}
            options={stats.map((stat) => ({ value: stat.id, label: stat.name }))}
            value={draft.targetId}
            onChange={(targetId) => onChange({ ...draft, targetId })}
          />
          <OptionChips<StatOp>
            label={fr.conditions.compare}
            options={[
              { value: '>=', label: fr.conditions.atLeast },
              { value: '<=', label: fr.conditions.atMost },
              { value: '==', label: fr.conditions.exactly },
            ]}
            value={draft.op as StatOp}
            onChange={(op) => onChange({ ...draft, op })}
          />
          <Input
            label={fr.conditions.value}
            placeholder="5"
            value={draft.value}
            onChangeText={(value) => onChange({ ...draft, value })}
            keyboardType="numbers-and-punctuation"
            maxLength={9}
          />
        </>
      ) : null}

      {draft.type === 'item' ? (
        <>
          <OptionChips
            label={fr.conditions.kindItem}
            options={items.map((item) => ({ value: item.id, label: item.name }))}
            value={draft.targetId}
            onChange={(targetId) => onChange({ ...draft, targetId })}
          />
          <OptionChips<ItemOp>
            label={fr.conditions.possession}
            options={[
              { value: 'has', label: fr.conditions.has },
              { value: 'not_has', label: fr.conditions.notHas },
            ]}
            value={draft.op as ItemOp}
            onChange={(op) => onChange({ ...draft, op })}
          />
        </>
      ) : null}

      {error ? (
        <LiveText style={[typography.caption, { color: colors.danger }]}>
          {error}
        </LiveText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
});
