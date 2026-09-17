import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput as RNTextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Camera, X, Check } from '@/lib/icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const CATEGORIES = ['Safety', 'Operations', 'Maintenance', 'Compliance', 'Technical'];

export default function NewCourseScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.cancelled && result.uri) {
      setImageUri(result.uri);
      haptics.notificationSuccess();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      haptics.notificationError();
      setError('Course title is required.');
      return;
    }
    setSaving(true);
    setError(null);

    let thumbnailUrl: string | null = null;
    if (imageUri) {
      thumbnailUrl = await uploadImage(imageUri, 'courses');
    }

    const { error: insertError } = await supabase.from('training_courses').insert({
      title: title.trim(),
      description: description.trim() || null,
      duration: duration.trim() || null,
      category,
      thumbnail_url: thumbnailUrl,
    });

    if (insertError) {
      setError('Failed to save course. Please try again.');
      setSaving(false);
      haptics.notificationError();
      return;
    }

    haptics.notificationSuccess();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.cancelBtn, pressed && S.pressed]}>
          <Text style={S.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={S.headerTitle}>New Course</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.field}>
          <Text style={S.label}>Course Title *</Text>
          <RNTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter course title"
            placeholderTextColor={C.faint}
            style={S.input}
          />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Description</Text>
          <RNTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What will this course cover?"
            placeholderTextColor={C.faint}
            multiline
            style={[S.input, S.textArea]}
          />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Duration</Text>
          <RNTextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g., 45 min"
            placeholderTextColor={C.faint}
            style={S.input}
          />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Category</Text>
          <View style={S.chipWrap}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => { haptics.selection(); setCategory(cat === category ? null : cat); }}
                style={({ pressed }) => [S.chip, category === cat && S.chipSelected, pressed && S.pressed]}
              >
                <Text style={[S.chipText, category === cat && S.chipTextSelected]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={S.field}>
          <Text style={S.label}>Cover Image</Text>
          {imageUri ? (
            <View style={S.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={S.imagePreview} />
              <Pressable onPress={() => { haptics.impactMedium(); setImageUri(null); }} style={S.removeBtn}>
                <X size={16} color="#FFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={({ pressed }) => [S.imageBtn, pressed && S.pressed]}>
              <Camera size={20} color={C.accent} />
              <Text style={S.imageBtnText}>Add Cover Image</Text>
            </Pressable>
          )}
        </View>

        {error && <Text style={S.errorText}>{error}</Text>}

        <Pressable onPress={handleSave} disabled={saving} style={({ pressed }) => [S.saveBtn, pressed && S.pressed, saving && S.saveBtnDisabled]}>
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
            <>
              <Check size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={S.saveBtnText}>Save Course</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.muted },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 22 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: C.ink },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.ink },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF' },
  chipSelected: { backgroundColor: C.accentSoft, borderColor: C.accent },
  chipText: { fontSize: 14, fontWeight: '500', color: C.muted },
  chipTextSelected: { color: C.accent, fontWeight: '700' },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, minHeight: 52 },
  imageBtnText: { fontSize: 15, fontWeight: '600', color: C.accent },
  imagePreviewWrap: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 180, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: C.red, fontSize: 14, fontWeight: '500' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, minHeight: 52 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
