import { useState, useCallback, useRef, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const haptics = useHapticFeedback();

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    haptics.impactMedium();
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, [haptics]);

  const handleConfirm = useCallback(() => {
    if (!state) return;
    haptics.notificationSuccess();
    state.resolve(true);
    setState(null);
  }, [state, haptics]);

  const handleCancel = useCallback(() => {
    if (!state) return;
    haptics.impactMedium();
    state.resolve(false);
    setState(null);
  }, [state, haptics]);

  const dialog = state ? (
    <Modal transparent animationType="fade" visible onRequestClose={handleCancel}>
      <View style={S.overlay}>
        <View style={S.card}>
          <Text style={S.title}>{state.title}</Text>
          <Text style={S.message}>{state.message}</Text>
          <View style={S.btnRow}>
            <Pressable onPress={handleCancel} style={({ pressed }) => [S.cancelBtn, pressed && S.pressed]}>
              <Text style={S.cancelText}>{state.cancelLabel ?? 'Cancel'}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                S.confirmBtn,
                state.destructive ? S.destructiveBtn : S.normalBtn,
                pressed && S.pressed,
              ]}
            >
              <Text style={S.confirmText}>{state.confirmLabel ?? 'Confirm'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  ) : null;

  return { confirm, dialog };
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', gap: 14 },
  title: { fontSize: 18, fontFamily: 'Chevalon-ExtraBold', color: C.ink },
  message: { fontSize: 15, fontFamily: 'Chevalon-Medium', color: C.muted, lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  destructiveBtn: { backgroundColor: C.red },
  normalBtn: { backgroundColor: C.accent },
  confirmText: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#FFF' },
  pressed: { opacity: 0.7 },
});
