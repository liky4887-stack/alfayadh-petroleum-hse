import { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '@/theme/colors';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong' };
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={S.screen}>
        <View style={S.card}>
          <Text style={S.emoji}>⚠</Text>
          <Text style={S.title}>Something went wrong</Text>
          <Text style={S.message} numberOfLines={4}>{this.state.message}</Text>
          <Pressable onPress={this.handleReload} style={({ pressed }) => [S.btn, pressed && S.pressed]}>
            <Text style={S.btnText}>Reload</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.border, width: '100%' },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '800', color: C.ink },
  message: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center', lineHeight: 20 },
  btn: { backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14, marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
