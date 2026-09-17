import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput as RNTextInput, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Check, Link2, ClipboardCheck, Camera } from '@/lib/icons';
import { C } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import { uploadImage } from '@/lib/uploadImage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const TYPES = ['Inspection', 'Action', 'Maintenance', 'Training'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

interface Asset {
  id: string;
  asset_code: string;
  name: string;
}

export default function NewActionScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const editMode = route.params?.mode === 'edit';
  const editActionId: string | undefined = route.params?.actionId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assetId, setAssetId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetPickerVisible, setAssetPickerVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const haptics = useHapticFeedback();

  useEffect(() => {
    supabase.from('assets').select('id, asset_code, name').order('name', { ascending: true }).then(({ data, error }: { data: Asset[] | null; error: any }) => {
      if (error) console.error('Asset load error:', error);
      if (data) setAssets(data);
    });
    if (editMode && editActionId) {
      supabase.from('actions').select('*').eq('id', editActionId).maybeSingle().then(({ data }) => {
        if (data) {
          setTitle(data.title ?? '');
          setDescription(data.description ?? '');
          setType(data.type ?? null);
          setPriority(data.priority ?? null);
          setAssignee(data.assignee ?? '');
          setDueDate(data.due_date ?? '');
          setAssetId(data.asset_id ?? null);
          setImageUri(data.image_url ?? null);
        }
      });
    }
  }, [editMode, editActionId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!type) e.type = 'Type is required';
    if (!priority) e.priority = 'Priority is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    haptics.impactMedium();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setToast({ visible: true, msg: 'Permission required to access photos', type: 'error' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  const handleSave = async () => {
    if (!validate()) { haptics.notificationError(); return; }
    haptics.impactMedium();
    setSaving(true);

    let imageUrl: string | null = null;
    if (imageUri) {
      try {
        imageUrl = await uploadImage(imageUri, 'actions');
        if (!imageUrl) {
          setToast({ visible: true, msg: 'Image upload failed', type: 'error' });
          setSaving(false);
          haptics.notificationError();
          return;
        }
      } catch (err) {
        console.error('Image upload exception:', err);
        setToast({ visible: true, msg: 'Image upload failed', type: 'error' });
        setSaving(false);
        haptics.notificationError();
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      priority,
      assignee: assignee.trim() || null,
      due_date: dueDate.trim() || null,
      image_url: imageUrl,
      asset_id: assetId,
    };

    try {
      if (editMode && editActionId) {
        const { error } = await supabase.from('actions').update(payload).eq('id', editActionId);
        setSaving(false);
        if (error) {
          haptics.notificationError();
          setToast({ visible: true, msg: `Failed: ${error.message}`, type: 'error' });
          return;
        }
        await useHSEStore.getState().loadActions();
        haptics.notificationSuccess();
        navigation.replace('ActionDetail', { actionId: editActionId });
      } else {
        const payloadInsert = { ...payload, status: 'todo' };
        const { data, error } = await supabase.from('actions').insert(payloadInsert).select().single();
        setSaving(false);
        if (error) {
          haptics.notificationError();
          setToast({ visible: true, msg: `Failed: ${error.message}`, type: 'error' });
          return;
        }
        await useHSEStore.getState().loadActions();
        haptics.notificationSuccess();
        if (data) {
          navigation.replace('ActionDetail', { actionId: data.id });
        } else {
          navigation.goBack();
        }
      }
    } catch (err) {
      console.error('[NewAction] Save exception:', err);
      setSaving(false);
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to save action', type: 'error' });
    }
  };

  const selectAsset = (asset: Asset) => {
    haptics.impactMedium();
    setAssetId(asset.id);
    setAssetName(`${asset.name} (${asset.asset_code})`);
    setAssetPickerVisible(false);
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>{editMode ? 'Edit Action' : 'New Action'}</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.form}>
          <Field label="Title" required error={errors.title}>
            <Input value={title} onChangeText={setTitle} placeholder="Enter action title" />
          </Field>
          <Field label="Description">
            <Input value={description} onChangeText={setDescription} placeholder="Describe the action..." multiline />
          </Field>
          <Field label="Type" required error={errors.type}>
            <ChipRow options={TYPES} selected={type} onSelect={(v) => { haptics.selection(); setType(v); }} />
          </Field>
          <Field label="Priority" required error={errors.priority}>
            <ChipRow options={PRIORITIES} selected={priority} onSelect={(v) => { haptics.selection(); setPriority(v); }} />
          </Field>
          <Field label="Related Asset">
            <Pressable
              onPress={() => { haptics.impactMedium(); setAssetPickerVisible(true); }}
              style={({ pressed }) => [S.assetPicker, pressed && S.btnPressed]}
            >
              <Link2 size={18} color={assetId ? C.accent : C.mutedLight} strokeWidth={2} />
              <Text style={[S.assetPickerText, assetId ? { color: C.ink } : null]}>{assetName ?? 'Link an asset (optional)'}</Text>
            </Pressable>
          </Field>
          <Field label="Assignee">
            <Input value={assignee} onChangeText={setAssignee} placeholder="Assign to..." />
          </Field>
          <Field label="Due Date (YYYY-MM-DD)">
            <Input value={dueDate} onChangeText={setDueDate} placeholder="2026-12-31" />
          </Field>
          <Field label="Photo (optional)">
            <Pressable onPress={pickImage} style={({ pressed }) => [S.imagePicker, pressed && S.btnPressed]}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, borderRadius: 12 }}
                  resizeMode="cover"
                />
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
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
            <>
              <Check size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={S.saveText}>{editMode ? 'Update' : 'Save Action'}</Text>
            </>
          )}
        </Pressable>
      </View>
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'success' })} />
      <Modal transparent animationType="fade" visible={assetPickerVisible} onRequestClose={() => setAssetPickerVisible(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setAssetPickerVisible(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Select Asset</Text>
            <FlatList
              data={assets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => selectAsset(item)} style={({ pressed }) => [S.modalRow, pressed && S.btnPressed]}>
                  <ClipboardCheck size={18} color={C.accent} strokeWidth={2} />
                  <View style={S.modalRowInfo}>
                    <Text style={S.modalRowTitle}>{item.name}</Text>
                    <Text style={S.modalRowSub}>{item.asset_code}</Text>
                  </View>
                </Pressable>
              )}
              style={{ maxHeight: 350 }}
              ListEmptyComponent={<Text style={S.modalEmpty}>No assets found</Text>}
            />
          </View>
        </Pressable>
      </Modal>
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

function Input({ value, onChangeText, placeholder, multiline }: { value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <View style={[S.inputWrap, multiline && S.inputWrapMulti]}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.mutedLight}
        multiline={multiline}
        style={S.input}
      />
    </View>
  );
}

