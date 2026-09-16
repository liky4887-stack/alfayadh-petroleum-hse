import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput as RNTextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Check, Camera } from 'lucide-react';
import { C } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const ASSET_TYPES = ['Truck', 'Crane', 'Pump', 'Rig', 'Generator', 'Vehicle'];
const STATUSES = ['Active', 'In Maintenance', 'Retired'];

export default function NewAssetScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [assetCode, setAssetCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const haptics = useHapticFeedback();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!assetCode.trim()) e.assetCode = 'Asset ID is required';
    if (!name.trim()) e.name = 'Name is required';
    if (!type) e.type = 'Type is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setToast({ visible: true, msg: 'Permission required to access photos' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!validate()) { haptics.notificationError(); return; }
    haptics.impactMedium();
    setSaving(true);
    const { error } = await supabase.from('assets').insert({
      asset_code: assetCode.trim(),
      name: name.trim(),
      type,
      location: location.trim() || null,
      status: status ?? 'active',
      image_url: imageUri,
    });
    setSaving(false);
    if (error) {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to save asset' });
      return;
    }
    haptics.notificationSuccess();
    setToast({ visible: true, msg: 'Asset created successfully' });
    setTimeout(() => navigation.goBack(), 1200);
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronRight size={22} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>New Asset</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.form}>
          <Field label="Asset ID" required error={errors.assetCode}>
            <Input value={assetCode} onChangeText={setAssetCode} placeholder="e.g. EA-DB08N" />
          </Field>
          <Field label="Name" required error={errors.name}>
            <Input value={name} onChangeText={setName} placeholder="e.g. Fuel Truck #1" />
          </Field>
          <Field label="Type" required error={errors.type}>
            <ChipRow options={ASSET_TYPES} selected={type} onSelect={(v) => { haptics.selection(); setType(v); }} />
          </Field>
          <Field label="Location">
            <Input value={location} onChangeText={setLocation} placeholder="e.g. Kansas" />
          </Field>
          <Field label="Status">
            <ChipRow options={STATUSES} selected={status} onSelect={(v) => { haptics.selection(); setStatus(v); }} />
          </Field>
          <Field label="Photo (optional)">
            <Pressable onPress={pickImage} style={({ pressed }) => [S.imagePicker, pressed && S.btnPressed]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={S.previewImage} />
              ) : (
                <View style={S.imagePlaceholder}>
                  <Camera size={28} color={C.mutedLight} strokeWidth={1.5} />
                  <Text style={S.imagePlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>
          </Field>
        </View>
      </ScrollView>
      <View style={S.footer}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.cancelBtn}>
          <Text style={S.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [S.saveBtn, pressed && S.btnPressed, saving && S.btnDisabled]}>
          <Check size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={S.saveText}>{saving ? 'Saving...' : 'Save Asset'}</Text>
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

function Input({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={S.inputWrap}>
      <RNTextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.mutedLight} style={S.input} />
    </View>
  );
}

function ChipRow({ options, selected, onSelect }: { options: string[]; selected: string | null; onSelect: (v: string) => void }) {
  return (
    <View style={S.chipRow}>
      {options.map((opt) => (
        <Pressable key={opt} onPress={() => onSelect(opt)} style={({ pressed }) => [S.chip, selected === opt && S.chipSelected, pressed && S.btnPressed]}>
          <Text style={[S.chipText, selected === opt && S.chipTextSelected]}>{opt}</Text>
        </Pressable>
      ))}
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
  imagePicker: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.borderLight, minHeight: 160, backgroundColor: '#FFF' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  imagePlaceholderText: { fontSize: 14, fontWeight: '500', color: C.mutedLight },
  previewImage: { width: '100%', height: 160, resizeMode: 'cover' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: '#FFF' },
  cancelBtn: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: C.mutedLight },
  saveBtn: { flex: 1, minHeight: 50, borderRadius: 12, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
});
