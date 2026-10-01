import Feather from '@expo/vector-icons/Feather';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { OvalPortrait } from '@/components/hero/OvalPortrait';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, hairline, offsetShadow, radius, touchTarget, typography } from '@/theme';
import type { GameState } from '@/types/api';

type Props = {
  visible: boolean;
  game: GameState;
  storyTitle: string;
  canUse: boolean;
  busy: boolean;
  onUse: (itemId: string) => void;
  onEditFace: () => void;
  onClose: () => void;
};

const COLUMNS = 3;

/**
 * Feuille d'aventure plein écran : le portrait du héros, ses caractéristiques en grille
 * et le contenu du sac. Un consommable s'utilise d'ici, en combat compris.
 */
export function AdventureSheet({ visible, game, storyTitle, canUse, busy, onUse, onEditFace, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const face = assetUrl(game.heroFaceUrl);
  const numberStats = game.stats.filter((stat) => stat.type === 'number');
  const textStats = game.stats.filter((stat) => stat.type === 'text');
  const totalQty = game.inventory.reduce((sum, item) => sum + item.qty, 0);
  const countLabel = totalQty > 1 ? fr.game.itemCountPlural : fr.game.itemCountSingular;

  return (
    // Une Modal s'ouvre dans sa propre fenêtre native, hors du SafeAreaProvider de l'app : sans le
    // sien, ses marges valent 0 et l'en-tête passe sous la barre d'état.
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={fr.game.backToScene} style={styles.iconButton}>
                <Feather name="chevron-left" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.storyTitle, { color: colors.text }]} numberOfLines={1}>
                {storyTitle}
              </Text>
            </View>

            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              {fr.game.sheetTitleStart}
              <Text style={[styles.titleAccent, { color: colors.accent }]}>{fr.game.sheetTitleAccent}</Text>
            </Text>

            <View style={styles.hero}>
              <Pressable
                onPress={onEditFace}
                accessibilityRole="button"
                accessibilityLabel={fr.game.heroFaceButton}
                style={({ pressed }) => [styles.portrait, { opacity: pressed ? 0.8 : 1 }]}
              >
                <OvalPortrait uri={face} width={124} height={156} ringGap={5} ink={colors.text} background={colors.surfaceAlt} />
                <View style={[styles.selfieTag, { backgroundColor: colors.background, borderColor: colors.borderStrong }]}>
                  <Text style={[styles.selfieText, { color: colors.text }]}>{`[${fr.game.selfieTag}]`}</Text>
                </View>
              </Pressable>
              {user ? <Text style={[styles.heroName, { color: colors.text }]}>{user.displayName}</Text> : null}
            </View>

            {numberStats.length > 0 ? (
              <View style={[styles.grid, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
                {numberStats.map((stat, index) => {
                  const isHp = stat.id === game.hpStatId;
                  const lastInRow = index % COLUMNS === COLUMNS - 1 || index === numberStats.length - 1;
                  return (
                    <View
                      key={stat.id}
                      accessible
                      accessibilityLabel={`${stat.name} ${stat.value}${stat.max !== null ? ` ${fr.game.outOf} ${stat.max}` : ''}`}
                      style={[
                        styles.cell,
                        { borderColor: colors.borderStrong },
                        !lastInRow && styles.cellDivider,
                        index >= COLUMNS && styles.cellTop,
                      ]}
                    >
                      <Text style={[styles.cellLabel, { color: colors.textMuted }]} numberOfLines={1}>
                        {stat.name}
                      </Text>
                      <Text style={[styles.cellValue, { color: isHp ? colors.accent : colors.text }]}>{stat.value}</Text>
                      {stat.max !== null ? (
                        <Text style={[styles.cellLabel, { color: colors.textMuted }]}>{`${fr.game.max} ${stat.max}`}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {textStats.map((stat) => (
              <View key={stat.id} accessible style={[styles.textStat, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cellLabel, { color: colors.textMuted }]}>{stat.name}</Text>
                <Text style={[styles.textStatValue, { color: colors.text }]}>{String(stat.value)}</Text>
              </View>
            ))}

            <View style={styles.bag}>
              <View style={[styles.bagHeader, { borderBottomColor: colors.borderStrong }]}>
                <Text accessibilityRole="header" style={[styles.bagTitle, { color: colors.text }]}>
                  {fr.game.bag}
                </Text>
                {totalQty > 0 ? <Text style={[typography.overline, { color: colors.textMuted }]}>{`${totalQty} ${countLabel}`}</Text> : null}
              </View>

              {game.inventory.length === 0 ? (
                <Text style={[styles.description, { color: colors.textMuted }]}>{fr.game.inventoryEmpty}</Text>
              ) : (
                game.inventory.map((item) => (
                  <View key={item.id} style={[styles.item, { borderBottomColor: colors.border }]}>
                    <View style={styles.itemText} accessible accessibilityLabel={`${item.name}, × ${item.qty}. ${item.description ?? ''}`}>
                      <View style={styles.itemHead}>
                        <Text style={[styles.qty, { color: colors.accent }]}>{`×${item.qty}`}</Text>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                      </View>
                      {item.description ? (
                        <Text style={[styles.description, styles.indent, { color: colors.textMuted }]}>{item.description}</Text>
                      ) : null}
                    </View>
                    {item.usable ? (
                      <Pressable
                        onPress={() => onUse(item.id)}
                        disabled={!canUse || busy}
                        accessibilityRole="button"
                        accessibilityLabel={`${fr.game.use} ${item.name}`}
                        accessibilityState={{ disabled: !canUse || busy, busy }}
                        style={({ pressed }) => [
                          styles.use,
                          { backgroundColor: colors.primary, boxShadow: offsetShadow(colors.accent, 3), opacity: !canUse || busy ? 0.5 : 1 },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.useText, { color: colors.onPrimary }]}>{fr.game.use}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -10 },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  storyTitle: { flex: 1, fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40 },
  titleAccent: { fontFamily: fonts.displayItalic },
  hero: { alignItems: 'center', gap: 10 },
  portrait: { alignItems: 'center', paddingBottom: 10 },
  selfieTag: {
    position: 'absolute',
    bottom: 0,
    borderWidth: hairline,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selfieText: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroName: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 26, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: hairline, borderRadius: radius.sm },
  cell: { width: `${100 / COLUMNS}%`, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, gap: 2 },
  cellDivider: { borderRightWidth: hairline },
  cellTop: { borderTopWidth: hairline },
  cellLabel: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  cellValue: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42 },
  textStat: { gap: 2, paddingBottom: 8, borderBottomWidth: 1 },
  textStatValue: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 23 },
  bag: { gap: 12 },
  bagHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: hairline,
  },
  bagTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1 },
  itemText: { flex: 1, gap: 2 },
  itemHead: { flexDirection: 'row', alignItems: 'baseline' },
  qty: { width: 28, fontFamily: fonts.monoBold, fontSize: 13 },
  itemName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 23 },
  indent: { marginLeft: 28 },
  description: { fontFamily: fonts.bodyItalic, fontSize: 14, lineHeight: 19 },
  use: { minHeight: touchTarget, paddingHorizontal: 12, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  useText: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
});
