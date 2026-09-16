import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, BarChart3 } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton, Avatar, StatusPill, SectionLabel } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { useHSEStore } from '@/lib/store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_W + CARD_GAP;

const PROMO_SLIDES = [
  { image: IMG.barrels, badge: 'SAFETY CAMPAIGN', title: 'Q4 Zero-Incident Initiative', subtitle: 'Complete your safety training by October 31' },
  { image: IMG.worker, badge: 'SAFETY WEEK', title: 'October Safety Awareness', subtitle: 'Join the team-wide safety events this week' },
  { image: IMG.truck, badge: 'INSPECTION DRIVE', title: 'Equipment Inspection Month', subtitle: 'Ensure all assets are inspected by October 31' },
];

type Slide = typeof PROMO_SLIDES[0];

export default function HomeScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const { reports, loadReports } = useHSEStore();

  useEffect(() => { loadReports(); }, [loadReports]);

  const openCount = reports.filter((r) => r.status === 'open').length;
  const safeCount = reports.filter((r) => r.type === 'safe').length;
  const unsafeCount = reports.filter((r) => r.type !== 'safe').length;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <BrandHeader
          title="Home"
          right={<IconButton icon={<Bell size={22} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />}
        />
        <View style={S.body}>
          {false && (
          <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} style={({ pressed }) => [S.dashCard, pressed && S.cardPressed]}>
            <View style={S.dashLeft}>
              <View style={S.dashIconWrap}>
                <BarChart3 size={20} color={C.accent} strokeWidth={2} />
              </View>
              <View>
                <Text style={S.dashTitle}>HSE Dashboard</Text>
                <Text style={S.dashSub}>Report an issue or view stats</Text>
              </View>
            </View>
            <ChevronRight size={18} color={C.faint} strokeWidth={2} />
          </Pressable>
          )}

          <PromoCarousel onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
          <SectionLabel title="Heads up" action="View all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
            <HeadsUpCard image={IMG.warehouse} tag="New stock delivered" author="Maria Murphy" status="Acknowledged" onPress={() => { haptics.impactMedium(); navigation.navigate('Media'); }} />
            <HeadsUpCard image={IMG.wetFloor} tag="Heavy storms announced" author="Craig Tiley" status="Not viewed" danger onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
          </ScrollView>
          <View style={S.kpiRow}>
            <KpiCard value={String(safeCount)} label="Safe Reports" onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} />
            <KpiCard value={String(unsafeCount)} label="Unsafe Reports" onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} />
          </View>
          <View style={S.kpiRow}>
            <KpiCard value={String(openCount)} label="Open Issues" onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} />
            <KpiCard value={String(reports.length)} label="Total Reports" onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} />
          </View>
          <View style={S.sectionRow}>
            <Text style={S.sectionLabel}>Today</Text>
            <View style={S.countBadge}><Text style={S.countBadgeText}>3</Text></View>
          </View>
          <View style={S.taskList}>
            <TaskRow category="Inspection" title="Monthly maintenance check" meta="Low priority" status="To Do" tone="orange" />
            <TaskRow category="Action" title="Restock store room supplies" meta="Low priority" status="In Progress" tone="blue" />
            <TaskRow category="Inspection" title="Monthly van maintenance check" meta="Due Dec 21" status="Completed" tone="green" last />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PromoCarousel({ onPress }: { onPress: () => void }) {
  const [active, setActive] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [S.promoBanner, { width: CARD_W }, pressed && S.cardPressed]}>
      <Image source={{ uri: item.image }} style={S.promoImage} />
      <View style={S.promoOverlay} />
      <View style={S.promoContent}>
        <View style={S.promoBadge}>
          <Text style={S.promoBadgeText}>{item.badge}</Text>
        </View>
        <Text style={S.promoTitle}>{item.title}</Text>
        <Text style={S.promoSubtitle}>{item.subtitle}</Text>
        <View style={S.promoCta}>
          <Text style={S.promoCtaText}>Start training</Text>
          <ChevronRight size={15} color={C.accent} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={S.promoWrap}>
      <FlatList
        ref={flatListRef}
        data={PROMO_SLIDES}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          if (idx !== active) setActive(idx);
        }}
      />
      <View style={S.promoDots}>
        {PROMO_SLIDES.map((_, i) => (
          <View key={i} style={[S.promoDot, i === active && S.promoDotActive]} />
        ))}
      </View>
    </View>
  );
}

