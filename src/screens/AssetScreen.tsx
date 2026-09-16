import { ScrollView, Text, View, Pressable, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin } from 'lucide-react';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function AssetScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Assets"
        right={
          <View style={S.headerActions}>
            <IconButton icon={<Plus size={18} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
          </View>
        }
      />
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          <View style={S.assetHero}>
            <Image source={{ uri: IMG.truck }} style={S.assetImage} />
            <View style={S.assetInfo}>
              <View>
                <Text style={S.assetId}>EA-DB08N</Text>
                <Text style={S.assetType}>Truck</Text>
              </View>
              <View style={S.assetLocation}>
                <MapPin size={14} color={C.muted} strokeWidth={1.8} />
                <Text style={S.assetLocationText}>Kansas</Text>
              </View>
            </View>
          </View>
          <View style={S.sectionRow}>
            <Text style={S.sectionLabel}>Scheduled</Text>
            <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} style={({ pressed }) => [S.addAssetBtn, pressed && S.cardPressed]}>
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
              <Text style={S.addAssetText}>Add Asset</Text>
            </Pressable>
          </View>
          <View style={S.scheduleList}>
            <ScheduleCard title="Replace track chain" tag="Action" meta="Kansas  ·  Low" assignee="Assigned to Jamie Hong" status="To do" tone="orange" />
            <ScheduleCard title="Monthly truck condition check" tag="Inspection" meta="Dozer inspection checklist" status="Overdue" tone="red" last />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleCard({ title, tag, meta, assignee, status, tone, last }: { title: string; tag: string; meta: string; assignee?: string; status: string; tone: 'orange' | 'red'; last?: boolean }) {
  return (
    <View style={[S.scheduleCard, last && S.scheduleLast]}>
      <View style={S.scheduleTop}>
        <Text style={S.scheduleTitle} numberOfLines={2}>{title}</Text>
        <View style={[S.statusPill, { backgroundColor: tone === 'red' ? C.redBg : C.orangeBg }]}>
          <Text style={[S.statusPillText, { color: tone === 'red' ? C.red : C.orange }]}>{status}</Text>
        </View>
      </View>
      <View style={S.scheduleTagRow}>
        <View style={S.scheduleTag}>
          <Text style={S.scheduleTagText}>{tag}</Text>
        </View>
        <Text style={S.scheduleMeta}>{meta}</Text>
      </View>
      {assignee && <Text style={S.scheduleAssignee}>{assignee}</Text>}
      <View style={S.scheduleFooter}>
        <Text style={S.scheduleUpdated}>Updated 1 day ago</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  scroll: { flex: 1, backgroundColor: C.canvas },
  scrollContent: { paddingBottom: 110 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  headerActions: { flexDirection: 'row', gap: 2 },
  assetHero: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginTop: 20 },
  assetImage: { width: '100%', height: 200 },
  assetInfo: { padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  assetId: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  assetType: { fontSize: 15, fontWeight: '500', color: C.inkSecondary, marginTop: 4 },
  assetLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  assetLocationText: { fontSize: 14, fontWeight: '600', color: C.inkSecondary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  addAssetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addAssetText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  scheduleList: { gap: 14, marginTop: 4 },
  scheduleCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  scheduleLast: { marginBottom: 24 },
  scheduleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  scheduleTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1, marginRight: 12, letterSpacing: -0.2, minWidth: 0 },
  scheduleTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  scheduleTag: { backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  scheduleTagText: { fontSize: 12, fontWeight: '700', color: C.inkSecondary },
  scheduleMeta: { fontSize: 13, fontWeight: '500', color: C.inkSecondary },
  scheduleAssignee: { fontSize: 14, fontWeight: '500', color: C.ink, marginTop: 12 },
  scheduleFooter: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 16, paddingTop: 14 },
  scheduleUpdated: { fontSize: 13, fontWeight: '400', color: C.muted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  cardPressed: { opacity: 0.6 },
});
