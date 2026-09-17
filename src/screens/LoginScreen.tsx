import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useHapticFeedback } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { Check } from '@/lib/icons';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('loginError'));
      haptics.notificationError();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (signInError) {
        setError(t('loginError'));
        haptics.notificationError();
      } else {
        haptics.notificationSuccess();
        onLogin();
      }
    } catch {
      setError(t('loginError'));
      haptics.notificationError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.body}>
        <View style={S.logoWrap}>
          <Text style={S.brand}>ALFAYADH</Text>
          <Text style={S.subline}>PETROLEUM · HSE</Text>
        </View>
        <View style={S.form}>
          <View style={S.field}>
            <Text style={S.label}>{t('email')}</Text>
            <RNTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="admin@alfayadh.com"
              placeholderTextColor={C.faint}
              autoCapitalize="none"
              keyboardType="email-address"
              style={S.input}
            />
          </View>
          <View style={S.field}>
            <Text style={S.label}>{t('password')}</Text>
            <RNTextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={C.faint}
              secureTextEntry
              style={S.input}
            />
          </View>
          {error && <Text style={S.errorText}>{error}</Text>}
          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={({ pressed }) => [S.signInBtn, pressed && S.pressed, loading && S.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Check size={18} color="#FFF" strokeWidth={2.5} />
                <Text style={S.signInText}>{t('signIn')}</Text>
              </>
            )}
          </Pressable>
          <Text style={S.footerText}>{t('contactAdmin')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  brand: { fontSize: 28, fontWeight: '800', letterSpacing: 2, color: C.ink },
  subline: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.accent, marginTop: 4 },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: C.ink },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.ink,
  },
  errorText: { fontSize: 14, fontWeight: '600', color: C.red },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, minHeight: 52, marginTop: 4,
  },
  signInText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  footerText: { fontSize: 13, fontWeight: '500', color: C.muted, textAlign: 'center', marginTop: 16 },
  pressed: { opacity: 0.7 },
});
