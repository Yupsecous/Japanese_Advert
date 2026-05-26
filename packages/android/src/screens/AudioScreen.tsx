import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import { useAppStore } from '../store';
import {
  generateAudio,
  listVoices,
  type VoiceSample,
} from '../services/audioService';
import { BackendError } from '../services/backend';
import { useT, translate, useLocaleStore } from '../i18n';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Audio'>;

export function AudioScreen({ navigation }: Props) {
  const scriptVariants = useAppStore((s) => s.scriptVariants);
  const scriptIndex = useAppStore((s) => s.scriptIndex);
  const audioVariant = useAppStore((s) => s.audioVariant);
  const setAudioVariant = useAppStore((s) => s.setAudioVariant);
  const voiceId = useAppStore((s) => s.voiceId);
  const setVoiceId = useAppStore((s) => s.setVoiceId);
  const t = useT();

  const approvedScript = scriptIndex !== null ? scriptVariants[scriptIndex] : undefined;

  const [voices, setVoices] = useState<VoiceSample[] | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const loadVoices = useCallback(async () => {
    setVoicesError(null);
    setVoicesLoading(true);
    try {
      const list = await listVoices();
      setVoices(list);
      // Auto-pick the first voice if none is persisted yet.
      if (!voiceId && list.length > 0) {
        await setVoiceId(list[0]!.id);
      }
    } catch (err) {
      setVoicesError(formatError(err));
    } finally {
      setVoicesLoading(false);
    }
  }, [voiceId, setVoiceId]);

  useEffect(() => {
    void loadVoices();
    return () => {
      // Tear down playback when leaving the screen.
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVoice = voices?.find((v) => v.id === voiceId) ?? null;

  const onGenerate = useCallback(async () => {
    if (!approvedScript || !voiceId) return;
    setGenerationError(null);
    setGenerating(true);
    // Stop any current playback before regenerating.
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
      setPlaying(false);
      setProgressMs(0);
      setDurationMs(null);
    }
    try {
      const next = await generateAudio({ voiceId, script: approvedScript });
      setAudioVariant(next);
    } catch (err) {
      setGenerationError(formatError(err));
    } finally {
      setGenerating(false);
    }
  }, [approvedScript, voiceId, setAudioVariant]);

  const onPlayPause = useCallback(async () => {
    if (!audioVariant) return;
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }
      if (status.isLoaded) {
        await soundRef.current.playAsync();
        setPlaying(true);
        return;
      }
    }
    // First play — load and start.
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioVariant.audioUrl },
      { shouldPlay: true },
      (status) => {
        if (!status.isLoaded) return;
        if (typeof status.durationMillis === 'number') {
          setDurationMs(status.durationMillis);
        }
        setProgressMs(status.positionMillis);
        if (status.didJustFinish) {
          setPlaying(false);
          setProgressMs(0);
        }
      },
    );
    soundRef.current = sound;
    setPlaying(true);
  }, [audioVariant]);

  if (!approvedScript) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <Text style={styles.heading}>{t('missing.heading')}</Text>
          <Text style={styles.subtitle}>{t('missing.scriptMissing')}</Text>
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
          <Text style={styles.back}>{t('audio.backToScript')}</Text>
        </Pressable>

        <Text style={typeStyle.eyebrow}>{t('audio.eyebrow')}</Text>
        <Text style={styles.heading}>{t('audio.heading')}</Text>
        <Text style={styles.subtitle}>{t('audio.subtitle')}</Text>

        <View style={styles.voiceCard}>
          <View style={styles.voiceCardHead}>
            <Text style={styles.voiceLabel}>{t('audio.voiceLabel')}</Text>
            <Pressable
              style={styles.voicePick}
              onPress={() => setPickerOpen(true)}
              disabled={voicesLoading || !voices}
            >
              <Text style={styles.voicePickText}>
                {voicesLoading
                  ? t('audio.voicePickLoading')
                  : selectedVoice
                    ? selectedVoice.displayName
                    : t('audio.voicePick')}
              </Text>
            </Pressable>
          </View>
          {selectedVoice && (
            <Text style={styles.voiceTone}>{selectedVoice.toneLabel}</Text>
          )}
          {voicesError && <Text style={styles.errorText}>{voicesError}</Text>}
        </View>

        <View style={styles.scriptCard}>
          <Text style={styles.scriptHead}>{approvedScript.toneDescription}</Text>
          <Text style={styles.scriptBody}>{approvedScript.script}</Text>
          <Text style={styles.scriptMeta}>~{approvedScript.durationEstimate}s read</Text>
        </View>

        {generationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generationError}</Text>
          </View>
        )}

        {!audioVariant ? (
          <Pressable
            style={[
              styles.generate,
              (generating || !voiceId) && styles.disabled,
            ]}
            onPress={() => void onGenerate()}
            disabled={generating || !voiceId}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateText}>{t('audio.generate')}</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.player}>
            <Pressable style={styles.playBtn} onPress={() => void onPlayPause()}>
              <Text style={styles.playText}>
                {playing ? t('audio.pause') : t('audio.play')}
              </Text>
            </Pressable>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: durationMs
                      ? `${Math.min(100, (progressMs / durationMs) * 100)}%`
                      : '0%',
                  },
                ]}
              />
            </View>
            <View style={styles.playerRow}>
              <Text style={styles.playerTime}>{formatMs(progressMs)}</Text>
              <Text style={styles.playerTime}>
                {durationMs ? formatMs(durationMs) : '—'}
              </Text>
            </View>

            <Pressable
              style={[styles.regenerate, generating && styles.disabled]}
              onPress={() => void onGenerate()}
              disabled={generating}
            >
              <Text style={styles.regenerateText}>
                {generating ? t('common.generating') : t('audio.regenerate')}
              </Text>
            </Pressable>

            <Pressable
              style={styles.continue}
              onPress={() => navigation.navigate('Design')}
            >
              <Text style={styles.continueText}>{t('audio.continueDesign')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <VoicePickerModal
        open={pickerOpen}
        voices={voices ?? []}
        selectedId={voiceId}
        onClose={() => setPickerOpen(false)}
        onPick={async (id) => {
          await setVoiceId(id);
          setPickerOpen(false);
          // Selecting a different voice clears the existing rendition.
          if (audioVariant && audioVariant.voiceId !== id) {
            setAudioVariant(null);
            if (soundRef.current) {
              await soundRef.current.unloadAsync().catch(() => {});
              soundRef.current = null;
              setPlaying(false);
              setProgressMs(0);
              setDurationMs(null);
            }
          }
        }}
      />
    </SafeAreaView>
  );
}

