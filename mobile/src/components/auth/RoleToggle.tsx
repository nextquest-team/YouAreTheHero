import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parchment } from '@/components/common/parchment';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing } from '@/theme';
import type { Role } from '@/types/api';

type Props = { value: Role; onChange: (role: Role) => void };

const OPTIONS: { role: Role; label: string; hint: string; icon: ComponentProps<typeof Feather>['name'] }[] = [
  { role: 'PLAYER', label: fr.auth.rolePlayer, hint: fr.auth.rolePlayerHint, icon: 'compass' },
  { role: 'CREATOR', label: fr.auth.roleCreator, hint: fr.auth.roleCreatorHint, icon: 'pen-tool' },
];

const RIBBON_WIDTH = 12;
const RIBBON_HEIGHT = 26;
const RIBBON_NOTCH = 7;

/** Choix du rôle à l'inscription : deux « pages de livre », la sélectionnée passe en parchemin. */
export function RoleToggle({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={fr.auth.roleLabel} style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.role === value;
        const pageBackground = selected ? parchment.background : colors.surface;
        const inkColor = selected ? parchment.ink : colors.textSoft;

        return (
          <Pressable
            key={option.role}
            onPress={() => onChange(option.role)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            accessibilityState={{ checked: selected }}
            style={[
              styles.page,
              {
                backgroundColor: pageBackground,
                borderColor: selected ? pageBackground : colors.border,
                borderLeftColor: selected ? parchment.rule : colors.surfaceAlt,
              },
            ]}
          >
            {selected ? (
              <>
                <View style={[styles.ribbon, { backgroundColor: colors.primary }]} />
                <View style={[styles.ribbonNotch, { borderTopColor: pageBackground }]} />
              </>
            ) : null}
            <Feather name={option.icon} size={28} color={inkColor} />
            <Text style={[styles.pageTitle, { color: inkColor }]}>{option.label}</Text>
            <Text style={[styles.pageHint, { color: selected ? parchment.inkSoft : colors.textMuted }]}>
              {option.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  page: {
    flex: 1,
    position: 'relative',
    minHeight: 176,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 16,
    alignItems: 'flex-start',
    gap: 10,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    right: 18,
    width: RIBBON_WIDTH,
    height: RIBBON_HEIGHT,
  },
  ribbonNotch: {
    position: 'absolute',
    top: RIBBON_HEIGHT,
    right: 18,
    width: 0,
    height: 0,
    borderLeftWidth: RIBBON_WIDTH / 2,
    borderRightWidth: RIBBON_WIDTH / 2,
    borderTopWidth: RIBBON_NOTCH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pageTitle: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28 },
  pageHint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, textAlign: 'left' },
});
