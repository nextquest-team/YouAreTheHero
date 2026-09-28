import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { RoleToggle } from '@/components/auth/RoleToggle';
import { Button, Input, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { fonts, typography } from '@/theme';
import type { Role } from '@/types/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { displayName?: string; email?: string; password?: string };

export default function Register() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('PLAYER');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const errors: FieldErrors = {
      displayName: displayName.trim() ? undefined : fr.auth.errorDisplayName,
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : fr.auth.errorEmail,
      password: password.length >= 8 ? undefined : fr.auth.errorPassword,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.displayName || errors.email || errors.password) return;

    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, displayName: displayName.trim(), role });
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
        <AuthHeader compact />

        <RoleToggle value={role} onChange={setRole} />

        <View style={styles.fields}>
          <Input
            label={fr.auth.displayName}
            placeholder={fr.auth.displayNamePlaceholder}
            value={displayName}
            onChangeText={setDisplayName}
            error={fieldErrors.displayName}
            maxLength={50}
            autoComplete="nickname"
            returnKeyType="next"
          />
          <Input
            label={fr.auth.email}
            placeholder={fr.auth.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <Input
            label={fr.auth.password}
            placeholder={fr.auth.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {formError ? (
            <Text accessibilityLiveRegion="polite" style={[styles.formError, { color: colors.danger }]}>
              {formError}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button label={fr.auth.register} onPress={submit} loading={submitting} />
          <Link href="/" dismissTo asChild>
            <Pressable accessibilityRole="link" style={styles.switchRow}>
              <Text style={[typography.body, styles.switch, { color: colors.textMuted }]}>
                {fr.auth.hasAccount}{' '}
                <Text style={[styles.link, { color: colors.accent }]}>{fr.auth.goToLogin}</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, gap: 24 },
  fields: { gap: 16 },
  formError: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  actions: { marginTop: 'auto', gap: 16 },
  switchRow: { minHeight: 44, justifyContent: 'center' },
  switch: { textAlign: 'center', fontSize: 14 },
  link: { fontFamily: fonts.bodyBold },
});
