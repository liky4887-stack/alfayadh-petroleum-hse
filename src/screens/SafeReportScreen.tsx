import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, X } from '@/lib/icons';
import { Dark } from '@/theme/colors';
import { useHSEStore } from '@/lib/store';
import { uploadImage } from '@/lib/uploadImage';
import { useHapticFeedback } from '@/lib/haptics';
import { Button, TextInput } from '@/components/ui';
import { Header } from '@/components/Header';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function SafeReportScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { submitReport } = useHSEStore();
  const haptics = useHapticFeedback();

  const pickImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'يلزم إذن الوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.cancelled && result.uri) {
      setImageUri(result.uri);
      haptics.notificationSuccess();
    }
  };

  const handleSubmit = async () => {
    if (!note.trim()) {
      haptics.notificationError();
      Alert.alert('تنبيه', 'يرجى إدخال ملاحظة قبل الإرسال');
      return;
    }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadImage(imageUri, 'reports');
    }
    const result = await submitReport({
      type: 'safe',
      note: note.trim(),
      image_url: imageUrl,
      status: 'closed',
    });
    setSubmitting(false);

    if (result.success) {
      haptics.notificationSuccess();
      Alert.alert(
        result.offline ? 'تم الحفظ محلياً' : 'شكراً لك!',
        result.offline
          ? 'تم حفظ الملاحظة. سيتم المزامنة عند عودة الاتصال.'
          : 'تم توثيق الملاحظة الإيجابية وإرسالها لمسؤول السلامة.'
      );
      navigation.navigate('Dashboard');
    } else {
      haptics.notificationError();
      Alert.alert('خطأ', 'تعذر إرسال التقرير. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="تقرير وضع آمن" currentScreen="SafeReport" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View>
            <Text style={S.label}>توثيق وضع آمن</Text>
            <Text style={S.desc}>سجّل سلوكاً أو حالة آمنة أثارت انتباهك في الميدان. هذه الملاحظات تساعد في تعزيز ثقافة السلامة.</Text>
          </View>
          <View style={S.field}>
            <Text style={S.fieldLabel}>الملاحظة *</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="صف السلوك أو الحالة الآمنة التي لاحظتها..."
              multiline
              numberOfLines={4}
            />
          </View>

          {imageUri ? (
            <View style={S.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={S.imagePreview} />
              <Pressable onPress={() => { haptics.impactMedium(); setImageUri(null); }} style={S.removeImageBtn}>
                <X size={16} color="#FFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={({ pressed }) => [S.cameraBtn, pressed && S.pressed]}>
              <Camera size={20} color={Dark.steel} />
              <Text style={S.cameraText}>إرفاق صورة (اختياري)</Text>
            </Pressable>
          )}

          <Button
            label={submitting ? 'جاري الإرسال...' : 'إرسال التقرير'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            disabled={submitting}
            icon={<Check size={18} color={Dark.offWhite} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dark.obsidian },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 24 },
  label: { color: Dark.emerald, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  desc: { color: Dark.steel, fontSize: 14, lineHeight: 24 },
  field: { gap: 10 },
  fieldLabel: { color: Dark.steel, fontSize: 13, fontWeight: '600' },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: Dark.graphite,
    borderRadius: 10, backgroundColor: Dark.slate,
    minHeight: 48,
  },
  cameraText: { color: Dark.steel, fontSize: 14 },
  imagePreviewWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
});
