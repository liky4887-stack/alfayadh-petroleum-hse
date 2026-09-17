import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme/theme';
import { useHapticFeedback } from '@/lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useT } from '@/lib/i18n';

const PIN_KEY = 'hse_admin_pin';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30000;

export default function AdminGateScreen({ navigation }: { navigation: any }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [settingUp, setSettingUp] = useState(false);
  const [setupPin, setSetupPin] = useState<string | null>(null);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then((v) => {
      if (!v) setSettingUp(true);
      else setSetupPin(v);
    });
  }, []);

  const handleInput = (index: number, value: string) => {
    if (lockUntil > Date.now()) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError(null);
    if (value && index < 3) refs.current[index + 1]?.focus();
    if (index === 3 && value) checkPin(next.join(''));
  };

  const checkPin = async (entered: string) => {
    if (settingUp) {
      await AsyncStorage.setItem(PIN_KEY, entered);
      haptics.notificationSuccess();
      navigation.replace('AdminPanel');
      return;
    }
    if (entered === setupPin) {
      haptics.notificationSuccess();
      navigation.replace('AdminPanel');
      return;
    }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    haptics.notificationError();
    if (newAttempts >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCKOUT_MS);
      setError(t('lockedOut'));
      setAttempts(0);
      setPin(['', '', '', '']);
      setTimeout(() => { setLockUntil(0); setError(null); }, LOCKOUT_MS);
    } else {
      setError(t('wrongPin'));
      setPin(['', '', '', '']);
      refs.current[0]?.focus();
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.body}>
        <Text style={S.title}>{settingUp ? 'Set Admin PIN' : t('adminGate')}</Text>
        <Text style={S.subtitle}>{settingUp ? 'Choose a 4-digit PIN for admin access' : t('enterPin')}</Text>
        <View style={S.pinRow}>
          {pin.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { refs.current[i] = r; }}
              value={digit}
              onChangeText={(v) => handleInput(i, v.slice(-1))}
              keyboardType="number-pad"
              maxLength={1}
              style={[S.pinBox, error && S.pinBoxError]}
              secureTextEntry
            />
          ))}
        </View>
        {error && <Text style={S.errorText}>{error}</Text>}
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [S.cancelBtn, pressed && S.pressed]}>
          <Text style={S.cancelText}>{t('cancel')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontWeight: '500', color: theme.textDim, textAlign: 'center' },
  pinRow: { flexDirection: 'row', gap: 16, marginTop: 20 },
  pinBox: {
    width: 56, height: 64, borderRadius: 14, borderWidth: 2, borderColor: theme.border,
    backgroundColor: theme.card, fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center',
  },
  pinBoxError: { borderColor: theme.danger },
  errorText: { fontSize: 14, fontWeight: '600', color: theme.danger, textAlign: 'center' },
  cancelBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24 },
  cancelText: { fontSize: 15, fontWeight: '600', color: theme.textDim },
  pressed: { opacity: 0.7 },
});