function VoicePickerModal({
  open,
  voices,
  selectedId,
  onClose,
  onPick,
}: {
  open: boolean;
  voices: VoiceSample[];
  selectedId: string | null;
  onClose: () => void;
  onPick: (id: string) => void | Promise<void>;
}) {
  const t = useT();
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalHeading}>{t('audio.modalHeading')}</Text>
          <Text style={styles.modalSub}>{t('audio.modalSub')}</Text>
          {voices.length === 0 ? (
            <Text style={styles.modalEmpty}>{t('audio.modalEmpty')}</Text>
          ) : (
            <FlatList
              data={voices}
              keyExtractor={(v) => v.id}
              style={styles.voicesList}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    style={[
                      styles.voiceRow,
                      isSelected && styles.voiceRowSelected,
                    ]}
                    onPress={() => void onPick(item.id)}
                  >
                    <Text style={styles.voiceRowName}>{item.displayName}</Text>
                    <Text style={styles.voiceRowTone}>{item.toneLabel}</Text>
                  </Pressable>
                );
              }}
            />
          )}
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>{t('common.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
    if (err.code === 'upstream/no-credits') return t('error.upstreamNoCredits');
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

  voiceCard: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  voiceCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voiceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  voicePick: {
    backgroundColor: colors.canvas,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  voicePickText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  voiceTone: { fontSize: 12, color: colors.inkSoft, marginTop: spacing.xs },

  scriptCard: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scriptHead: {
    fontSize: 12,
    color: colors.accent,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  scriptBody: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  scriptMeta: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.inkFaint,
    textAlign: 'right',
  },

  generate: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  generateText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },

  player: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  playBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  progressTrack: {
    marginTop: spacing.md,
    height: 4,
    backgroundColor: colors.rule,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  playerTime: { fontSize: 11, color: colors.inkSoft, fontVariant: ['tabular-nums'] },
  regenerate: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  regenerateText: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  continue: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  continueText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  errorBox: {
    backgroundColor: '#FCE7E5',
    borderColor: '#F4B4B0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13 },

  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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
    maxHeight: '80%',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  modalSub: { fontSize: 12, color: colors.inkSoft, marginBottom: spacing.md },
  modalEmpty: { color: colors.inkSoft, padding: spacing.md, fontStyle: 'italic' },
  voicesList: { maxHeight: 360 },
  voiceRow: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  voiceRowSelected: { borderColor: colors.brand, borderWidth: 2 },
  voiceRowName: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  voiceRowTone: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  modalClose: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modalCloseText: { color: colors.inkSoft, fontSize: 13 },
});
