import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from '@/lib/icons';
import { C } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function AdminLoginScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'error' as 'success' | 'error' });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Email and password are required', type: 'error' });
      return;
    }
    haptics.impactMedium();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (authError || !authData.user) {
        haptics.notificationError();
        setToast({ visible: true, msg: 'Invalid email or password', type: 'error' });
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (roleData?.role !== 'admin') {
        haptics.notificationError();
        setToast({ visible: true, msg: 'Access denied. Admin only.', type: 'error' });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('admin_session', 'true');
      haptics.notificationSuccess();
      setLoading(false);
      navigation.replace('AdminPanel');
    } catch (err) {
      console.error('Admin login error:', err);
      haptics.notificationError();
      setToast({ visible: true, msg: 'Login failed. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Admin Login</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={S.body}>
        <View style={S.formCard}>
          <View style={S.field}>
            <Text style={S.fieldLabel}>Email *</Text>
            <View style={S.inputWrap}>
              <RNTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@alfayadh.com"
                placeholderTextColor={C.mutedLight}
                keyboardType="email-address"
                autoCapitalize="none"
                style={S.input}
              />
            </View>
          </View>
          <View style={S.field}>
            <Text style={S.fieldLabel}>Password *</Text>
            <View style={S.inputWrap}>
              <RNTextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={C.mutedLight}
                secureTextEntry
                style={S.input}
              />
            </View>
          </View>
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [S.loginBtn, pressed && S.btnPressed, loading && S.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={S.loginText}>Sign In</Text>
            )}
          </Pressable>
        </View>
        <Text style={S.footerText}>Contact your HSE administrator for access.</Text>
      </View>
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'error' })} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  formCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 24, gap: 20 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  inputWrap: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  input: { fontSize: 15, color: C.ink, paddingVertical: 14 },
  loginBtn: { minHeight: 48, borderRadius: 12, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loginText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  footerText: { fontSize: 13, fontWeight: '400', color: C.mutedLight, marginTop: 24, textAlign: 'center' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
});
