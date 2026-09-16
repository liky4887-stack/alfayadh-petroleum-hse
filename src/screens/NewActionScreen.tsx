import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Check } from '@/lib/icons';
import { C } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const TYPES = ['Inspection', 'Action', 'Maintenance', 'Training'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function NewActionScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const haptics = useHapticFeedback();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!type) e.type = 'Type is required';
    if (!priority) e.priority = 'Priority is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { haptics.notificationError(); return; }
    haptics.impactMedium();
    setSaving(true);
    const { error } = await supabase.from('actions').insert({
      title: title.trim(),
      description: description.trim() || null,
      type,
      priority,
      assignee: assignee.trim() || null,
      due_date: dueDate.trim() || null,
      status: 'todo',
    });
    setSaving(false);
    if (error) {
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to save action' });
      return;
    }
    haptics.notificationSuccess();
    setToast({ visible: true, msg: 'Action created successfully' });
    setTimeout(() => navigation.goBack(), 1200);
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronRight size={22} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>New Action</Text>
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
          <Field label="Assignee">
            <Input value={assignee} onChangeText={setAssignee} placeholder="Assign to..." />
          </Field>
          <Field label="Due Date (YYYY-MM-DD)">
            <Input value={dueDate} onChangeText={setDueDate} placeholder="2026-12-31" />
          </Field>
        </View>
      </ScrollView>
      <View style={S.footer}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.cancelBtn}>
          <Text style={S.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [S.saveBtn, pressed && S.btnPressed, saving && S.btnDisabled]}>
          <Check size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={S.saveText}>{saving ? 'Saving...' : 'Save Action'}</Text>
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
  scrollContent: { padding: 20 },
  form: { gap: 18 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  errorText: { fontSize: 12, fontWeight: '600', color: C.errorLight },
  inputWrap: { borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: '#FFF', paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  inputWrapMulti: { minHeight: 100, alignItems: 'stretch' },
  input: { fontSize: 15, color: C.ink, paddingVertical: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: C.borderLight, backgroundColor: '#FFF' },
  chipSelected: { borderColor: C.primary, backgroundColor: C.primarySoft },
  chipText: { fontSize: 14, fontWeight: '500', color: C.inkLight },
  chipTextSelected: { fontWeight: '700', color: C.primary },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: '#FFF' },
  cancelBtn: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: C.mutedLight },
  saveBtn: { flex: 1, minHeight: 50, borderRadius: 12, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
});
