import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';
import type { GameState } from '@/types/api';

import { gameColors } from './gameColors';

type Props = {
  visible: boolean;
  items: GameState['inventory'];
  canUse: boolean;
  busy: boolean;
  onUse: (itemId: string) => void;
  onClose: () => void;
};

/** Sac du héros ; un consommable s'utilise d'ici, en combat compris. */
export function InventorySheet({ visible, items, canUse, busy, onUse, onClose }: Props) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const countLabel = totalQty > 1 ? fr.game.itemCountPlural : fr.game.itemCountSingular;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: gameColors.scrim }]} onPress={onClose} accessibilityLabel={fr.game.close} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {fr.game.inventory}
            </Text>
            {items.length > 0 ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{`${totalQty} ${countLabel}`}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={fr.game.closeInventory}
            style={styles.close}
          >
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
        </View>

        {items.length === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{fr.game.inventoryEmpty}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.grid}>
              {items.map((item) => {
                const image = assetUrl(item.imageUrl);
                const selected = item.id === current?.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedId(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}${item.qty > 1 ? `, × ${item.qty}` : ''}`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: selected ? colors.surfaceAlt : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.art, { backgroundColor: colors.surfaceAlt }]}>
                      {image ? (
                        <Image source={image} style={styles.artImage} contentFit="cover" />
                      ) : (
                        <Feather name={item.usable ? 'droplet' : 'key'} size={26} color={colors.accent} />
                      )}
                    </View>
                    <Text style={[styles.tileName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.qty > 1 ? (
                      <View style={[styles.qtyBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.qtyText, { color: colors.onPrimary }]}>×{item.qty}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {current ? (
              <View style={[styles.detail, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailName, { color: colors.text }]}>{current.name}</Text>
                {current.description ? (
                  <Text style={[typography.body, { color: colors.textSoft }]}>{current.description}</Text>
                ) : null}
                {current.usable ? (
                  <Button
                    label={fr.game.use}
                    disabled={!canUse || busy}
                    loading={busy}
                    onPress={() => onUse(current.id)}
                    accessibilityHint={current.name}
                  />
                ) : (
                  <Text style={[typography.caption, styles.passiveNote, { color: colors.textMuted }]}>
                    {fr.game.passiveItemNote}
                  </Text>
                )}
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { gap: 2 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32 },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    position: 'relative',
    flexBasis: '31%',
    flexGrow: 0,
    minHeight: 124,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  art: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artImage: { width: '100%', height: '100%' },
  tileName: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 16, textAlign: 'center' },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  detail: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1 },
  detailName: { fontFamily: fonts.display, fontSize: 25, lineHeight: 28 },
  passiveNote: { lineHeight: 19 },
});
