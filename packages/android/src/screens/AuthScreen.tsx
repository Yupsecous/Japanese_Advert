import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { login, BackendError } from '../services/backend';

export function AuthScreen() {
  const setAuth = useAppStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await login(username, password);
      await setAuth(token);
    } catch (err) {
      if (err instanceof BackendError && err.code === 'auth/bad-credentials') {
        setError("Username and password didn't match. Check for stray spaces.");
      } else if (err instanceof BackendError && err.code === 'network') {
        setError(
          'Could not reach the backend. Confirm the backend is running and the URL in app.json is correct.',
        );
      } else {
        setError(err instanceof Error ? err.message : 'Sign-in failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Director's Cockpit</Text>
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.subtitle}>
            This app is access-controlled. Enter the credentials your contact
            shared with you.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              editable={!submitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submit, submitting && styles.submitDisabled]}
            disabled={submitting || !username || !password}
            onPress={onSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Sign in</Text>
            )}
          </Pressable>

          <Text style={styles.footnote}>
            Credentials are checked server-side. This is a soft gate for the
            internal team, not a public security barrier.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  eyebrow: {
    ...typeStyle.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: 32,
    fontWeight: '500',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  fieldGroup: { marginBottom: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.ink,
  },
  errorBox: {
    backgroundColor: '#FCE7E5',
    borderColor: '#F4B4B0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 13, color: colors.error },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footnote: {
    marginTop: spacing.lg,
    fontSize: 11,
    color: colors.inkFaint,
    lineHeight: 16,
  },
});
