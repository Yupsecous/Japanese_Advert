// Catches any uncaught render-time error and shows it on screen so
// release-build crashes are visible. Without this, a thrown error in
// any imported module produces a blank white screen with no clue what
// failed. Strip after the cause is found.

import { Component, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null; info: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    this.setState({ error, info: info.componentStack ?? '' });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.title}>App crashed at startup</Text>
        <Text style={s.subtitle}>{error.name}: {error.message}</Text>
        <Text style={s.label}>Stack</Text>
        <Text style={s.code}>{(error.stack ?? '').slice(0, 4000)}</Text>
        {info ? (
          <>
            <Text style={s.label}>Component stack</Text>
            <Text style={s.code}>{info.slice(0, 2000)}</Text>
          </>
        ) : null}
      </ScrollView>
    );
  }
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FAF6EE' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700', color: '#A8341F', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#0A1834', marginBottom: 16 },
  label: {
    fontSize: 11,
    color: '#465778',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#0A1834',
    lineHeight: 14,
  },
});
