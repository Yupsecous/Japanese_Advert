import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import {
  LOCALE_LABELS,
  LOCALES,
  useLocaleStore,
  useT,
  type Locale,
} from '../i18n';

// Compact language pill that opens a modal of the 6 supported locales.
// Drop into any screen header. Persists per-device via useLocaleStore.

export function LanguagePicker() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={styles.pill}
        onPress={() => setOpen(true)}
        accessibilityLabel={t('common.language')}
      >
        <Text style={styles.pillText}>{locale.toUpperCase()}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.heading}>{t('common.language')}</Text>
            {LOCALES.map((l) => {
              const selected = l === locale;
              return (
                <Pressable
                  key={l}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => {
                    void setLocale(l as Locale);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.code}>{l.toUpperCase()}</Text>
                  <Text style={styles.name}>{LOCALE_LABELS[l]}</Text>
                  {selected && <Text style={styles.tick}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.paper,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,24,52,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '80%',
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowSelected: { backgroundColor: colors.paper },
  code: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
    width: 32,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  tick: { color: colors.success, fontSize: 16, fontWeight: '700' },
});
