import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { generateDesign } from '../services/designService';
import { BackendError } from '../services/backend';
import { useT, translate, useLocaleStore } from '../i18n';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Design'>;

export function DesignScreen({ navigation }: Props) {
  const brief = useAppStore((s) => s.brief);
  const copyVariants = useAppStore((s) => s.copyVariants);
  const copyIndex = useAppStore((s) => s.copyIndex);
  const imageVariants = useAppStore((s) => s.imageVariants);
  const imageIndex = useAppStore((s) => s.imageIndex);
  const designVariant = useAppStore((s) => s.designVariant);
  const setDesignVariant = useAppStore((s) => s.setDesignVariant);
  const t = useT();

  const approvedCopy = copyIndex !== null ? copyVariants[copyIndex] : undefined;
  const approvedImage = imageIndex !== null ? imageVariants[imageIndex] : undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');
  const [copied, setCopied] = useState(false);

  const runGenerate = useCallback(
    async (refineDirection?: string) => {
      if (!approvedCopy || !approvedImage) return;
      setError(null);
      setLoading(true);
      try {
        const next = await generateDesign({
          brief,
          approvedCopy,
          approvedImage,
          ...(refineDirection ? { refineDirection } : {}),
        });
        setDesignVariant(next);
        setRefineText('');
      } catch (err) {
        setError(formatError(err));
      } finally {
        setLoading(false);
      }
    },
    [approvedCopy, approvedImage, brief, setDesignVariant],
  );

  useEffect(() => {
    if (
      approvedCopy &&
      approvedImage &&
      !designVariant &&
      !loading
    ) {
      void runGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCopy = useCallback(async () => {
    if (!designVariant) return;
    await Clipboard.setStringAsync(designVariant.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [designVariant]);

  if (!approvedCopy || !approvedImage) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <Text style={styles.heading}>{t('missing.heading')}</Text>
          <Text style={styles.subtitle}>{t('missing.copyImageMissing')}</Text>
          <Pressable style={styles.submit} onPress={() => navigation.popToTop()}>
            <Text style={styles.submitText}>{t('missing.backToBrief')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('design.backToAudio')}</Text>
        </Pressable>

        <Text style={typeStyle.eyebrow}>{t('design.eyebrow')}</Text>
        <Text style={styles.heading}>{t('design.heading')}</Text>
        <Text style={styles.subtitle}>{t('design.subtitle')}</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void runGenerate()}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        )}

        {loading && !designVariant ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>{t('design.loading')}</Text>
          </View>
        ) : designVariant ? (
          <>
            <View style={styles.rationaleBox}>
              <Text style={styles.rationaleLabel}>{t('design.rationaleLabel')}</Text>
              <Text style={styles.rationaleText}>{designVariant.rationale}</Text>
            </View>

            <View style={styles.codeHeader}>
              <Text style={styles.codeHeaderText}>
                {designVariant.componentName}.tsx
              </Text>
              <Pressable style={styles.copyBtn} onPress={() => void onCopy()}>
                <Text style={styles.copyText}>
                  {copied ? t('design.copied') : t('design.copyCode')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.codeBox}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                style={styles.codeScroll}
              >
                <Text selectable style={styles.code}>
                  {designVariant.code}
                </Text>
              </ScrollView>
            </View>

            <View style={styles.refineBox}>
              <Text style={styles.refineLabel}>{t('design.refineLabel')}</Text>
              <Text style={styles.refineHint}>{t('design.refineHint')}</Text>
              <TextInput
                style={styles.refineInput}
                value={refineText}
                onChangeText={setRefineText}
                placeholder={t('design.refinePlaceholder')}
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
              <Pressable
                style={[
                  styles.refineSubmit,
                  (loading || !refineText.trim()) && styles.disabled,
                ]}
                onPress={() => void runGenerate(refineText.trim())}
                disabled={loading || !refineText.trim()}
              >
                <Text style={styles.refineSubmitText}>
                  {loading ? t('common.generating') : t('common.refine')}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.finishBtn}
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.finishText}>{t('design.finish')}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatError(err: unknown): string {
  const locale = useLocaleStore.getState().locale;
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  if (err instanceof BackendError) {
    if (err.code === 'auth/unauthorized') return t('error.sessionExpired');
    if (err.code === 'cost/cap-exceeded') return t('error.costCap');
    if (err.code === 'config/missing-key') return t('error.missingKey', { key: err.detail ?? '?' });
    if (err.code === 'upstream/auth-failed') return t('error.upstreamAuth');
    if (err.code === 'network') return t('error.network');
  }
  return err instanceof Error ? err.message : String(err);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  missing: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: { fontSize: 13, color: colors.inkSoft, marginBottom: spacing.md },
  heading: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.ink,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 13,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FCE7E5',
    borderColor: '#F4B4B0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13 },
  retry: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderColor: '#F4B4B0',
    borderWidth: 1,
  },
  retryText: { color: colors.error, fontSize: 12, fontWeight: '600' },

  rationaleBox: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rationaleLabel: {
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  rationaleText: { fontSize: 14, color: colors.ink, lineHeight: 21 },

  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codeHeaderText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.inkSoft,
  },
  copyBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  copyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  codeBox: {
    backgroundColor: '#0D1117',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    maxHeight: 400,
  },
  codeScroll: { paddingHorizontal: spacing.xs },
  code: {
    color: '#E6EDF3',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },

  refineBox: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  refineLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  refineHint: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  refineInput: {
    backgroundColor: colors.canvas,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 76,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  refineSubmit: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  refineSubmitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.5 },

  finishBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  finishText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
