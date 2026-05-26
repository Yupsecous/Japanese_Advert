import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, type as typeStyle } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NextStepPlaceholder'>;

// Placeholder for steps that haven't been ported to RN yet. The web app
// has all six steps + Audience Console + Platform exports; the Android
// port lands them step-by-step in later sessions.

const PLANNED: Record<string, string> = {
  image: 'Image generation (tier-aware Flux + per-variant refine)',
  script: 'Script generation (tone-paired variants)',
  audio: 'Audio synthesis (ElevenLabs with timestamps + kinetic captions)',
  design: 'Landing-page design generation',
};

export function NextStepPlaceholderScreen({ navigation, route }: Props) {
  const step = route.params.step;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={typeStyle.eyebrow}>Coming soon</Text>
        <Text style={styles.heading}>The {step} step ports next session</Text>
        <Text style={styles.subtitle}>
          You've reached the end of what landed in v1 of the Android app. The
          full feature parity with the web — image, script, audio, design,
          platform exports, and audience console — ships in subsequent
          sessions.
        </Text>

        <View style={styles.plannedBox}>
          <Text style={styles.plannedLabel}>What this step will do:</Text>
          <Text style={styles.plannedDetail}>{PLANNED[step] ?? step}</Text>
        </View>

        <Pressable
          style={styles.back}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.backText}>Back to brief</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  heading: {
    fontSize: 26,
    fontWeight: '500',
    color: colors.ink,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  plannedBox: {
    backgroundColor: colors.paper,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  plannedLabel: {
    fontSize: 11,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  plannedDetail: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  back: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