function ChipRow({ options, selected, onSelect }: { options: string[]; selected: string | null; onSelect: (v: string) => void }) {
  return (
    <View style={S.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onSelect(opt)}
          style={({ pressed }) => [S.chip, selected === opt && S.chipSelected, pressed && S.btnPressed]}
        >
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
  scrollContent: { padding: 20, paddingBottom: 100 },
  form: { gap: 18 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  errorText: { fontSize: 12, fontWeight: '600', color: C.errorLight },
  inputWrap: { borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  inputWrapMulti: { minHeight: 100, alignItems: 'stretch' },
  input: { fontSize: 15, color: C.ink, paddingVertical: 14 },
  assetPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 14, minHeight: 50 },
  assetPickerText: { fontSize: 15, fontWeight: '500', color: C.mutedLight },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, backgroundColor: '#FFF' },
  chipSelected: { borderColor: C.primary, backgroundColor: C.primarySoft },
  chipText: { fontSize: 14, fontWeight: '500', color: C.inkLight },
  chipTextSelected: { fontWeight: '700', color: C.primary },
  imagePicker: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.borderLight, minHeight: 120, backgroundColor: '#FFF' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  imagePlaceholderText: { fontSize: 14, fontWeight: '500', color: C.mutedLight },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  previewText: { fontSize: 14, fontWeight: '600', color: C.accent },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: '#FFF' },
  cancelBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: C.mutedLight },
  saveBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 14 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalRowInfo: { flex: 1 },
  modalRowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  modalRowSub: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  modalEmpty: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center', paddingVertical: 20 },
});
