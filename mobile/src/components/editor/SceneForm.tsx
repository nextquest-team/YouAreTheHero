import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Input } from '@/components/ui';
import type { FieldError } from '@/hooks/useEntityEditor';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Scene, SceneInput } from '@/types/api';
import { fonts, spacing, typography } from '@/theme';

import { EffectDraft, EffectsEditor, fromDrafts, toDrafts } from './EffectsEditor';
import { ImagePickerField } from './ImagePickerField';
import { OptionChips } from './OptionChips';

type Target = { id: string; name: string };

// Valeur de la pastille « Aucun » : OptionChips n'accepte que des chaînes.
const NO_ENEMY = 'none';

type Props = {
  scene: Scene;
  scenes: { id: string; title: string }[];
  enemies: Target[];
  stats: Target[];
  items: Target[];
  hasCombat: boolean;
  locked: boolean;
  busy: boolean;
  fieldError: FieldError | null;
  error: string | null;
  onSubmit: (input: SceneInput) => void;
};

/**
 * Contenu d'une scène : décor, titre, texte, fin ou non, ennemi à combattre (et les scènes
 * où mènent la victoire et la défaite), effets appliqués en entrant dans la scène.
 */
export function SceneForm({ scene, scenes, enemies, stats, items, hasCombat, locked, busy, fieldError, error, onSubmit }: Props) {
  const { colors } = useTheme();
  const [backgroundUrl, setBackgroundUrl] = useState(scene.backgroundUrl);
  const [title, setTitle] = useState(scene.title);
  const [text, setText] = useState(scene.text);
  const [isEnding, setIsEnding] = useState(scene.isEnding);
  const [enemyId, setEnemyId] = useState<string | null>(scene.enemyId);
  const [winSceneId, setWinSceneId] = useState<string | null>(scene.winSceneId);
  const [loseSceneId, setLoseSceneId] = useState<string | null>(scene.loseSceneId);
  const [onEnter, setOnEnter] = useState<EffectDraft[]>(toDrafts(scene.onEnterEffects));
  const [titleError, setTitleError] = useState<string | null>(null);
  const [effectsError, setEffectsError] = useState<string | null>(null);

  const serverError = (prefix: string) => (fieldError?.field.startsWith(prefix) ? fieldError.message : null);
  const sceneOptions = scenes.map((other) => ({ value: other.id, label: other.title }));
  const showCombat = hasCombat && !isEnding;

  const submit = () => {
    const converted = fromDrafts(onEnter);
    setTitleError(title.trim() ? null : fr.scenes.errorTitle);
    setEffectsError('error' in converted ? converted.error : null);
    if (!title.trim() || 'error' in converted) return;

    // Une fin ne combat pas : on retire l'ennemi et ses issues pour ne rien laisser d'incohérent.
    const combat = showCombat && enemyId !== null;
    onSubmit({
      title: title.trim(),
      text: text.trim(),
      backgroundUrl,
      isEnding,
      enemyId: combat ? enemyId : null,
      winSceneId: combat ? winSceneId : null,
      loseSceneId: combat ? loseSceneId : null,
      onEnterEffects: converted.effects,
    });
  };

  return (
    <View style={styles.form}>
      {locked ? null : (
        <ImagePickerField label={fr.scenes.background} value={backgroundUrl} onChange={setBackgroundUrl} height={180} />
      )}
      <Input
        label={fr.scenes.titleLabel}
        placeholder={fr.scenes.titlePlaceholder}
        value={title}
        onChangeText={setTitle}
        error={titleError ?? serverError('title')}
        editable={!locked}
        maxLength={120}
      />
      <Input
        label={fr.scenes.text}
        placeholder={fr.scenes.textPlaceholder}
        value={text}
        onChangeText={setText}
        error={serverError('text')}
        editable={!locked}
        maxLength={10000}
        multiline
        style={styles.text}
      />

      <Card style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{fr.scenes.ending}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.scenes.endingHint}</Text>
        </View>
        <Switch
          value={isEnding}
          onValueChange={setIsEnding}
          disabled={locked}
          accessibilityLabel={fr.scenes.ending}
          accessibilityHint={fr.scenes.endingHint}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      </Card>

      {showCombat ? (
        <Card>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
            {fr.scenes.combatTitle}
          </Text>
          {enemies.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.scenes.noEnemy}</Text>
          ) : (
            <OptionChips
              label={fr.scenes.enemy}
              options={[
                { value: NO_ENEMY, label: fr.scenes.peaceful },
                ...enemies.map((enemy) => ({ value: enemy.id, label: enemy.name })),
              ]}
              value={enemyId ?? NO_ENEMY}
              onChange={(value) => setEnemyId(value === NO_ENEMY ? null : value)}
              disabled={locked}
            />
          )}
          {serverError('enemyId') ? (
            <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
              {serverError('enemyId')}
            </Text>
          ) : null}
          {enemyId ? (
            <>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.scenes.combatHint}</Text>
              <OptionChips
                label={fr.scenes.win}
                options={sceneOptions}
                value={winSceneId}
                onChange={setWinSceneId}
                disabled={locked}
              />
              <OptionChips
                label={fr.scenes.lose}
                options={sceneOptions}
                value={loseSceneId}
                onChange={setLoseSceneId}
                disabled={locked}
              />
              <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.scenes.loseHint}</Text>
            </>
          ) : null}
        </Card>
      ) : null}

      <EffectsEditor
        label={fr.scenes.onEnter}
        hint={fr.scenes.onEnterHint}
        drafts={onEnter}
        onChange={setOnEnter}
        stats={stats}
        items={items}
        error={effectsError ?? serverError('onEnterEffects')}
        disabled={locked}
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      {locked ? null : <Button label={fr.common.save} icon="check" onPress={submit} loading={busy} />}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  text: { minHeight: 180 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
