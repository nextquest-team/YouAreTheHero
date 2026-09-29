import { type ReactNode, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, typography } from '@/theme';

type Props = {
  // Branché sur l'AuthProvider de B ; le bouton n'apparaît qu'une fois fourni
  onLogout?: () => void;
  // Section propre au rôle, sous le titre (le héros du joueur)
  children?: ReactNode;
};

// Écran Profil commun aux deux rôles
export function ProfileScreen({ onLogout, children }: Props) {
  const { colors, isDark, setScheme } = useTheme();
  const { user, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Effacement définitif (RGPD) : l'API supprime tout, puis on revient à l'écran de connexion.
  const confirmDeleteAccount = () =>
    Alert.alert(
      fr.profile.deleteAccountTitle,
      user?.role === 'CREATOR' ? fr.profile.deleteAccountCreator : fr.profile.deleteAccountPlayer,
      [
        { text: fr.common.cancel, style: 'cancel' },
        {
          text: fr.profile.deleteAccountConfirm,
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch {
              setDeleting(false);
              Alert.alert(fr.profile.deleteAccountError);
            }
          },
        },
      ],
    );

  return (
    <Screen scroll>
      <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
        {fr.profile.title}
      </Text>

      {children}

      <View style={styles.section}>
        <Text style={[typography.overline, { color: colors.textMuted }]}>
          {fr.profile.appearance}
        </Text>
        <Card style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{fr.profile.darkMode}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {fr.profile.darkModeHint}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(on) => setScheme(on ? 'dark' : 'light')}
            accessibilityLabel={fr.profile.darkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </Card>
      </View>

      {onLogout && (
        <Button label={fr.profile.logout} variant="secondary" icon="log-out" onPress={onLogout} />
      )}

      <View style={styles.section}>
        <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.profile.account}</Text>
        <Button
          label={fr.profile.deleteAccount}
          variant="ghost"
          icon="trash-2"
          onPress={confirmDeleteAccount}
          loading={deleting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
