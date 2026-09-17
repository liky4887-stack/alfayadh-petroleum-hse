import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions, FlatList, ListRenderItem, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, BarChart3, Shield, Activity, Wrench, Truck, Plus, ClipboardCheck, Tag, AlertTriangle } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton, Avatar, StatusPill, SectionLabel } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { useHSEStore } from '@/lib/store';
import { useDepartment, DEPARTMENT_META, type Department } from '@/lib/department';
import { useT } from '@/lib/i18n';
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

const DEPT_ICONS: Record<Department, React.ReactNode> = {
  safety: <Shield size={16} color="#FFF" strokeWidth={2} />,
  operations: <Activity size={16} color="#FFF" strokeWidth={2} />,
  maintenance: <Wrench size={16} color="#FFF" strokeWidth={2} />,
  logistics: <Truck size={16} color="#FFF" strokeWidth={2} />,
};

export default function HomeScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const t = useT();
  const { department, setDepartment } = useDepartment();
  const { reports, loadReports } = useHSEStore();
  const [showDeptModal, setShowDeptModal] = useState(false);

  useEffect(() => { loadReports(); }, [loadReports]);

  const openCount = reports.filter((r) => r.status === 'open').length;
  const safeCount = reports.filter((r) => r.type === 'safe').length;
  const unsafeCount = reports.filter((r) => r.type !== 'safe').length;

  const handleDeptSelect = (d: Department) => {
    haptics.impactMedium();
    setDepartment(d);
    setShowDeptModal(false);
  };

  const deptPill = (
    <Pressable onPress={() => { haptics.impactMedium(); setShowDeptModal(true); }} style={({ pressed }) => [S.deptPill, { backgroundColor: DEPARTMENT_META[department].color }, pressed && S.pressed]}>
      {DEPT_ICONS[department]}
      <Text style={S.deptPillText}>{DEPARTMENT_META[department].label}</Text>
      <ChevronRight size={13} color="#FFF" strokeWidth={2.5} />
    </Pressable>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <BrandHeader
          title="Home"
          right={
            <View style={S.headerRight}>
              {deptPill}
              <IconButton icon={<Bell size={22} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
            </View>
          }
        />
        <View style={S.body}>
          {false && (
            <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }} style={({ pressed }) => [S.dashCard, pressed && S.cardPressed]}>
              <View style={S.dashLeft}>
                <View style={S.dashIconWrap}><BarChart3 size={20} color={C.accent} strokeWidth={2} /></View>
                <View>
                  <Text style={S.dashTitle}>{t('dashboard')}</Text>
                  <Text style={S.dashSub}>{t('dashboardSub')}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={C.faint} strokeWidth={2} />
            </Pressable>
          )}

          {department === 'safety' && <SafetyDashboard t={t} haptics={haptics} navigation={navigation} safeCount={safeCount} unsafeCount={unsafeCount} openCount={openCount} total={reports.length} />}
          {department === 'operations' && <OperationsDashboard t={t} haptics={haptics} navigation={navigation} />}
          {department === 'maintenance' && <MaintenanceDashboard t={t} haptics={haptics} navigation={navigation} />}
          {department === 'logistics' && <LogisticsDashboard t={t} haptics={haptics} navigation={navigation} />}
        </View>
      </ScrollView>
      <DepartmentModal visible={showDeptModal} onClose={() => setShowDeptModal(false)} onSelect={handleDeptSelect} current={department} />
    </SafeAreaView>
  );
}

function SafetyDashboard({ t, haptics, navigation, safeCount, unsafeCount, openCount, total }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <BigActionBtn label={t('reportSafe')} color={C.green} onPress={() => { haptics.impactMedium(); navigation.navigate('SafeReport'); }} />
        <BigActionBtn label={t('reportUnsafe')} color={C.red} onPress={() => { haptics.impactMedium(); navigation.navigate('UnsafeReport'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(safeCount)} label={t('safeReports')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'safe_reports' }); }} />
        <KpiCard value={String(unsafeCount)} label={t('unsafeReports')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'unsafe_reports' }); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(openCount)} label={t('openIssues')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'open_issues' }); }} />
        <KpiCard value={String(total)} label={t('totalReports')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'total_reports' }); }} />
      </View>
      <SectionLabel title={t('headsUp')} action={t('viewAll')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
        <HeadsUpCard image={IMG.warehouse} tag="New stock delivered" author="Maria Murphy" status="Acknowledged" onPress={() => { haptics.impactMedium(); navigation.navigate('Media'); }} />
        <HeadsUpCard image={IMG.wetFloor} tag="Heavy storms announced" author="Craig Tiley" status="Not viewed" danger onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
      </ScrollView>
      <View style={S.sectionRow}>
        <Text style={S.sectionLabel}>{t('today')}</Text>
        <View style={S.countBadge}><Text style={S.countBadgeText}>3</Text></View>
      </View>
      <View style={S.taskList}>
        <TaskRow category="Inspection" title="Monthly maintenance check" meta="Low priority" status="To Do" tone="orange" />
        <TaskRow category="Action" title="Restock store room supplies" meta="Low priority" status="In Progress" tone="blue" />
        <TaskRow category="Inspection" title="Monthly van maintenance check" meta="Due Dec 21" status="Completed" tone="green" last />
      </View>
    </>
  );
}

