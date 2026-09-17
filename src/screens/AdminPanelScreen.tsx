import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import { ChevronLeft, Trash2, Pencil } from '@/lib/icons';
import { useT } from '@/lib/i18n';

type TabKey = 'reports' | 'actions' | 'assets' | 'training' | 'users';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'actions', label: 'Actions' },
  { key: 'assets', label: 'Assets' },
  { key: 'training', label: 'Training' },
  { key: 'users', label: 'Users' },
];

export default function AdminPanelScreen({ navigation }: { navigation: any }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<TabKey>('reports');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, dialog } = useConfirm();

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoading(true);
    let query = supabase.from(tab === 'reports' ? 'hse_reports' : tab).select('*').order('created_at', { ascending: false }).limit(50);
    if (tab === 'users') {
      query = supabase.from('user_roles').select('*').order('created_at', { ascending: false }).limit(50);
    }
    const { data } = await query;
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete item?',
      message: 'This action cannot be undone.',
      confirmLabel: t('delete'),
      destructive: true,
    });
    if (!ok) return;
    const table = activeTab === 'reports' ? 'hse_reports' : activeTab === 'users' ? 'user_roles' : activeTab;
    await supabase.from(table).delete().eq('id', id);
    haptics.notificationSuccess();
    loadTab(activeTab);
  };

  const getRowTitle = (item: any): string => {
    if (activeTab === 'reports') return item.note ?? 'Report';
    if (activeTab === 'actions') return item.title ?? 'Action';
    if (activeTab === 'assets') return item.name ?? item.asset_code ?? 'Asset';
    if (activeTab === 'training') return item.title ?? 'Course';
    if (activeTab === 'users') return item.full_name ?? 'User';
    return 'Item';
  };

  const getRowSubtitle = (item: any): string => {
    if (activeTab === 'reports') return `${item.type} · ${item.status}`;
    if (activeTab === 'actions') return `${item.type ?? ''} · ${item.priority ?? ''}`;
    if (activeTab === 'assets') return `${item.type ?? ''} · ${item.location ?? ''}`;
    if (activeTab === 'training') return item.category ?? '';
    if (activeTab === 'users') return `${item.role ?? ''} · ${item.department ?? ''}`;
    return '';
  };

  const renderRow: ListRenderItem<any> = ({ item }) => (
    <View style={S.row}>
      <View style={S.rowInfo}>
        <Text style={S.rowTitle} numberOfLines={2}>{getRowTitle(item)}</Text>
        <Text style={S.rowSub}>{getRowSubtitle(item)}</Text>
      </View>
      <Pressable onPress={() => { haptics.impactMedium(); }} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
        <Pencil size={15} color={C.accent} strokeWidth={2} />
      </Pressable>
      <Pressable onPress={() => handleDelete(item.id)} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
        <Trash2 size={15} color={C.red} strokeWidth={2} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>{t('cancel')}</Text>
        </Pressable>
        <Text style={S.headerTitle}>{t('adminPanel')}</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={S.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => { haptics.impactMedium(); setActiveTab(tab.key); }}
            style={({ pressed }) => [S.tab, activeTab === tab.key && S.tabActive, pressed && S.pressed]}
          >
            <Text style={[S.tabText, activeTab === tab.key && S.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={S.list}
          ListEmptyComponent={<View style={S.emptyWrap}><Text style={S.emptyText}>No items found</Text></View>}
        />
      )}
      {dialog}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFF' },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  rowSub: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.redBg, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.muted },
  pressed: { opacity: 0.7 },
});
