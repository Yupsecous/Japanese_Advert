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
import type { CopyVariant } from '@advert/shared';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { generateCopy } from '../services/copyService';
import { BackendError } from '../services/backend';
import { useT, translate, useLocaleStore } from '../i18n';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Copy'>;

export function CopyScreen({ navigation }: Props) {
  const brief = useAppStore((s) => s.brief);
  const variants = useAppStore((s) => s.copyVariants);
  const selectedIndex = useAppStore((s) => s.copyIndex);
  const setVariants = useAppStore((s) => s.setCopyVariants);
  const appendVariants = useAppStore((s) => s.appendCopyVariants);
  const pickCopy = useAppStore((s) => s.pickCopy);
  const t = useT();

  const [loading, setLoading] = useState<'initial' | 'more' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runInitial = useCallback(async () => {
    setError(null);
    setLoading('initial');
    try {
      const next = await generateCopy({ brief, count: 2 });
      setVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [brief, setVariants]);

  const runMore = useCallback(async () => {
    setError(null);
    setLoading('more');
    try {
      const next = await generateCopy({ brief, count: 2 });
      appendVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [brief, appendVariants]);

  useEffect(() => {
    if (variants.length === 0 && loading === null) {
      void runInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('copy.backToBrief')}</Text>
        </Pressable>

        <Text style={typeStyle.eyebrow}>{t('copy.eyebrow')}</Text>
        <Text style={styles.heading}>{t('copy.heading')}</Text>
        <Text style={styles.subtitle}>{t('copy.subtitle')}</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retry}
              onPress={() => void runInitial()}
            >
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        )}

        {loading === 'initial' && variants.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>{t('copy.loading')}</Text>
          </View>
        ) : (
          variants.map((v, i) => (
            <CopyCard
              key={v.id}
              variant={v}
              index={i}
              total={variants.length}
              selected={selectedIndex === i}
              onPick={() => {
                pickCopy(i);
                navigation.navigate('Image');
              }}
            />
          ))
        )}

        {variants.length > 0 && (
          <Pressable
            style={[styles.more, loading !== null && styles.moreDisabled]}
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

function CopyCard({
  variant,
  index,
  total,
  selected,
  onPick,
}: {
  variant: CopyVariant;
  index: number;
  total: number;
  selected: boolean;
  onPick: () => void;
}) {
  const t = useT();
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Text style={styles.cardEyebrow}>
        {t('common.option', { n: index + 1, total })}
      </Text>
      <Text style={styles.headline}>{variant.headline}</Text>
      <Text style={styles.caption}>{variant.caption}</Text>
      <View style={styles.ctaRow}>
        <Text style={styles.ctaPill}>{variant.cta}</Text>
      </View>
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
  back: {
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.md,
  },
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
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
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
  cardSelected: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  cardEyebrow: {
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  caption: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  ctaRow: { flexDirection: 'row', marginBottom: spacing.md },
  ctaPill: {
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: 12,
    color: colors.ink,
    fontWeight: '600',
  },
  pick: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pickText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  more: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  moreDisabled: { opacity: 0.5 },
  moreText: { color: colors.ink, fontSize: 14, fontWeight: '500' },
});
