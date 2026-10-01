import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OvalPortrait } from '@/components/hero/OvalPortrait';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, typography } from '@/theme';

export default function PlayerProfile() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  return (
    <ProfileScreen onLogout={logout}>
      {/* Le visage du héros, repris dans toutes les histoires (la bibliothèque n'a plus d'avatar) */}
      <View style={styles.section}>
        <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.profile.hero}</Text>
        <View style={styles.hero}>
          <OvalPortrait uri={assetUrl(user?.avatarUrl)} width={88} height={112} ink={colors.text} background={colors.surfaceAlt} />
          <View style={styles.heroText}>
            {user ? <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text> : null}
            <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.profile.heroHint}</Text>
          </View>
        </View>
        <Button label={fr.profile.changeFace} variant="secondary" icon="camera" onPress={() => router.push('/selfie')} />
      </View>
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 26 },
});