function HeadsUpCard({ image, tag, author, status, danger, onPress }: { image: string; tag: string; author: string; status: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.headsCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.headsImage} />
      <View style={S.headsBody}>
        <Text style={S.headsTag}>{tag}</Text>
        <View style={S.headsFooter}>
          <Avatar initials={author === 'Maria Murphy' ? 'MM' : 'CT'} color={danger ? '#F3B7B2' : '#D3CCFF'} />
          <Text style={S.headsAuthor} numberOfLines={1} ellipsizeMode="middle">{author}</Text>
          <StatusPill label={status} tone={danger ? 'red' : 'green'} />
        </View>
      </View>
    </Pressable>
  );
}

function KpiCard({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.kpiCard, pressed && S.cardPressed]}>
      <View style={S.kpiAccent} />
      <View style={S.kpiCopy}>
        <Text style={S.kpiValue}>{value}</Text>
        <Text style={S.kpiLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );
}

function TaskRow({ category, title, meta, status, tone, last }: { category: string; title: string; meta: string; status: string; tone: 'orange' | 'blue' | 'green'; last?: boolean }) {
  return (
    <View style={[S.taskRow, last && S.taskRowLast]}>
      <View style={S.taskRowTop}>
        <View style={S.taskRowLeft}>
          <Text style={S.taskCategory}>{category}</Text>
          <Text style={S.taskTitle}>{title}</Text>
        </View>
        <StatusPill label={status} tone={tone} />
      </View>
      <Text style={S.taskMeta}>{meta}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  scroll: { flex: 1, backgroundColor: C.canvas },
  scrollContent: { paddingBottom: 110 },
  body: { paddingTop: 8 },
  promoWrap: { marginTop: 4, marginBottom: 8, overflow: 'hidden' },
  promoBanner: { height: 168, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  promoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  promoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,42,66,0.78)' },
  promoContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 20, justifyContent: 'center' },
  promoBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  promoBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.2 },
  promoTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 12, lineHeight: 28 },
  promoSubtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  promoCta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginTop: 14 },
  promoCtaText: { fontSize: 13, fontWeight: '800', color: C.accent },
  promoDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  promoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.borderStrong },
  promoDotActive: { width: 20, backgroundColor: C.accent },
  hStrip: { paddingLeft: 20, paddingRight: 20, gap: 16 },
  headsCard: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  headsImage: { width: '100%', height: 130 },
  headsBody: { padding: 16 },
  headsTag: { fontSize: 16, fontWeight: '700', color: C.ink, letterSpacing: -0.2, minHeight: 44 },
  headsFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  headsAuthor: { fontSize: 13, fontWeight: '500', color: C.inkSecondary, flex: 1, minWidth: 0 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20, paddingHorizontal: 20 },
  kpiCard: { flex: 1, minHeight: 96, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  kpiAccent: { width: 5, height: 48, borderRadius: 3, backgroundColor: C.sky },
  kpiCopy: { flex: 1 },
  kpiValue: { fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  countBadge: { backgroundColor: C.accent, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  taskList: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 18, marginHorizontal: 20, overflow: 'hidden' },
  taskRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  taskRowLast: { borderBottomWidth: 0 },
  taskRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  taskRowLeft: { flex: 1, marginRight: 12, minWidth: 0 },
  taskCategory: { fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 0.4, textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginTop: 5, letterSpacing: -0.2 },
  taskMeta: { fontSize: 13, fontWeight: '400', color: C.muted, marginTop: 6 },
  dashCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: C.border },
  dashLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dashIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dashTitle: { fontSize: 16, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  dashSub: { fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 2 },
  cardPressed: { opacity: 0.6 },
});
