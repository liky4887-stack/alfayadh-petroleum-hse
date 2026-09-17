import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Check, UserRound } from '@/lib/icons';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const PROFILE_KEY = 'user_profile';
const DEPARTMENTS = ['Operations', 'Maintenance', 'Safety', 'Logistics'];

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string | null;
}

const EMPTY: Profile = { fullName: '', email: '', phone: '', jobTitle: '', department: null };

export default function ProfileScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const haptics = useHapticFeedback();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) setProfile(JSON.parse(raw));
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, []);

  const initials = profile.fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.fullName.trim()) e.fullName = 'Full name is required';
    if (!profile.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(profile.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { haptics.notificationError(); return; }
    haptics.impactMedium();
    setSaving(true);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Profile saved' });
    } catch {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to save profile' });
    }
    setSaving(false);
  };

  if (!loaded) return <View style={S.screen} />;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronLeft size={22} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Profile</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.avatarSection}>
          <View style={S.avatarCircle}>
            <Text style={S.avatarText}>{initials}</Text>
          </View>
          <Text style={S.avatarName}>{profile.fullName || 'Your Name'}</Text>
          <Text style={S.avatarSub}>{profile.jobTitle || 'Job Title'}{profile.department ? ` · ${profile.department}` : ''}</Text>
        </View>
        <View style={S.form}>
          <Field label="Full Name" required error={errors.fullName}>
            <Input value={profile.fullName} onChangeText={(v) => setProfile({ ...profile, fullName: v })} placeholder="Enter full name" />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input value={profile.email} onChangeText={(v) => setProfile({ ...profile, email: v })} placeholder="name@company.com" keyboardType="email-address" />
          </Field>
          <Field label="Phone">
            <Input value={profile.phone} onChangeText={(v) => setProfile({ ...profile, phone: v })} placeholder="+974 ..." keyboardType="phone-pad" />
          </Field>
          <Field label="Job Title">
            <Input value={profile.jobTitle} onChangeText={(v) => setProfile({ ...profile, jobTitle: v })} placeholder="e.g. HSE Officer" />
          </Field>
          <Field label="Department">
            <View style={S.chipRow}>
              {DEPARTMENTS.map((dept) => (
                <Pressable
                  key={dept}
                  onPress={() => { haptics.selection(); setProfile({ ...profile, department: dept }); }}
                  style={({ pressed }) => [S.chip, profile.department === dept && S.chipSelected, pressed && S.btnPressed]}
                >
                  <Text style={[S.chipText, profile.department === dept && S.chipTextSelected]}>{dept}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
        </View>
      </ScrollView>
      <View style={S.footer}>
        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [S.saveBtn, pressed && S.btnPressed, saving && S.btnDisabled]}>
          <Check size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={S.saveText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </Pressable>
      </View>
      <Toast message={toast.msg} type="success" visible={toast.visible} onHide={() => setToast({ visible: false, msg: '' })} />
    </SafeAreaView>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View style={S.field}>
      <Text style={S.fieldLabel}>{label}{required ? ' *' : ''}</Text>
      {children}
      {error ? <Text style={S.errorText}>{error}</Text> : null}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType }: { value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' }) {
  return (
    <View style={S.inputWrap}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.mutedLight}
        keyboardType={keyboardType ?? 'default'}
        style={S.input}
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvasAlt },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: '#FFF' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.primary },
  avatarName: { fontSize: 20, fontWeight: '800', color: C.ink },
  avatarSub: { fontSize: 14, fontWeight: '500', color: C.mutedLight },
  form: { gap: 18 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  errorText: { fontSize: 12, fontWeight: '600', color: C.errorLight },
  inputWrap: { borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  input: { fontSize: 15, color: C.ink, paddingVertical: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, backgroundColor: '#FFF' },
  chipSelected: { borderColor: C.primary, backgroundColor: C.primarySoft },
  chipText: { fontSize: 14, fontWeight: '500', color: C.inkLight },
  chipTextSelected: { fontWeight: '700', color: C.primary },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: '#FFF' },
  saveBtn: { minHeight: 50, borderRadius: 12, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
});
