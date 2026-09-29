import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { confirmRemove } from '@/components/editor/confirm';
import { describeEffects } from '@/components/editor/EffectsEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { ItemForm } from '@/components/editor/ItemForm';
import { Button, Card, Screen } from '@/components/ui';
import { useItemEditor } from '@/hooks/useEntityEditor';
import { useStoryEditor } from '@/hooks/useMyStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import type { Item, ItemInput } from '@/types/api';
import { fonts, radius, spacing, typography } from '@/theme';

// null : aucun formulaire ouvert ; 'new' : création ; sinon l'id de l'objet modifié.
type Editing = null | 'new' | string;

const THUMB = 48;

// Objets de l'histoire : ce que le héros ramasse, garde, et parfois utilise depuis son sac.
export default function ItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const editor = useStoryEditor(id);
  const items = useItemEditor(id, editor.reload);
  const [editing, setEditing] = useState<Editing>(null);

  const data = editor.data;
  const locked = data?.published ?? false;
  const statTargets = data?.stats.filter((stat) => stat.type === 'number') ?? [];
  const itemTargets = data?.items ?? [];

  const summary = (item: Item) => {
    if (item.useEffects === null) return item.description ?? fr.items.kept;
    const effects = describeEffects(item.useEffects, statTargets, itemTargets);
    return effects ? `${fr.items.usableShort} : ${effects}` : fr.items.usableShort;
  };

  const open = (next: Editing) => {
    items.reset();
    setEditing(next);
  };

  const submit = async (itemId: string | null, input: ItemInput) => {
    if (await items.save(itemId, input)) setEditing(null);
  };

  const renderForm = (item: Item | null) => (
    <ItemForm
      key={item?.id ?? 'new'}
      item={item}
      stats={statTargets}
      items={itemTargets}
      busy={items.busy}
      fieldError={items.fieldError}
      error={items.error}
      onSubmit={(input) => submit(item?.id ?? null, input)}
      onCancel={() => setEditing(null)}
      onDelete={
        item ? () => confirmRemove(fr.items, item.name, () => items.remove(item.id), () => setEditing(null)) : undefined
      }
    />
  );

  return (
    <Screen scroll>
      <EditorHeader overline={data?.title ?? ''} title={data ? fr.items.title : undefined} />

      {!data ? (
        <LoadState loading={editor.loading} error={editor.error} onRetry={editor.reload} />
      ) : (
        <>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {locked ? fr.storyEditor.lockedNotice : fr.items.intro}
          </Text>

          {data.items.length === 0 && editing !== 'new' ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>{fr.items.empty}</Text>
          ) : null}

          <View style={styles.list}>
            {data.items.map((item) =>
              editing === item.id ? (
                renderForm(item)
              ) : (
                <Card
                  key={item.id}
                  onPress={locked ? undefined : () => open(item.id)}
                  accessibilityLabel={`${item.name}, ${summary(item)}`}
                  style={styles.row}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: assetUrl(item.imageUrl) ?? undefined }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]} />
                  )}
                  <View style={styles.rowText}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text numberOfLines={2} style={[typography.caption, { color: colors.textMuted }]}>
                      {summary(item)}
                    </Text>
                  </View>
                </Card>
              ),
            )}
          </View>

          {locked ? null : editing === 'new' ? (
            renderForm(null)
          ) : (
            <Button label={fr.items.newItem} variant="dashed" icon="plus" onPress={() => open('new')} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.md },
  rowText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
