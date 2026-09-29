import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Effect } from '@/types/api';
import { fonts, radius, spacing, typography } from '@/theme';

import { OptionChips } from './OptionChips';

type Target = { id: string; name: string };
type Kind = Effect['type'];

// Effet en cours de saisie : le montant reste du texte tant que la personne tape (« - », « -3 »…).
export type EffectDraft = { key: string; type: Kind; targetId: string | null; amount: string };

const INTEGER = /^-?\d+$/;
let nextKey = 0;
const newKey = () => `effect-${nextKey++}`;

export function toDrafts(effects: Effect[]): EffectDraft[] {
  return effects.map((effect) =>
    effect.type === 'stat'
      ? { key: newKey(), type: 'stat', targetId: effect.statId, amount: String(effect.delta) }
      : { key: newKey(), type: 'item', targetId: effect.itemId, amount: String(effect.qty) },
  );
}

/** Convertit les brouillons pour l'API, ou renvoie le message à afficher si l'un est incomplet. */
export function fromDrafts(drafts: EffectDraft[]): { effects: Effect[] } | { error: string } {
  const effects: Effect[] = [];
  for (const draft of drafts) {
    if (!draft.targetId) return { error: fr.effects.errorTarget };
    const amount = draft.amount.trim();
    if (!INTEGER.test(amount) || Number(amount) === 0) return { error: fr.effects.errorAmount };
    effects.push(
      draft.type === 'stat'
        ? { type: 'stat', statId: draft.targetId, delta: Number(amount) }
        : { type: 'item', itemId: draft.targetId, qty: Number(amount) },
    );
  }
  return { effects };
}

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** Résumé lisible d'une liste d'effets : « Force +2, Clé rouillée +1 ». */
export function describeEffects(effects: Effect[], stats: Target[], items: Target[]): string {
  const nameOf = (list: Target[], id: string) => list.find((target) => target.id === id)?.name ?? '?';
  return effects
    .map((effect) =>
      effect.type === 'stat'
        ? `${nameOf(stats, effect.statId)} ${signed(effect.delta)}`
        : `${nameOf(items, effect.itemId)} ${signed(effect.qty)}`,
    )
    .join(', ');
}

type Props = {
  label: string;
  hint?: string;
  drafts: EffectDraft[];
  onChange: (drafts: EffectDraft[]) => void;
  stats: Target[]; // seules les stats numériques peuvent changer
  items: Target[];
  error?: string | null;
  disabled?: boolean;
};

/** Liste d'effets : chacun change une caractéristique ou donne (retire) un objet. */
export function EffectsEditor({ label, hint, drafts, onChange, stats, items, error, disabled = false }: Props) {
  const { colors } = useTheme();
  const canAdd = stats.length > 0 || items.length > 0;

  const kinds = [
    ...(stats.length > 0 ? [{ value: 'stat' as const, label: fr.effects.kindStat }] : []),
    ...(items.length > 0 ? [{ value: 'item' as const, label: fr.effects.kindItem }] : []),
  ];

  const patch = (key: string, changes: Partial<EffectDraft>) =>
    onChange(drafts.map((draft) => (draft.key === key ? { ...draft, ...changes } : draft)));

  const add = () =>
    onChange([...drafts, { key: newKey(), type: stats.length > 0 ? 'stat' : 'item', targetId: null, amount: '' }]);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {hint ? <Text style={[typography.caption, { color: colors.textMuted }]}>{hint}</Text> : null}

      {drafts.map((draft, index) => {
        const targets = draft.type === 'stat' ? stats : items;
        return (
          <View
            key={draft.key}
            style={[styles.effect, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            accessibilityLabel={`${fr.effects.effect} ${index + 1}`}
          >
            {kinds.length > 1 ? (
              <OptionChips
                label={fr.effects.kind}
                options={kinds}
                value={draft.type}
                onChange={(type) => patch(draft.key, { type, targetId: null })}
                disabled={disabled}
              />
            ) : null}
            <OptionChips
              label={draft.type === 'stat' ? fr.effects.kindStat : fr.effects.kindItem}
              options={targets.map((target) => ({ value: target.id, label: target.name }))}
              value={draft.targetId}
              onChange={(targetId) => patch(draft.key, { targetId })}
              disabled={disabled}
            />
            <Input
              label={draft.type === 'stat' ? fr.effects.delta : fr.effects.qty}
              placeholder={draft.type === 'stat' ? '+2 / -1' : '1 / -1'}
              value={draft.amount}
              onChangeText={(amount) => patch(draft.key, { amount })}
              keyboardType="numbers-and-punctuation"
              maxLength={6}
              editable={!disabled}
            />
            {disabled ? null : (
              <Button
                label={fr.effects.remove}
                variant="ghost"
                icon="x"
                onPress={() => onChange(drafts.filter((other) => other.key !== draft.key))}
              />
            )}
          </View>
        );
      })}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}

      {disabled ? null : canAdd ? (
        <Button label={fr.effects.add} variant="dashed" icon="plus" onPress={add} />
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.effects.noTarget}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  effect: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderRadius: radius.md },
});
