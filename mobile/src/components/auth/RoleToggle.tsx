import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';
import type { Role } from '@/types/api';

type Props = { value: Role; onChange: (role: Role) => void };

const OPTIONS: { role: Role; label: string; hint: string }[] = [
  { role: 'PLAYER', label: fr.auth.rolePlayer, hint: fr.auth.rolePlayerHint },
  { role: 'CREATOR', label: fr.auth.roleCreator, hint: fr.auth.roleCreatorHint },
];

/** Choix du rôle à l'inscription, en segments (maquette « Je suis Joueur / Créateur »). */
export function RoleToggle({ value, onChange }: Props) {
  const { colors } = useTheme();
  const current = OPTIONS.find((option) => option.role === value) ?? OPTIONS[0];

  return (
    <View style={styles.block}>
      <Text nativeID="role-label" style={[typography.overline, { color: colors.textMuted }]}>
        {fr.auth.roleLabel}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="role-label"
        style={[styles.track, { backgroundColor: colors.surface }]}
      >
        {OPTIONS.map((option) => {
          const selected = option.role === value;
          return (
            <Pressable
              key={option.role}
              onPress={() => onChange(option.role)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={option.hint}
              accessibilityState={{ selected, checked: selected }}
              style={[styles.segment, selected && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: selected ? colors.onPrimary : colors.text, fontFamily: selected ? fonts.bodyBold : fonts.bodySemiBold },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {current.hint}. {fr.auth.roleFinal}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  track: { flexDirection: 'row', gap: spacing.sm, padding: spacing.xs, borderRadius: radius.lg },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: { fontSize: 15 },
});
