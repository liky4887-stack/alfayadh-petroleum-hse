import { useState } from 'react';
import { ScrollView, Text, View, Alert, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, X } from '@/lib/icons';
import { theme } from '@/theme/theme';
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Photo access is required to attach images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.cancelled && result.uri) { setImageUri(result.uri); haptics.notificationSuccess(); }
  };

  const handleSubmit = async () => {
    if (!note.trim()) { haptics.notificationError(); Alert.alert('Required', 'Please enter a note before submitting.'); return; }
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageUri) imageUrl = await uploadImage(imageUri, 'reports');
    const result = await submitReport({ type: 'safe', note: note.trim(), image_url: imageUrl, status: 'closed' });
    setSubmitting(false);
    if (result.success) {
      haptics.notificationSuccess();
      Alert.alert(result.offline ? 'Saved locally' : 'Thank you!', result.offline ? 'Your report will sync when connection returns.' : 'Safe observation recorded and sent to HSE.');
      navigation.navigate('Dashboard');
    } else {
      haptics.notificationError();
      Alert.alert('Error', 'Could not submit report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="Safe Report" currentScreen="SafeReport" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View>
            <Text style={S.label}>Safe Observation</Text>
            <Text style={S.desc}>Record a safe behavior or condition you noticed in the field. These observations help strengthen the safety culture.</Text>
          </View>
          <View style={S.field}>
            <Text style={S.fieldLabel}>Note *</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Describe the safe behavior or condition you observed..." multiline numberOfLines={4} />
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
              <Camera size={20} color={theme.textDim} />
              <Text style={S.cameraText}>Attach photo (optional)</Text>
            </Pressable>
          )}
          <Button
            label={submitting ? 'Submitting...' : 'Submit Report'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            disabled={submitting}
            icon={<Check size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 24 },
  label: { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  desc: { color: theme.textDim, fontSize: 14, lineHeight: 24 },
  field: { gap: 10 },
  fieldLabel: { color: theme.textDim, fontSize: 13, fontWeight: '600' },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, backgroundColor: theme.card,
    minHeight: 48,
  },
  cameraText: { color: theme.textDim, fontSize: 14 },
  imagePreviewWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
