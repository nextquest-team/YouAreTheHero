import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button, Input, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { fonts, typography } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const errors = {
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : fr.auth.errorEmail,
      password: password ? undefined : fr.auth.errorPasswordRequired,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      // La redirection vers l'espace joueur ou créateur se fait dans le layout racine.
      await login(email.trim(), password);
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
        <AuthHeader />

        <View style={styles.fields}>
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
            placeholder={fr.auth.passwordDots}
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
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
          <Button label={fr.auth.login} onPress={submit} loading={submitting} />
          <Link href="/register" asChild>
            <Pressable accessibilityRole="link" style={styles.switchRow}>
              <Text style={[typography.body, styles.switch, { color: colors.textMuted }]}>
                {fr.auth.noAccount}{' '}
                <Text style={[styles.link, { color: colors.accent }]}>{fr.auth.createAccount}</Text>
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
  content: { flexGrow: 1, gap: 28 },
  fields: { gap: 16 },
  formError: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  actions: { marginTop: 'auto', gap: 16 },
  switchRow: { minHeight: 44, justifyContent: 'center' },
  switch: { textAlign: 'center', fontSize: 14 },
  link: { fontFamily: fonts.bodyBold },
});
