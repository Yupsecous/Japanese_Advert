import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  formatCostUsd,
  TIER_COST_USD,
  TIER_LATENCY_SECONDS,
  type ImageQualityTier,
  type ImageVariant,
} from '@advert/shared';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import { generateImages } from '../services/imageService';
import { BackendError } from '../services/backend';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Image'>;

const TIERS: ImageQualityTier[] = ['fast', 'balanced', 'realistic'];
const TIER_LABELS: Record<ImageQualityTier, string> = {
  fast: 'Fast',
  balanced: 'Balanced',
  realistic: 'Realistic',
};
const TIER_BLURB: Record<ImageQualityTier, string> = {
  fast: 'Flux Schnell. Cheapest and quickest. The AI look is more visible.',
  balanced: 'Flux Dev. Much cleaner faces, hands, textures. ~8× the cost of Fast.',
  realistic: 'Flux Pro 1.1. Most photorealistic. Best skin, light, materials.',
};

export function ImageScreen({ navigation }: Props) {
  const brief = useAppStore((s) => s.brief);
  const copyVariants = useAppStore((s) => s.copyVariants);
  const copyIndex = useAppStore((s) => s.copyIndex);
  const variants = useAppStore((s) => s.imageVariants);
  const selectedIndex = useAppStore((s) => s.imageIndex);
  const setVariants = useAppStore((s) => s.setImageVariants);
  const appendVariants = useAppStore((s) => s.appendImageVariants);
  const pickImage = useAppStore((s) => s.pickImage);
  const tier = useAppStore((s) => s.imageQualityTier);
  const setTier = useAppStore((s) => s.setImageQualityTier);

  const approvedCopy = copyIndex !== null ? copyVariants[copyIndex] : undefined;

  const [loading, setLoading] = useState<'initial' | 'more' | 'refine' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');
  const [tierModalOpen, setTierModalOpen] = useState(false);

  const runInitial = useCallback(async () => {
    if (!approvedCopy) return;
    setError(null);
    setLoading('initial');
    try {
      const next = await generateImages({
        brief,
        approvedCopy,
        count: 2,
        tier,
      });
      setVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [approvedCopy, brief, tier, setVariants]);

  const runMore = useCallback(async () => {
    if (!approvedCopy) return;
    setError(null);
    setLoading('more');
    try {
      const next = await generateImages({
        brief,
        approvedCopy,
        count: 2,
        tier,
      });
      appendVariants(next);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [approvedCopy, brief, tier, appendVariants]);

  const runRefine = useCallback(async () => {
    const direction = refineText.trim();
    if (!direction || !approvedCopy) return;
    setError(null);
    setLoading('refine');
    try {
      const next = await generateImages({
        brief,
        approvedCopy,
        count: 2,
        refineDirection: direction,
        tier,
      });
      setVariants(next);
      setRefineText('');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(null);
    }
  }, [refineText, approvedCopy, brief, tier, setVariants]);

  useEffect(() => {
    if (approvedCopy && variants.length === 0 && loading === null) {
      void runInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!approvedCopy) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <Text style={styles.heading}>No approved copy</Text>
          <Text style={styles.subtitle}>Pick a copy variant first.</Text>
          <Pressable style={styles.submit} onPress={() => navigation.popToTop()}>
            <Text style={styles.submitText}>Back to brief</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back to copy</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={typeStyle.eyebrow}>Step 2 of 6</Text>
            <Text style={styles.heading}>Pick your hero image</Text>
          </View>
          <Pressable
            style={[styles.tierBadge, tierBadgeStyle(tier)]}
            onPress={() => setTierModalOpen(true)}
          >
            <Text style={styles.tierBadgeText}>
              {TIER_LABELS[tier]} · {formatCostUsd(TIER_COST_USD[tier])}/img
            </Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Photoreal cues baked into every prompt. Tap a card to approve and
          continue.
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void runInitial()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {loading === 'initial' && variants.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>
              Generating images at {TIER_LABELS[tier]} tier
              {' '}(~{TIER_LATENCY_SECONDS[tier]}s)…
            </Text>
          </View>
        ) : (
          variants.map((v, i) => (
            <ImageCard
              key={v.id}
              variant={v}
              index={i}
              total={variants.length}
              selected={selectedIndex === i}
              onPick={() => {
                pickImage(i);
                navigation.navigate('Script');
              }}
            />
          ))
        )}

        {variants.length > 0 && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.more, loading !== null && styles.disabled]}
              onPress={() => void runMore()}
              disabled={loading !== null}
            >
              <Text style={styles.moreText}>
                {loading === 'more' ? 'Generating…' : 'Show more variants'}
              </Text>
            </Pressable>

            <View style={styles.refineBox}>
              <Text style={styles.refineLabel}>Refine</Text>
              <Text style={styles.refineHint}>
                Plain English. e.g. "more cinematic", "lighter background, more
                energy".
              </Text>
              <TextInput
                style={styles.refineInput}
                value={refineText}
                onChangeText={setRefineText}
                placeholder="Tell the director what to change"
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                editable={loading !== 'refine'}
              />
              <Pressable
                style={[
                  styles.refineSubmit,
                  (loading !== null || !refineText.trim()) && styles.disabled,
                ]}
                onPress={() => void runRefine()}
                disabled={loading !== null || !refineText.trim()}
              >
                <Text style={styles.refineSubmitText}>
                  {loading === 'refine' ? 'Refining…' : 'Refine'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <TierPickerModal
        open={tierModalOpen}
        current={tier}
        onClose={() => setTierModalOpen(false)}
        onPick={(t) => {
          void setTier(t);
          setTierModalOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function ImageCard({
  variant,
  index,
  total,
  selected,
  onPick,
}: {
  variant: ImageVariant;
  index: number;
  total: number;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Image
        source={{ uri: variant.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardEyebrow}>
          Option {index + 1} of {total}
        </Text>
        <Pressable style={styles.pick} onPress={onPick}>
          <Text style={styles.pickText}>
            {selected ? 'Selected ✓' : 'Pick this'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function TierPickerModal({
  open,
  current,
  onClose,
  onPick,
}: {
  open: boolean;
  current: ImageQualityTier;
  onClose: () => void;
  onPick: (t: ImageQualityTier) => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalHeading}>Image quality tier</Text>
          <Text style={styles.modalSub}>
            Higher tiers use better Flux models — visibly more photorealistic
            at higher cost. Saved per-device.
          </Text>
          {TIERS.map((t) => {
            const isCurrent = t === current;
            return (
              <Pressable
                key={t}
                style={[styles.tierOption, isCurrent && styles.tierOptionSelected]}
                onPress={() => onPick(t)}
              >
                <View style={styles.tierOptionHeader}>
                  <Text style={styles.tierOptionTitle}>{TIER_LABELS[t]}</Text>
                  <Text style={styles.tierOptionCost}>
                    {formatCostUsd(TIER_COST_USD[t])}/img · ~{TIER_LATENCY_SECONDS[t]}s
                  </Text>
                </View>
                <Text style={styles.tierOptionBlurb}>{TIER_BLURB[t]}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function tierBadgeStyle(t: ImageQualityTier) {
  if (t === 'realistic') return { borderColor: '#3CA77A', backgroundColor: '#E6F5EE' };
  if (t === 'balanced') return { borderColor: '#5FA8D3', backgroundColor: '#E6F0F8' };
  return { borderColor: colors.rule, backgroundColor: colors.paper };
}

function formatError(err: unknown): string {
  if (err instanceof BackendError) {
    if (err.code === 'auth/unauthorized') return 'Session expired. Sign in again.';
    if (err.code === 'cost/cap-exceeded') return 'Daily cost cap reached.';
    if (err.code === 'config/missing-key') return `Backend missing API key (${err.detail ?? '?'}).`;
    if (err.code === 'upstream/no-credits') return 'fal.ai account is out of credits.';
    if (err.code === 'upstream/auth-failed') return 'fal.ai key was rejected by the provider.';
    if (err.code === 'upstream/rate-limit') return 'fal.ai rate-limited. Wait a moment.';
    if (err.code === 'network') return 'Could not reach the backend.';
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: { flex: 1 },
  heading: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.ink,
    marginTop: spacing.xs,
  },
  tierBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  tierBadgeText: { fontSize: 11, color: colors.ink, fontWeight: '600' },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: spacing.sm, color: colors.inkSoft, fontSize: 13 },
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
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardSelected: { borderColor: colors.success, borderWidth: 2 },
  image: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.canvas },
  cardBody: { padding: spacing.md },
  cardEyebrow: {
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  pick: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pickText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actions: { marginTop: spacing.sm },
  more: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.paper,
    marginBottom: spacing.md,
  },
  moreText: { color: colors.ink, fontSize: 14, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  refineBox: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
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

  // Tier picker modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,24,52,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  modalSub: { fontSize: 12, color: colors.inkSoft, marginBottom: spacing.md },
  tierOption: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tierOptionSelected: { borderColor: colors.brand, borderWidth: 2 },
  tierOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tierOptionTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  tierOptionCost: { fontSize: 11, color: colors.inkSoft, fontWeight: '600' },
  tierOptionBlurb: { fontSize: 12, color: colors.inkSoft, lineHeight: 18 },
  modalClose: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modalCloseText: { color: colors.inkSoft, fontSize: 13 },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
