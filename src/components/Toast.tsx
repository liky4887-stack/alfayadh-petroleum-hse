import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, XCircle } from '@/lib/icons';
import { C } from '@/theme/colors';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = 'success', visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isErr = type === 'error';
  const bg = isErr ? C.errorBg : C.successBg;
  const fg = isErr ? C.errorLight : C.success;
  const Icon = isErr ? XCircle : CheckCircle2;

  return (
    <Animated.View style={[S.wrap, { opacity, backgroundColor: bg, borderColor: `${fg}55` }]}>
      <Icon size={18} color={fg} strokeWidth={2} />
      <Text style={[S.text, { color: fg }]}>{message}</Text>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 100,
    elevation: 5,
  },
  text: { fontSize: 14, fontWeight: '600', flex: 1 },
});
