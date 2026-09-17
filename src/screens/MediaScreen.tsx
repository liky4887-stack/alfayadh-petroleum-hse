import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Trash2, Pencil } from 'lucide-react';
import { C, IMG } from '@/theme/colors';
import { IconButton } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function MediaScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [selected, setSelected] = useState(0);
  const thumbs = [IMG.worker, IMG.warehouse, IMG.truck, IMG.barrels];
  const haptics = useHapticFeedback();

  return (
    <SafeAreaView style={S.fullScreen} edges={['top']}>
      <View style={S.mediaHeader}>
        <IconButton icon={<ChevronRight size={26} color={C.ink} />} onPress={() => navigation.goBack()} />
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [S.doneBtn, pressed && S.cardPressed]}>
          <Text style={S.doneText}>Done</Text>
        </Pressable>
      </View>
      <View style={S.mediaViewer}>
        <Image source={{ uri: thumbs[selected] }} style={S.mediaImage} />
        <View style={S.mediaActions}>
          <View style={S.mediaActionBtn}>
            <IconButton icon={<Trash2 size={22} color={C.red} strokeWidth={1.8} />} onPress={() => Alert.alert('Delete', 'Remove this image?')} />
          </View>
          <View style={S.mediaActionBtn}>
            <IconButton icon={<Pencil size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => Alert.alert('Edit', 'Annotation tools ready.')} />
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.thumbStrip}>
        {thumbs.map((uri, i) => (
          <Pressable key={uri} onPress={() => { haptics.selection(); setSelected(i); }} style={[S.thumb, selected === i && S.thumbSelected]}>
            <Image source={{ uri }} style={S.thumbImage} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  mediaHeader: { height: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneBtn: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10 },
  doneText: { fontSize: 17, fontWeight: '700', color: C.ink },
  mediaViewer: { flex: 1, marginHorizontal: 16, backgroundColor: '#E8E6E1', borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 8 },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mediaActions: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  mediaActionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  thumbStrip: { gap: 10, padding: 16 },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: C.accent },
  thumbImage: { width: '100%', height: '100%' },
  cardPressed: { opacity: 0.6 },
});
