import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { useT } from '../i18n';
import { LanguagePicker } from '../components/LanguagePicker';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Brief'>;

export function BriefScreen({ navigation }: Props) {
  const briefState = useAppStore((s) => s.brief);
  const setBrief = useAppStore((s) => s.setBrief);
  const signOut = useAppStore((s) => s.signOut);
  const t = useT();

  const [productName, setProductName] = useState(briefState.productName);
  const [targetAudience, setTargetAudience] = useState(briefState.targetAudience);
  const [adAngle, setAdAngle] = useState(briefState.adAngle);
  const [touched, setTouched] = useState(false);

  const canSubmit =
    productName.trim() && targetAudience.trim() && adAngle.trim();

  function onSubmit() {
    setTouched(true);
    if (!canSubmit) return;
    setBrief({
      productName: productName.trim(),
      targetAudience: targetAudience.trim(),
      adAngle: adAngle.trim(),
    });
    navigation.navigate('Copy');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={typeStyle.eyebrow}>{t('brief.eyebrow')}</Text>
              <Text style={styles.heading}>{t('brief.heading')}</Text>
            </View>
            <View style={styles.headerActions}>
              <LanguagePicker />
              <Pressable onPress={() => void signOut()} hitSlop={12}>
                <Text style={styles.signOut}>{t('common.signOut')}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.intro}>{t('brief.intro')}</Text>

          <Field
            label={t('brief.productName')}
            placeholder={t('brief.placeholderProduct')}
            value={productName}
            onChange={setProductName}
            error={touched && !productName.trim() ? t('brief.requiredProduct') : null}
          />
          <Field
            label={t('brief.targetAudience')}
            placeholder={t('brief.placeholderAudience')}
            value={targetAudience}
            onChange={setTargetAudience}
            error={touched && !targetAudience.trim() ? t('brief.requiredAudience') : null}
          />
          <Field
            label={t('brief.adAngle')}
            placeholder={t('brief.placeholderAngle')}
            value={adAngle}
            onChange={setAdAngle}
            multiline
            error={touched && !adAngle.trim() ? t('brief.requiredAngle') : null}
          />

          <Pressable
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>{t('brief.start')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  error,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: { flex: 1, paddingRight: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heading: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.ink,
    marginTop: spacing.xs,
  },
  signOut: { fontSize: 12, color: colors.inkSoft, textDecorationLine: 'underline' },
  intro: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: spacing.xl,
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
  inputMultiline: { minHeight: 76, textAlignVertical: 'top' },
  error: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
