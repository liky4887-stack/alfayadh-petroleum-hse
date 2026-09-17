import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, ListRenderItem, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { ChevronLeft, Trash2, Pencil, CircleCheck } from '@/lib/icons';
import { useT } from '@/lib/i18n';

type TabKey = 'reports' | 'actions' | 'assets' | 'training' | 'users';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'actions', label: 'Actions' },
  { key: 'assets', label: 'Assets' },
  { key: 'training', label: 'Training' },
  { key: 'users', label: 'Users' },
];

const TABLE_MAP: Record<TabKey, string> = {
  reports: 'hse_reports',
  actions: 'actions',
  assets: 'assets',
  training: 'training_courses',
  users: 'user_roles',
};

const ROLES = ['admin', 'supervisor', 'employee'];

interface AdminRow {
  id: string;
  [key: string]: any;
}

export default function AdminPanelScreen({ navigation }: { navigation: any }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<TabKey>('reports');
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });
  const [roleModal, setRoleModal] = useState<{ userId: string; currentRole: string } | null>(null);
  const { confirm, dialog } = useConfirm();

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      const table = TABLE_MAP[tab];
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Admin load error:', error);
      }
      setRows((data ?? []) as AdminRow[]);
    } catch (err) {
      console.error('Admin load exception:', err);
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTab(activeTab); }, [activeTab, loadTab]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, msg, type });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete item?',
      message: 'This action cannot be undone.',
      confirmLabel: t('delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from(TABLE_MAP[activeTab]).delete().eq(activeTab === 'users' ? 'user_id' : 'id', id);
      if (error) {
        console.error('Delete error:', error);
        showToast(`Delete failed: ${error.message}`, 'error');
        haptics.notificationError();
        return;
      }
      haptics.notificationSuccess();
      showToast('Item deleted');
      loadTab(activeTab);
    } catch (err) {
      console.error('Delete exception:', err);
      showToast('Delete failed', 'error');
    }
  };

  const handleEdit = (item: AdminRow) => {
    haptics.impactMedium();
    if (activeTab === 'reports') {
      navigation.navigate('ReportDetail', { reportId: item.id });
    } else if (activeTab === 'users') {
      setRoleModal({ userId: item.user_id, currentRole: item.role ?? 'employee' });
    } else {
      navigation.navigate('NewAction');
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!roleModal) return;
    haptics.impactMedium();
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', roleModal.userId);
      if (error) {
        console.error('Role update error:', error);
        showToast(`Failed: ${error.message}`, 'error');
        haptics.notificationError();
      } else {
        haptics.notificationSuccess();
        showToast('Role updated');
        loadTab('users');
      }
    } catch (err) {
      console.error('Role update exception:', err);
      showToast('Failed to update role', 'error');
    }
    setRoleModal(null);
  };

  const getRowTitle = (item: AdminRow): string => {
    if (activeTab === 'reports') return item.note ?? 'Report';
    if (activeTab === 'actions') return item.title ?? 'Action';
    if (activeTab === 'assets') return item.name ?? item.asset_code ?? 'Asset';
    if (activeTab === 'training') return item.title ?? 'Course';
    if (activeTab === 'users') return item.full_name ?? item.user_id?.slice(0, 8) ?? 'User';
    return 'Item';
  };

  const getRowSubtitle = (item: AdminRow): string => {
    if (activeTab === 'reports') return `${item.type ?? ''} · ${item.status ?? ''}`;
    if (activeTab === 'actions') return `${item.type ?? ''} · ${item.priority ?? ''}`;
    if (activeTab === 'assets') return `${item.type ?? ''} · ${item.location ?? ''}`;
    if (activeTab === 'training') return item.category ?? '';
    if (activeTab === 'users') return `${item.role ?? ''} · ${item.department ?? ''}`;
    return '';
  };

  const renderRow: ListRenderItem<AdminRow> = ({ item }) => (
    <View style={S.row}>
      <Pressable onPress={() => handleEdit(item)} style={S.rowInfo} disabled={activeTab === 'training'}>
        <Text style={S.rowTitle} numberOfLines={2}>{getRowTitle(item)}</Text>
        <Text style={S.rowSub}>{getRowSubtitle(item)}</Text>
      </Pressable>
      <Pressable onPress={() => handleEdit(item)} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
        <Pencil size={15} color={C.accent} strokeWidth={2} />
      </Pressable>
      <Pressable
        onPress={() => handleDelete(activeTab === 'users' ? item.user_id : item.id)}
        style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}
      >
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
          keyExtractor={(item) => activeTab === 'users' ? item.user_id : item.id}
          renderItem={renderRow}
          contentContainerStyle={S.list}
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <CircleCheck size={40} color={C.faint} strokeWidth={1.5} />
              <Text style={S.emptyText}>No items found</Text>
            </View>
          }
        />
      )}
      {dialog}
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'success' })} />
      <Modal transparent animationType="fade" visible={!!roleModal} onRequestClose={() => setRoleModal(null)}>
        <Pressable style={S.modalOverlay} onPress={() => setRoleModal(null)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Change Role</Text>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => handleRoleChange(r)}
                style={({ pressed }) => [S.modalRow, roleModal?.currentRole === r && S.modalRowActive, pressed && S.pressed]}
              >
                <Text style={[S.modalRowText, roleModal?.currentRole === r && S.modalRowTextActive]}>{r}</Text>
                {roleModal?.currentRole === r && <CircleCheck size={18} color={C.accent} strokeWidth={2} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFF' },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabText: { fontSize: 12, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  rowSub: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.redBg, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.muted },
  pressed: { opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 12 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  modalRowActive: { borderColor: C.accent, backgroundColor: C.accentSoft },
  modalRowText: { fontSize: 16, fontWeight: '600', color: C.ink, textTransform: 'capitalize' },
  modalRowTextActive: { fontWeight: '800', color: C.accent },
});
