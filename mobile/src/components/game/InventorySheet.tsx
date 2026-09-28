import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: gameColors.scrim }]} onPress={onClose} accessibilityLabel={fr.game.close} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>
            {fr.game.inventory}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={fr.game.close} style={styles.close}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
        </View>

        {items.length === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{fr.game.inventoryEmpty}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {items.map((item) => {
              const image = assetUrl(item.imageUrl);
              return (
                <View key={item.id} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}>
                    {image ? (
                      <Image source={image} style={styles.thumbImage} contentFit="cover" />
                    ) : (
                      <Feather name="package" size={20} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.name} <Text style={{ color: colors.accent }}>× {item.qty}</Text>
                    </Text>
                    {item.description ? (
                      <Text style={[typography.caption, { color: colors.textMuted }]}>{item.description}</Text>
                    ) : null}
                  </View>
                  {item.usable ? (
                    <Button
                      label={fr.game.use}
                      variant="secondary"
                      disabled={!canUse || busy}
                      onPress={() => onUse(item.id)}
                      accessibilityHint={item.name}
                    />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  list: { gap: 10, paddingBottom: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  thumb: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  itemBody: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
