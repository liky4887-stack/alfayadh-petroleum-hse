import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Plus, X, Camera } from '@/lib/icons';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_W - 60) / 2;

interface MediaItem {
  id: string;
  uri: string;
}

export default function MediaLibraryScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const haptics = useHapticFeedback();

  const pickImage = async () => {
    haptics.impactMedium();
    const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
    if (status !== 'granted') {
      setToast({ visible: true, msg: 'Permission required to access photos' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.cancelled) return;
    const newItems: MediaItem[] = [{ id: `img_${Date.now()}`, uri: result.uri }];
    setItems((prev) => [...newItems, ...prev]);
    haptics.notificationSuccess();
    setToast({ visible: true, msg: `${newItems.length} image(s) added` });
  };

  const deleteItem = useCallback((id: string) => {
    haptics.impactMedium();
    setItems((prev) => prev.filter((item) => item.id !== id));
    setToast({ visible: true, msg: 'Image deleted' });
  }, [haptics]);

  const renderItem = ({ item }: { item: MediaItem }) => (
    <View style={S.tile}>
      <Image source={{ uri: item.uri }} style={S.tileImage} />
      <Pressable onPress={() => deleteItem(item.id)} style={S.deleteBtn}>
        <X size={14} color="#FFF" strokeWidth={2.5} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={S.backBtn}>
          <ChevronLeft size={22} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Media Library</Text>
        <Pressable onPress={pickImage} style={S.addBtn}>
          <Plus size={20} color={C.primary} strokeWidth={2.5} />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <View style={S.emptyState}>
          <Camera size={48} color={C.mutedLight} strokeWidth={1.5} />
          <Text style={S.emptyTitle}>No media yet</Text>
          <Text style={S.emptyText}>Tap the + button to upload safety photos</Text>
          <Pressable onPress={pickImage} style={({ pressed }) => [S.emptyBtn, pressed && S.btnPressed]}>
            <Plus size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={S.emptyBtnText}>Add Media</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={S.grid}
          columnWrapperStyle={S.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Toast message={toast.msg} type="success" visible={toast.visible} onHide={() => setToast({ visible: false, msg: '' })} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvasAlt },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: '#FFF' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  emptyText: { fontSize: 15, fontWeight: '400', color: C.mutedLight, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  grid: { padding: 20 },
  gridRow: { gap: 12, marginBottom: 12 },
  tile: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  tileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  btnPressed: { opacity: 0.85 },
});
