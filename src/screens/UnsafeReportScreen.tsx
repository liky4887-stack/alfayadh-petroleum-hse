import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, AlertTriangle, AlertOctagon, ChevronLeft, X } from '@/lib/icons';
import { theme } from '@/theme/theme';
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

  const handleClassification = (type: ReportType) => { haptics.impactMedium(); setClassification(type); setStep(1); };

  const handleLocation = async () => {
    haptics.selection();
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') { setLocation({ lat: 25.0667, lng: 50.8000 }); haptics.notificationSuccess(); return; }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      haptics.notificationSuccess();
    } catch { setLocation({ lat: 25.0667, lng: 50.8000 }); haptics.notificationSuccess(); }
  };

  const handleImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo access is required to attach images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) { setImageUri(result.assets[0].uri); haptics.notificationSuccess(); }
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

  const handleNext = () => { if (!canProceed()) { haptics.notificationError(); return; } haptics.impactMedium(); setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const handleBack = () => { haptics.impactMedium(); if (step === 0) { navigation.navigate('Dashboard'); } else { setStep((s) => s - 1); } };

  const handleSubmit = async () => {
    if (!classification || !note.trim() || !department || !subcategory || !status) { haptics.notificationError(); Alert.alert('Required', 'Please complete all required fields.'); return; }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageUri) imageUrl = await uploadImage(imageUri, 'reports');
    const result = await submitReport({
      type: classification, note: note.trim(), corrective_action: correctiveAction.trim() || null,
      image_url: imageUrl, department, subcategory, status,
      location_lat: location?.lat ?? null, location_lng: location?.lng ?? null,
    });
    setSubmitting(false);
    if (result.success) {
      if (status === 'open') {
        haptics.notificationError();
        Alert.alert('Open Report', 'This report has been logged as an open issue. Notifications have been sent.', [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]);
      } else {
        haptics.notificationSuccess();
        Alert.alert('Submitted', result.offline ? 'Saved locally. Will sync when connection returns.' : 'Report recorded and closed.', [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]);
      }
    } else {
      haptics.notificationError();
      Alert.alert('Error', 'Could not submit report. Please try again.');
    }
  };

  const stepLabels = ['Classification', 'Details', 'Department', 'Subcategory', 'Status'];

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="Unsafe Report" currentScreen="UnsafeReport" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View style={S.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[S.progressBar, { backgroundColor: i <= step ? theme.primary : theme.border }]} />
            ))}
          </View>
          <Text style={S.stepLabel}>Step {step + 1} of {TOTAL_STEPS} — {stepLabels[step]}</Text>

          {step === 0 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>Select Report Type</Text>
              <Pressable onPress={() => handleClassification('unsafe_condition')} style={({ pressed }) => [S.classifyBtn, { borderColor: theme.danger }, pressed && S.pressed]}>
                <AlertOctagon size={24} color={theme.danger} />
                <View style={S.classifyText}>
                  <Text style={S.classifyTitleRed}>Unsafe Condition</Text>
                  <Text style={S.classifySub}>A physical hazard or dangerous situation</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => handleClassification('unsafe_act')} style={({ pressed }) => [S.classifyBtn, { borderColor: theme.danger }, pressed && S.pressed]}>
                <AlertTriangle size={24} color={theme.danger} />
                <View style={S.classifyText}>
                  <Text style={S.classifyTitleRed}>Unsafe Act</Text>
                  <Text style={S.classifySub}>A behavioral violation of safety procedures</Text>
                </View>
              </Pressable>
            </View>
          )}

          {step === 1 && (
            <View style={S.stepContent}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Note *</Text>
                <TextInput value={note} onChangeText={setNote} placeholder="Describe the unsafe condition or act in detail..." multiline numberOfLines={4} />
              </View>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Corrective Action</Text>
                <TextInput value={correctiveAction} onChangeText={setCorrectiveAction} placeholder="What action was taken or is required?" multiline numberOfLines={3} />
              </View>
              <View style={S.rowBtns}>
                <Pressable onPress={handleImage} style={({ pressed }) => [S.toggleBtn, { borderColor: imageUri ? theme.primary : theme.border, backgroundColor: imageUri ? theme.primaryLight : theme.card }, pressed && S.pressed]}>
                  <Camera size={18} color={imageUri ? theme.primary : theme.textDim} />
                  <Text style={[S.toggleText, { color: imageUri ? theme.primary : theme.textDim }]}>{imageUri ? 'Attached' : 'Attach Photo'}</Text>
                </Pressable>
                <Pressable onPress={handleLocation} style={({ pressed }) => [S.toggleBtn, { borderColor: location ? theme.primary : theme.border, backgroundColor: location ? theme.primaryLight : theme.card }, pressed && S.pressed]}>
                  <MapPin size={18} color={location ? theme.primary : theme.textDim} />
                  <Text style={[S.toggleText, { color: location ? theme.primary : theme.textDim }]}>{location ? 'Located' : 'Set Location'}</Text>
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
              {location && <Text style={S.coords}>Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>}
            </View>
          )}

          {step === 2 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>Select Responsible Department</Text>
              <View style={S.chipWrap}>
                {DEPARTMENT_KEYS.map((dept) => (
                  <Chip key={dept} label={dept} selected={department === dept} onPress={() => handleDepartment(dept)} />
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={S.stepContent}>
              <Text style={S.stepTitle}>Subcategory — {department}</Text>
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
              <Text style={S.stepTitle}>Report Status</Text>
              <Pressable onPress={() => handleStatus('closed')} style={({ pressed }) => [S.statusBtn, { borderColor: status === 'closed' ? theme.success : theme.border, backgroundColor: status === 'closed' ? theme.successLight : theme.card }, pressed && S.pressed]}>
                <Text style={[S.statusTitle, { color: status === 'closed' ? theme.success : theme.text }]}>Closed (Resolved on site)</Text>
                <Text style={S.statusSub}>Corrective action was taken and issue resolved</Text>
              </Pressable>
              <Pressable onPress={() => handleStatus('open')} style={({ pressed }) => [S.statusBtn, { borderColor: status === 'open' ? theme.danger : theme.border, backgroundColor: status === 'open' ? theme.dangerLight : theme.card }, pressed && S.pressed]}>
                <Text style={[S.statusTitle, { color: status === 'open' ? theme.danger : theme.text }]}>Open (Needs intervention)</Text>
                <Text style={S.statusSub}>Issue persists and requires action from the responsible party</Text>
              </Pressable>
            </View>
          )}

          <View style={S.navBtns}>
            <Pressable onPress={handleBack} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
              <ChevronLeft size={20} color={theme.textDim} />
              <Text style={S.backText}>{step === 0 ? 'Cancel' : 'Previous'}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            {step < TOTAL_STEPS - 1 ? (
              <Button label="Next" onPress={handleNext} variant="primary" disabled={!canProceed()} />
            ) : (
              <Button label={submitting ? 'Submitting...' : 'Submit Report'} onPress={handleSubmit} variant="danger" disabled={submitting || !status} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 20 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: { color: theme.textDim, fontSize: 12, fontFamily: 'Chevalon-SemiBold' },
  stepContent: { gap: 16 },
  stepTitle: { color: theme.text, fontSize: 18, fontFamily: 'Chevalon-Bold' },
  classifyBtn: { borderWidth: 1, backgroundColor: theme.card, borderRadius: 14, padding: 22, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16 },
  classifyText: { flex: 1 },
  classifyTitleRed: { color: theme.danger, fontSize: 17, fontFamily: 'Chevalon-Bold' },
  classifySub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  field: { gap: 10 },
  fieldLabel: { color: theme.textDim, fontSize: 13, fontFamily: 'Chevalon-SemiBold' },
  rowBtns: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: 12, minHeight: 48 },
  toggleText: { fontSize: 14, fontFamily: 'Chevalon-SemiBold' },
  coords: { color: theme.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
  imagePreviewWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative', marginTop: 4 },
  imagePreview: { width: '100%', height: 180, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusBtn: { borderWidth: 1, borderRadius: 14, padding: 22, minHeight: 72 },
  statusTitle: { fontSize: 16, fontFamily: 'Chevalon-Bold' },
  statusSub: { color: theme.textDim, fontSize: 13, marginTop: 4 },
  navBtns: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 16, paddingHorizontal: 20, minHeight: 48 },
  backText: { color: theme.textDim, fontSize: 15, fontFamily: 'Chevalon-SemiBold' },
  pressed: { opacity: 0.7 },
});
