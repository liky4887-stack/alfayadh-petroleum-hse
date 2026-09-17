import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, AlertTriangle, AlertOctagon, ChevronLeft, X } from '@/lib/icons';
import { Dark } from '@/theme/colors';
import { DEPARTMENTS, DEPARTMENT_KEYS } from '@/lib/types';
import type { ReportType, ReportStatus } from '@/lib/types';
import { useHSEStore } from '@/lib/store';
import { uploadImage } from '@/lib/uploadImage';
import { useHapticFeedback } from '@/lib/haptics';
import { Button, Chip, TextInput } from '@/components/ui';
import { Header } from '@/components/Header';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const TOTAL_STEPS = 5;

export default function UnsafeReportScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [step, setStep] = useState(0);
  const [classification, setClassification] = useState<ReportType | null>(null);
  const [note, setNote] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { submitReport } = useHSEStore();
  const haptics = useHapticFeedback();

  const handleClassification = (type: ReportType) => {
    haptics.impactMedium();
    setClassification(type);
    setStep(1);
  };

  const handleLocation = async () => {
    haptics.selection();
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setLocation({ lat: 25.0667, lng: 50.8000 });
        haptics.notificationSuccess();
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      haptics.notificationSuccess();
    } catch {
      setLocation({ lat: 25.0667, lng: 50.8000 });
      haptics.notificationSuccess();
    }
  };

  const handleImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'يلزم إذن الوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      haptics.notificationSuccess();
    }
  };
  const handleDepartment = (dept: string) => { haptics.selection(); setDepartment(dept); setSubcategory(null); };
  const handleSubcategory = (sub: string) => { haptics.selection(); setSubcategory(sub); };
  const handleStatus = (s: ReportStatus) => { haptics.impactMedium(); setStatus(s); };

  const canProceed = () => {
    if (step === 1) return note.trim().length > 0;
    if (step === 2) return department !== null;
    if (step === 3) return subcategory !== null;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) { haptics.notificationError(); return; }
    haptics.impactMedium();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    haptics.impactMedium();
    if (step === 0) { navigation.navigate('Dashboard'); }
    else { setStep((s) => s - 1); }
  };

  const handleSubmit = async () => {
    if (!classification || !note.trim() || !department || !subcategory || !status) {
      haptics.notificationError();
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadImage(imageUri, 'reports');
    }
    const result = await submitReport({
      type: classification,
      note: note.trim(),
      corrective_action: correctiveAction.trim() || null,
      image_url: imageUrl,
      department,
      subcategory,
      status,
      location_lat: location?.lat ?? null,
      location_lng: location?.lng ?? null,
    });
    setSubmitting(false);

    if (result.success) {
      if (status === 'open') {
        haptics.notificationError();
        Alert.alert('تنبيه: تقرير مفتوح', 'تم تسجيل التقرير كحالة مفتوحة تحتاج تدخلاً. تم إرسال إشعار للجهات المعنية.',
          [{ text: 'حسناً', onPress: () => navigation.navigate('Dashboard') }]);
      } else {
        haptics.notificationSuccess();
        Alert.alert('تم الإرسال', result.offline ? 'تم حفظ التقرير محلياً. سيتم المزامنة عند عودة الاتصال.' : 'تم توثيق التقرير وإغلاقه.',
          [{ text: 'حسناً', onPress: () => navigation.navigate('Dashboard') }]);
      }
    } else {
      haptics.notificationError();
      Alert.alert('خطأ', 'تعذر إرسال التقرير. يرجى المحاولة مرة أخرى.');
    }
  };

  const stepLabels = ['التصنيف', 'التفاصيل', 'القسم', 'التصنيف الفرعي', 'الحالة'];

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="تقرير وضع غير آمن" currentScreen="UnsafeReport" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View style={S.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[S.progressBar, { backgroundColor: i <= step ? Dark.emerald : Dark.graphite }]} />
            ))}
          </View>
          <Text style={S.stepLabel}>الخطوة {step + 1} من {TOTAL_STEPS} — {stepLabels[step]}</Text>

          {step === 0 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>اختر نوع التقرير</Text>
              <Pressable onPress={() => handleClassification('unsafe_condition')} style={({ pressed }) => [S.classifyBtn, { borderColor: Dark.red }, pressed && S.pressed]}>
                <AlertOctagon size={24} color={Dark.red} />
                <View style={S.classifyText}>
                  <Text style={S.classifyTitleRed}>حالة غير آمنة</Text>
                  <Text style={S.classifySub}>ظرف أو وضع مادي يشكل خطراً</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => handleClassification('unsafe_act')} style={({ pressed }) => [S.classifyBtn, { borderColor: Dark.red }, pressed && S.pressed]}>
                <AlertTriangle size={24} color={Dark.red} />
                <View style={S.classifyText}>
                  <Text style={S.classifyTitleRed}>تصرف غير آمن</Text>
                  <Text style={S.classifySub}>سلوك بشري يخالف إجراءات السلامة</Text>
                </View>
              </Pressable>
            </View>
          )}

          {step === 1 && (
            <View style={S.stepContent}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>الملاحظة *</Text>
                <TextInput value={note} onChangeText={setNote} placeholder="صف الحالة أو التصرف غير الآمن بالتفصيل..." multiline numberOfLines={4} />
              </View>
              <View style={S.field}>
                <Text style={S.fieldLabel}>الإجراء التصحيحي</Text>
                <TextInput value={correctiveAction} onChangeText={setCorrectiveAction} placeholder="ما الإجراء المتخذ أو المطلوب؟" multiline numberOfLines={3} />
              </View>
              <View style={S.rowBtns}>
                <Pressable onPress={handleImage} style={({ pressed }) => [S.toggleBtn, { borderColor: imageUri ? Dark.emerald : Dark.graphite, backgroundColor: imageUri ? Dark.emeraldBg : Dark.slate }, pressed && S.pressed]}>
                  <Camera size={18} color={imageUri ? Dark.emerald : Dark.steel} />
                  <Text style={[S.toggleText, { color: imageUri ? Dark.emerald : Dark.steel }]}>{imageUri ? 'تم الإرفاق' : 'إرفاق صورة'}</Text>
                </Pressable>
                <Pressable onPress={handleLocation} style={({ pressed }) => [S.toggleBtn, { borderColor: location ? Dark.emerald : Dark.graphite, backgroundColor: location ? Dark.emeraldBg : Dark.slate }, pressed && S.pressed]}>
                  <MapPin size={18} color={location ? Dark.emerald : Dark.steel} />
                  <Text style={[S.toggleText, { color: location ? Dark.emerald : Dark.steel }]}>{location ? 'تم التحديد' : 'تحديد الموقع'}</Text>
                </Pressable>
              </View>
              {imageUri && (
                <View style={S.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={S.imagePreview} />
                  <Pressable onPress={() => { haptics.impactMedium(); setImageUri(null); }} style={S.removeImageBtn}>
                    <X size={16} color="#FFF" strokeWidth={2.5} />
                  </Pressable>
                </View>
              )}
              {location && (
                <Text style={S.coords}>الإحداثيات: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>اختر القسم المسؤول</Text>
              <View style={S.chipWrap}>
                {DEPARTMENT_KEYS.map((dept) => (
                  <Chip key={dept} label={dept} selected={department === dept} onPress={() => handleDepartment(dept)} />
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>التصنيف الفرعي — {department}</Text>
              {department && DEPARTMENTS[department] && (
                <View style={S.chipWrap}>
                  {DEPARTMENTS[department].map((sub) => (
                    <Chip key={sub} label={sub} selected={subcategory === sub} onPress={() => handleSubcategory(sub)} />
                  ))}
                </View>
              )}
            </View>
          )}

          {step === 4 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>حالة التقرير</Text>
              <Pressable onPress={() => handleStatus('closed')} style={({ pressed }) => [S.statusBtn, { borderColor: status === 'closed' ? Dark.green : Dark.graphite, backgroundColor: status === 'closed' ? Dark.greenBg : Dark.slate }, pressed && S.pressed]}>
                <Text style={[S.statusTitle, { color: status === 'closed' ? Dark.green : Dark.offWhite }]}>مغلقة (تم الحل ميدانياً)</Text>
                <Text style={S.statusSub}>تم اتخاذ الإجراء اللازم وتم الحل في الموقع</Text>
              </Pressable>
              <Pressable onPress={() => handleStatus('open')} style={({ pressed }) => [S.statusBtn, { borderColor: status === 'open' ? Dark.red : Dark.graphite, backgroundColor: status === 'open' ? Dark.redBg : Dark.slate }, pressed && S.pressed]}>
                <Text style={[S.statusTitle, { color: status === 'open' ? Dark.red : Dark.offWhite }]}>مفتوحة (تحتاج تدخل)</Text>
                <Text style={S.statusSub}>الحالة مستمرة وتتطلب إجراءً من الجهة المعنية</Text>
              </Pressable>
            </View>
          )}

          <View style={S.navBtns}>
            <Pressable onPress={handleBack} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
              <ChevronLeft size={20} color={Dark.steel} />
              <Text style={S.backText}>{step === 0 ? 'إلغاء' : 'السابق'}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            {step < TOTAL_STEPS - 1 ? (
              <Button label="التالي" onPress={handleNext} variant="primary" disabled={!canProceed()} />
            ) : (
              <Button label={submitting ? 'جاري الإرسال...' : 'إرسال التقرير'} onPress={handleSubmit} variant="danger" disabled={submitting || !status} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dark.obsidian },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 20 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: { color: Dark.steel, fontSize: 12, fontWeight: '600' },
  stepContent: { gap: 16 },
  stepTitle: { color: Dark.offWhite, fontSize: 18, fontWeight: '700' },
  classifyBtn: { borderWidth: 1, backgroundColor: Dark.slate, borderRadius: 12, padding: 22, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16 },
  classifyText: { flex: 1 },
  classifyTitleRed: { color: Dark.red, fontSize: 17, fontWeight: '800' },
  classifySub: { color: Dark.steel, fontSize: 13, marginTop: 2 },
  field: { gap: 10 },
  fieldLabel: { color: Dark.steel, fontSize: 13, fontWeight: '600' },
  rowBtns: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: 10, minHeight: 48 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  coords: { color: Dark.steel, fontSize: 12, fontVariant: ['tabular-nums'] },
  imagePreviewWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative', marginTop: 4 },
  imagePreview: { width: '100%', height: 180, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: { borderWidth: 1, borderRadius: 12, padding: 22, minHeight: 72 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusSub: { color: Dark.steel, fontSize: 13, marginTop: 4 },
  navBtns: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 16, paddingHorizontal: 20, minHeight: 48 },
  backText: { color: Dark.steel, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
