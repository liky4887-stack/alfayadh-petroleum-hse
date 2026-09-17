import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ChevronRight, Plus, Tag, AlertTriangle, CircleCheck, Shield } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton, Avatar, StatusPill, SectionLabel } from '@/components/Shared';
import { PromoCarousel } from '@/components/PromoCarousel';
import { useHapticFeedback } from '@/lib/haptics';
import { useHSEStore } from '@/lib/store';
import { useDepartment, DEPARTMENT_META, type Department } from '@/lib/department';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

const DEPT_SHORT: Record<Department, string> = {
  safety: 'Safety',
  operations: 'Ops',
  maintenance: 'Maint.',
  logistics: 'Logistics',
};

const PRIORITY_TONE: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  Critical: 'red',
  High: 'orange',
  Medium: 'yellow',
  Low: 'gray',
};

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

interface ActionItem {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  status: string;
  due_date: string | null;
  assignee: string | null;
  updated_at?: string;
}

interface AssetItem {
  id: string;
  asset_code: string;
  name: string;
  type: string | null;
  location: string | null;
  status: string | null;
  image_url: string | null;
}

export default function HomeScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const t = useT();
  const { department, setDepartment } = useDepartment();
  const { reports, loadReports, assets: storeAssets, actions: storeActions, loadAssets, loadActions } = useHSEStore();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const openCount = reports.filter((r) => r.status === 'open').length;
  const safeCount = reports.filter((r) => r.type === 'safe').length;
  const unsafeCount = reports.filter((r) => r.type !== 'safe').length;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAssets(), loadActions()]);
      const fresh = useHSEStore.getState();
      setActions((fresh.actions ?? []).slice(0, 20));
      setAssets((fresh.assets ?? []).slice(0, 20));
    } catch (err) {
      console.error('Home load error:', err);
    }
    setLoading(false);
  }, [loadAssets, loadActions]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const handleDeptSelect = (d: Department) => {
    haptics.impactMedium();
    setDepartment(d);
    setShowDeptModal(false);
  };

  const sortedActions = [...actions].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? 'Low'] ?? 3;
    const pb = PRIORITY_ORDER[b.priority ?? 'Low'] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.due_date ?? '').localeCompare(b.due_date ?? '');
  });

  const activeActions = sortedActions.filter((a) => a.status === 'todo' || a.status === 'in_progress');
  const completedToday = sortedActions.filter((a) => {
    if (a.status !== 'completed') return false;
    if (!a.updated_at) return false;
    return a.updated_at.slice(0, 10) === new Date().toISOString().slice(0, 10);
  }).length;
  const overdueActions = sortedActions.filter((a) => a.status !== 'completed' && a.due_date && new Date(a.due_date) < new Date()).length;
  const criticalCount = sortedActions.filter((a) => a.priority === 'Critical' && a.status !== 'completed').length;

  const activeAssets = assets.filter((a) => a.status === 'active').length;
  const maintenanceAssets = assets.filter((a) => a.status === 'in_maintenance').length;

  const deptPill = (
    <Pressable
      onPress={() => { haptics.impactMedium(); setShowDeptModal(true); }}
      style={({ pressed }) => [S.deptPill, pressed && S.pressed]}
    >
      <Text style={S.deptPillText} numberOfLines={1} ellipsizeMode="tail">{DEPT_SHORT[department]}</Text>
    </Pressable>
  );

  const handleLogoLongPress = async () => {
    haptics.notificationWarning();
    try {
      const session = await AsyncStorage.getItem('admin_session');
      if (session === 'true') {
        navigation.navigate('AdminPanel' as never);
      } else {
        navigation.navigate('AdminLogin' as never);
      }
    } catch {
      navigation.navigate('AdminLogin' as never);
    }
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Home"
        onLogoLongPress={handleLogoLongPress}
        right={
          <View style={S.headerRight}>
            {deptPill}
            <IconButton icon={<Bell size={22} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
          </View>
        }
      />
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <PromoCarousel
          onPressCard={() => { haptics.impactMedium(); navigation.navigate('Feed'); }}
        />
        <View style={S.body}>
          {loading ? (
            <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
          ) : (
            <>
              {department === 'safety' && (
                <SafetyDashboard
                  t={t} haptics={haptics} navigation={navigation}
                  activeActions={activeActions}
                  activeAssets={activeAssets}
                  completedToday={completedToday}
                />
              )}
              {department === 'operations' && (
                <OperationsDashboard
                  t={t} haptics={haptics} navigation={navigation}
                  activeAssets={activeAssets} scheduledActions={activeActions.length}
                  overdueActions={overdueActions} completedToday={completedToday}
                  assets={assets.slice(0, 4)}
                />
              )}
              {department === 'maintenance' && (
                <MaintenanceDashboard
                  t={t} haptics={haptics} navigation={navigation}
                  maintenanceAssets={maintenanceAssets} pendingChecks={activeActions.length}
                  criticalCount={criticalCount} completedThisWeek={completedToday}
                  activeActions={activeActions.slice(0, 3)}
                />
              )}
              {department === 'logistics' && (
                <LogisticsDashboard
                  t={t} haptics={haptics} navigation={navigation}
                  fleetCount={assets.length} inTransit={activeActions.filter(a => a.type === 'Maintenance').length}
                  scheduledDeliveries={activeActions.length} trainingDue={3}
                  assets={assets.filter(a => a.type === 'Truck' || a.type === 'Vehicle').slice(0, 4)}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
      <DepartmentModal visible={showDeptModal} onClose={() => setShowDeptModal(false)} onSelect={handleDeptSelect} current={department} />
    </SafeAreaView>
  );
}

function SafetyDashboard({ t, haptics, navigation, activeActions, activeAssets, completedToday }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <OutlinedPillBtn label="+ New Asset" color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
        <OutlinedPillBtn label="+ New Action" color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
      </View>

      <View style={S.kpiRow}>
        <KpiCard value={String(activeAssets)} label="Active Assets" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value={String(activeActions.length)} label="Active Actions" onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(completedToday)} label="Completed" onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
        <KpiCard value={String(activeActions.filter((a: ActionItem) => a.priority === 'Critical').length)} label="Critical" onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <SectionLabel title={t('headsUp')} action={t('viewAll')} onAction={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingRight: 32 }}>
        <HeadsUpCard image={IMG.warehouse} tag="SAFETY CAMPAIGN" title="New stock delivered" author="Maria Murphy" status="Acknowledged" onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
        <HeadsUpCard image={IMG.wetFloor} tag="SAFETY ALERT" title="Heavy storms announced" author="Craig Tiley" status="Not viewed" danger onPress={() => { haptics.impactMedium(); navigation.navigate('Feed'); }} />
      </ScrollView>
      <View style={S.sectionRow}>
        <View style={S.sectionLabelRow}>
          <Text style={S.sectionLabel}>{t('today')}</Text>
          <View style={S.countBadge}><Text style={S.countBadgeText}>{activeActions.length}</Text></View>
        </View>
      </View>
      {activeActions.length > 0 ? (
        <View style={S.taskList}>
          {activeActions.map((action: ActionItem, i: number) => (
            <Pressable
              key={action.id}
              onPress={() => { haptics.impactMedium(); navigation.navigate('ActionDetail', { actionId: action.id }); }}
              style={({ pressed }) => [S.taskRow, i === activeActions.length - 1 && S.taskRowLast, pressed && S.cardPressed]}
            >
              <View style={S.taskRowTop}>
                <View style={S.taskRowLeft}>
                  <Text style={S.taskCategory}>{action.type ?? 'Action'}</Text>
                  <Text style={S.taskTitle} numberOfLines={1}>{action.title}</Text>
                </View>
                <StatusPill label={action.priority ?? 'Low'} tone={PRIORITY_TONE[action.priority ?? 'Low'] ?? 'gray'} />
              </View>
              <View style={S.taskMetaRow}>
                <Text style={S.taskMeta}>{action.due_date ?? 'No due date'}</Text>
                <StatusPill label={action.status} tone={action.status === 'completed' ? 'green' : 'blue'} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={S.emptyState}>
          <CircleCheck size={36} color={C.faint} strokeWidth={1.5} />
          <Text style={S.emptyText}>No active tasks. All caught up!</Text>
        </View>
      )}
    </>
  );
}

function OperationsDashboard({ t, haptics, navigation, activeAssets, scheduledActions, overdueActions, completedToday, assets }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <OutlinedPillBtn label={t('newAsset')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
        <OutlinedPillBtn label={t('newAction')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(activeAssets)} label={t('activeAssets')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value={String(scheduledActions)} label={t('scheduledActions')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(overdueActions)} label={t('overdueActions')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'open' }); }} />
        <KpiCard value={String(completedToday)} label={t('completedToday')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <SectionLabel title="Active Assets" action={t('viewAll')} onAction={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      {assets.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
          {assets.map((asset: AssetItem) => (
            <AssetCard key={asset.id} image={asset.image_url || IMG.truck} name={asset.name} location={asset.location ?? '—'} onPress={() => { haptics.impactMedium(); navigation.navigate('AssetDetail', { assetId: asset.id }); }} />
          ))}
        </ScrollView>
      ) : (
        <View style={S.emptyState}>
          <CircleCheck size={36} color={C.faint} strokeWidth={1.5} />
          <Text style={S.emptyText}>No assets yet. Add one to get started.</Text>
        </View>
      )}
    </>
  );
}

function MaintenanceDashboard({ t, haptics, navigation, maintenanceAssets, pendingChecks, criticalCount, completedThisWeek, activeActions }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <OutlinedPillBtn label={t('logMaintenance')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
        <OutlinedPillBtn label={t('newAsset')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(maintenanceAssets)} label={t('equipmentInMaintenance')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value={String(pendingChecks)} label={t('pendingChecks')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(criticalCount)} label={t('criticalPriority')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions', { filter: 'open' }); }} />
        <KpiCard value={String(completedThisWeek)} label={t('completedThisWeek')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <SectionLabel title="Active Tasks" action={t('viewAll')} onAction={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      {activeActions.length > 0 ? (
        <View style={S.taskList}>
          {activeActions.map((action: ActionItem, i: number) => (
            <Pressable
              key={action.id}
              onPress={() => { haptics.impactMedium(); navigation.navigate('ActionDetail', { actionId: action.id }); }}
              style={({ pressed }) => [S.taskRow, i === activeActions.length - 1 && S.taskRowLast, pressed && S.cardPressed]}
            >
              <View style={S.taskRowTop}>
                <View style={S.taskRowLeft}>
                  <Text style={S.taskCategory}>{action.type ?? 'Action'}</Text>
                  <Text style={S.taskTitle} numberOfLines={1}>{action.title}</Text>
                </View>
                <StatusPill label={action.priority ?? 'Low'} tone={PRIORITY_TONE[action.priority ?? 'Low'] ?? 'gray'} />
              </View>
              <View style={S.taskMetaRow}>
                <Text style={S.taskMeta}>{action.due_date ?? 'No due date'}</Text>
                <StatusPill label={action.status} tone={action.status === 'completed' ? 'green' : 'blue'} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={S.emptyState}>
          <CircleCheck size={36} color={C.faint} strokeWidth={1.5} />
          <Text style={S.emptyText}>No pending maintenance tasks.</Text>
        </View>
      )}
    </>
  );
}

function LogisticsDashboard({ t, haptics, navigation, fleetCount, inTransit, scheduledDeliveries, trainingDue, assets }: any) {
  return (
    <>
      <View style={S.actionRow}>
        <OutlinedPillBtn label={t('logTrip')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />
        <OutlinedPillBtn label={t('viewFleet')} color="#0EA5E9" onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(fleetCount)} label={t('vehiclesInFleet')} onPress={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
        <KpiCard value={String(inTransit)} label={t('inTransit')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
      </View>
      <View style={S.kpiRow}>
        <KpiCard value={String(scheduledDeliveries)} label={t('scheduledDeliveries')} onPress={() => { haptics.impactMedium(); navigation.navigate('Actions'); }} />
        <KpiCard value={String(trainingDue)} label={t('trainingDue')} onPress={() => { haptics.impactMedium(); navigation.navigate('Training'); }} />
      </View>
      <SectionLabel title="Fleet" action={t('viewAll')} onAction={() => { haptics.impactMedium(); navigation.navigate('Assets'); }} />
      {assets.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
          {assets.map((asset: AssetItem) => (
            <AssetCard key={asset.id} image={asset.image_url || IMG.truck} name={asset.name} location={asset.location ?? '—'} onPress={() => { haptics.impactMedium(); navigation.navigate('AssetDetail', { assetId: asset.id }); }} />
          ))}
        </ScrollView>
      ) : (
        <View style={S.emptyState}>
          <CircleCheck size={36} color={C.faint} strokeWidth={1.5} />
          <Text style={S.emptyText}>No vehicles in fleet yet.</Text>
        </View>
      )}
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
          <Text style={S.modalSubtitle}>Choose the dashboard you want to view</Text>
          {depts.map((d) => (
            <Pressable
              key={d}
              onPress={() => { haptics.impactMedium(); onSelect(d); }}
              style={({ pressed }) => [S.modalRow, current === d && S.modalRowActive, pressed && S.pressed]}
            >
              <Text style={[S.modalLabel, current === d && S.modalLabelActive]}>{DEPARTMENT_META[d].label}</Text>
              <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function OutlinedPillBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.outlinedBtn, { borderColor: color }, pressed && S.pressed]}>
      <Text style={[S.outlinedBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function KpiCard({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.kpiCard, pressed && S.cardPressed]}>
      <View style={S.kpiCopy}>
        <Text style={S.kpiValue}>{value}</Text>
        <Text style={S.kpiLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
    </Pressable>
  );
}

function HeadsUpCard({ image, tag, title, author, status, danger, onPress }: { image: string; tag: string; title?: string; author: string; status: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.headsCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.headsImage} />
      <View style={S.headsBody}>
        <Text style={S.headsTag}>{tag}</Text>
        {title && <Text style={S.headsTitle} numberOfLines={2}>{title}</Text>}
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
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 110 },
  body: { paddingTop: 8 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  deptPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0EA5E9', flexShrink: 0 },
  deptPillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 12 },
  outlinedBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#FFFFFF', minHeight: 48 },
  outlinedBtnText: { fontSize: 14, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20, paddingHorizontal: 20 },
  kpiCard: { flex: 1, minHeight: 72, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  kpiCopy: { flex: 1 },
  kpiValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14, paddingHorizontal: 20 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  countBadge: { backgroundColor: '#0EA5E9', minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  taskList: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 18, marginHorizontal: 20, overflow: 'hidden' },
  taskRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  taskRowLast: { borderBottomWidth: 0 },
  taskRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  taskRowLeft: { flex: 1, marginRight: 12, minWidth: 0 },
  taskCategory: { fontSize: 11, fontWeight: '700', color: '#0EA5E9', letterSpacing: 0.4, textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 5, letterSpacing: -0.2 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  taskMeta: { fontSize: 13, fontWeight: '400', color: '#64748B' },
  hStrip: { paddingLeft: 20, paddingRight: 20, gap: 16 },
  headsCard: { width: 260, backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  headsImage: { width: '100%', height: 130 },
  headsBody: { padding: 16 },
  headsTag: { fontSize: 10, fontWeight: '700', color: '#0EA5E9', letterSpacing: 0.4, textTransform: 'uppercase' },
  headsTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 6, minHeight: 44 },
  headsFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  headsAuthor: { fontSize: 13, fontWeight: '500', color: '#64748B', flex: 1, minWidth: 0 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, fontWeight: '500', color: '#64748B', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, fontWeight: '400', color: '#64748B', marginBottom: 12 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginTop: 8 },
  modalRowActive: { borderColor: '#0EA5E9', backgroundColor: '#E0F2FE' },
  modalLabel: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
  modalLabelActive: { fontWeight: '700', color: '#0EA5E9' },
  cardPressed: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});