function OperationsDashboard({ t, haptics, navigation }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <BigActionBtn label={t('newAsset')} color={C.accent} icon={<Plus size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
        <BigActionBtn label={t('newAction')} color={C.primary} icon={<Tag size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="12" label={t('activeAssets')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value="5" label={t('scheduledActions')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="2" label={t('overdueActions')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'open_issues' }); }} />
        <KpiCard value="4" label={t('completedToday')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <SectionLabel title="Active Assets" action={t('viewAll')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
        <AssetCard image={IMG.truck} name="Truck EA-DB08N" location="Kansas" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <AssetCard image={IMG.barrels} name="Storage Unit B" location="Warehouse 3" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      </ScrollView>
    </>
  );
}

function MaintenanceDashboard({ t, haptics, navigation }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <BigActionBtn label={t('logMaintenance')} color={C.orange} icon={<Wrench size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
        <BigActionBtn label={t('reportIssue')} color={C.red} icon={<AlertTriangle size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('UnsafeReport'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="3" label={t('equipmentInMaintenance')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value="7" label={t('pendingChecks')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="1" label={t('criticalPriority')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'open_issues' }); }} />
        <KpiCard value="6" label={t('completedThisWeek')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <SectionLabel title="Overdue Maintenance" action={t('viewAll')} />
      <View style={S.taskList}>
        <TaskRow category="Maintenance" title="Hydraulic pump inspection" meta="Overdue 3 days" status="Overdue" tone="orange" />
        <TaskRow category="Maintenance" title="Crane cable replacement" meta="Critical priority" status="To Do" tone="blue" last />
      </View>
    </>
  );
}

function LogisticsDashboard({ t, haptics, navigation }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <BigActionBtn label={t('logTrip')} color={C.sky} icon={<Truck size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
        <BigActionBtn label={t('viewFleet')} color={C.accent} icon={<ClipboardCheck size={18} color="#FFF" />} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="24" label={t('vehiclesInFleet')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value="8" label={t('inTransit')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value="5" label={t('scheduledDeliveries')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
        <KpiCard value="3" label={t('trainingDue')} onPress={() => { haptics.impactMedium(); navigation.navigate('Training'); }} />
      </View>
      <SectionLabel title="Fleet" action={t('viewAll')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
        <AssetCard image={IMG.truck} name="Truck EA-DB08N" location="In transit" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <AssetCard image={IMG.driver} name="Driver Ahmed" location="On route" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      </ScrollView>
    </>
  );
}

function DepartmentModal({ visible, onClose, onSelect, current }: { visible: boolean; onClose: () => void; onSelect: (d: Department) => void; current: Department }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const depts: Department[] = ['safety', 'operations', 'maintenance', 'logistics'];
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={S.modalOverlay} onPress={onClose}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>{t('selectDepartment')}</Text>
          {depts.map((d) => (
            <Pressable
              key={d}
              onPress={() => { haptics.impactMedium(); onSelect(d); }}
              style={({ pressed }) => [S.modalRow, current === d && S.modalRowActive, pressed && S.pressed]}
            >
              <View style={[S.modalIcon, { backgroundColor: DEPARTMENT_META[d].color }]}>
                {DEPT_ICONS[d]}
              </View>
              <Text style={[S.modalLabel, current === d && S.modalLabelActive]}>{DEPARTMENT_META[d].label}</Text>
              {current === d && <ChevronRight size={18} color={C.accent} strokeWidth={2} />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function BigActionBtn({ label, color, icon, onPress }: { label: string; color: string; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.bigBtn, { backgroundColor: color }, pressed && S.pressed]}>
      {icon}
      <Text style={S.bigBtnText}>{label}</Text>
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

function AssetCard({ image, name, location, onPress }: { image: string; name: string; location: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.headsCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.headsImage} />
      <View style={S.headsBody}>
        <Text style={S.headsTag}>{name}</Text>
        <View style={S.headsFooter}>
          <StatusPill label={location} tone="blue" />
        </View>
      </View>
    </Pressable>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  scroll: { flex: 1, backgroundColor: C.canvas },
  scrollContent: { paddingBottom: 110 },
  body: { paddingTop: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  deptPillText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 12 },
  bigBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, minHeight: 54 },
  bigBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
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
  hStrip: { paddingLeft: 20, paddingRight: 20, gap: 16 },
  headsCard: { width: 280, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  headsImage: { width: '100%', height: 130 },
  headsBody: { padding: 16 },
  headsTag: { fontSize: 16, fontWeight: '700', color: C.ink, letterSpacing: -0.2, minHeight: 44 },
  headsFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  headsAuthor: { fontSize: 13, fontWeight: '500', color: C.inkSecondary, flex: 1, minWidth: 0 },
  dashCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: C.border },
  dashLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dashIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dashTitle: { fontSize: 16, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  dashSub: { fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 12 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  modalRowActive: { borderColor: C.accent, backgroundColor: C.accentSoft },
  modalIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
  modalLabelActive: { fontWeight: '800', color: C.accent },
  cardPressed: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});
