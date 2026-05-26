import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScriptVariant } from '@advert/shared';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { generateScript } from '../services/scriptService';
import { BackendError } from '../services/backend';
import { useT, translate, useLocaleStore } from '../i18n';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Script'>;

export function ScriptScreen({ navigation }: Props) {
  const brief = useAppStore((s) => s.brief);
  const copyVariants = useAppStore((s) => s.copyVariants);
  const copyIndex = useAppStore((s) => s.copyIndex);
  const imageVariants = useAppStore((s) => s.imageVariants);
  const imageIndex = useAppStore((s) => s.imageIndex);
  const variants = useAppStore((s) => s.scriptVariants);
  const selectedIndex = useAppStore((s) => s.scriptIndex);
  const setVariants = useAppStore((s) => s.setScriptVariants);
  const appendVariants = useAppStore((s) => s.appendScriptVariants);
  const pickScript = useAppStore((s) => s.pickScript);
  const t = useT();

  const approvedCopy = copyIndex !== null ? copyVariants[copyIndex] : undefined;
  const approvedImage = imageIndex !== null ? imageVariants[imageIndex] : undefined;

  const [loading, setLoading] = useState<'initial' | 'more' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runInitial = useCallback(async () => {
    if (!approvedCopy || !approvedImage) return;
    setError(null);
    setLoading('initial');
    try {
      const next = await generateScript({
        brief,
        approvedCopy,
        approvedImage,
        count: 2,
      });
      setVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [approvedCopy, approvedImage, brief, setVariants]);

  const runMore = useCallback(async () => {
    if (!approvedCopy || !approvedImage) return;
    setError(null);
    setLoading('more');
    try {
      const next = await generateScript({
        brief,
        approvedCopy,
        approvedImage,
        count: 2,
      });
      appendVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [approvedCopy, approvedImage, brief, appendVariants]);

  useEffect(() => {
    if (approvedCopy && approvedImage && variants.length === 0 && loading === null) {
      void runInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Text style={styles.back}>{t('script.backToImage')}</Text>
        </Pressable>

        <Text style={typeStyle.eyebrow}>{t('script.eyebrow')}</Text>
        <Text style={styles.heading}>{t('script.heading')}</Text>
        <Text style={styles.subtitle}>{t('script.subtitle')}</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void runInitial()}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        )}

        {loading === 'initial' && variants.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>{t('script.loading')}</Text>
          </View>
        ) : (
          variants.map((v, i) => (
            <ScriptCard
              key={v.id}
              variant={v}
              index={i}
              total={variants.length}
              selected={selectedIndex === i}
              onPick={() => {
                pickScript(i);
                navigation.navigate('Audio');
              }}
            />
          ))
        )}

        {variants.length > 0 && (
          <Pressable
            style={[styles.more, loading !== null && styles.disabled]}
            onPress={() => void runMore()}
            disabled={loading !== null}
          >
            <Text style={styles.moreText}>
              {loading === 'more' ? t('common.generating') : t('common.showMore')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScriptCard({
  variant,
  index,
  total,
  selected,
  onPick,
}: {
  variant: ScriptVariant;
  index: number;
  total: number;
  selected: boolean;
  onPick: () => void;
}) {
  const t = useT();
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardEyebrow}>
          {t('common.option', { n: index + 1, total })}
        </Text>
        <Text style={styles.duration}>
          {t('script.duration', { seconds: variant.durationEstimate })}
        </Text>
      </View>
      <Text style={styles.tone}>{variant.toneDescription}</Text>
      <Text style={styles.script}>{variant.script}</Text>
      <Pressable style={styles.pick} onPress={onPick}>
        <Text style={styles.pickText}>
          {selected ? t('common.selected') : t('common.pickThis')}
        </Text>
      </Pressable>
    </View>
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
  loadingText: { marginTop: spacing.sm, color: colors.inkSoft },
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
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderColor: colors.rule,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardSelected: { borderColor: colors.success, borderWidth: 2 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardEyebrow: {
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  duration: { fontSize: 11, color: colors.inkSoft, fontWeight: '600' },
  tone: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  script: {
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  pick: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pickText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  more: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  disabled: { opacity: 0.5 },
  moreText: { color: colors.ink, fontSize: 14, fontWeight: '500' },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
