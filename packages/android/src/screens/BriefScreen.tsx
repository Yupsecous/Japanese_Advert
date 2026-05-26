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
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Brief'>;

export function BriefScreen({ navigation }: Props) {
  const briefState = useAppStore((s) => s.brief);
  const setBrief = useAppStore((s) => s.setBrief);
  const signOut = useAppStore((s) => s.signOut);

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
            <View>
              <Text style={typeStyle.eyebrow}>The brief</Text>
              <Text style={styles.heading}>Three lines, four assets.</Text>
            </View>
            <Pressable onPress={() => void signOut()} hitSlop={12}>
              <Text style={styles.signOut}>Sign out</Text>
            </Pressable>
          </View>

          <Text style={styles.intro}>
            The director's cockpit walks you through copy, image, script and
            audio — one at a time.
          </Text>

          <Field
            label="Product name"
            placeholder="e.g. Lumen Sleep Mist"
            value={productName}
            onChange={setProductName}
            error={touched && !productName.trim() ? 'Product name is required.' : null}
          />
          <Field
            label="Target audience"
            placeholder="e.g. Burned-out parents, 30–45"
            value={targetAudience}
            onChange={setTargetAudience}
            error={touched && !targetAudience.trim() ? 'Target audience is required.' : null}
          />
          <Field
            label="Ad angle"
            placeholder="e.g. Fall asleep in seven minutes flat"
            value={adAngle}
            onChange={setAdAngle}
            multiline
            error={touched && !adAngle.trim() ? 'Ad angle is required.' : null}
          />

          <Pressable
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            onPress={onSubmit}
          >
            <Text style={styles.submitText}>Start</Text>
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
