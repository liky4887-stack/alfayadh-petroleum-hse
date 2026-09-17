import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, ListRenderItem, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/theme/theme';
import { useHapticFeedback } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import { Toast } from '@/components/Toast';
import { ChevronLeft, Trash2, Pencil, CircleCheck, LogOut, Share2, RefreshCw } from '@/lib/icons';
import { exportHSEReport } from '@/lib/pdfReport';
import { useT } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { softDelete } from '@/lib/softDelete';
import { restoreRow } from '@/lib/softDelete';

type TabKey = 'reports' | 'actions' | 'assets' | 'training' | 'users' | 'audit';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'actions', label: 'Actions' },
  { key: 'assets', label: 'Assets' },
  { key: 'training', label: 'Training' },
  { key: 'users', label: 'Users' },
  { key: 'audit', label: 'Audit Log' },
];

const TABLE_MAP: Record<TabKey, string> = {
  reports: 'hse_reports',
  actions: 'actions',
  assets: 'assets',
  training: 'training_courses',
  users: 'user_roles',
  audit: 'audit_log',
};

interface AdminRow {
  id: string;
  [key: string]: any;
}

interface AuditRow {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  user_id: string | null;
  user_email: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

export default function AdminPanelScreen({ navigation }: { navigation: any }) {
  const t = useT();
  const haptics = useHapticFeedback();
  const { confirm, dialog } = useConfirm();
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState<TabKey>('reports');
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [auditModal, setAuditModal] = useState<AuditRow | null>(null);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, showDeleted]);

  const loadTab = async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'audit') {
        const { data } = await supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        setRows((data ?? []) as AdminRow[]);
        setLoading(false);
        return;
      }

      const table = TABLE_MAP[tab];
      let query = supabase.from(table).select('*');
      if (!showDeleted) {
        query = query.is('deleted_at', null);
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(100);
      setRows((data ?? []) as AdminRow[]);
    } catch (err: any) {
      console.error('loadTab error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTab = (tab: TabKey) => {
    haptics.impactMedium();
    setActiveTab(tab);
    setShowDeleted(false);
  };

  const handleDelete = async (row: AdminRow) => {
    const ok = await confirm({
      title: 'Archive this item?',
      message: 'It will be marked as deleted and can be restored later.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;
    try {
      const table = TABLE_MAP[activeTab];
      const result = await softDelete(table, row.id);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Item archived', type: 'success' });
      loadTab(activeTab);
    } catch (err: any) {
      haptics.notificationError();
      setToast({ visible: true, msg: String(err?.message ?? err), type: 'error' });
    }
  };

  const handleRestore = async (row: AdminRow) => {
    try {
      const table = TABLE_MAP[activeTab];
      const result = await restoreRow(table, row.id);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Item restored', type: 'success' });
      loadTab(activeTab);
    } catch (err: any) {
      haptics.notificationError();
      setToast({ visible: true, msg: String(err?.message ?? err), type: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const base64 = await exportHSEReport();
      if (base64) {
        haptics.notificationSuccess();
        setToast({ visible: true, msg: 'Report exported', type: 'success' });
      } else {
        throw new Error('Export failed');
      }
    } catch (err: any) {
      haptics.notificationError();
      setToast({ visible: true, msg: String(err?.message ?? err), type: 'error' });
    }
  };

  const getAuditColor = (action: string) => {
    switch (action) {
      case 'insert': return '#16A34A';
      case 'update': return '#0EA5E9';
      case 'delete': return '#DC2626';
      case 'soft_delete': return '#EA580C';
      case 'restore': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const renderRow: ListRenderItem<AdminRow> = ({ item }) => {
    if (activeTab === 'audit') {
      const audit = item as unknown as AuditRow;
      return (
        <Pressable
          onPress={() => setAuditModal(audit)}
          style={({ pressed }) => [S.auditRow, pressed && { opacity: 0.7 }]}
        >
          <View style={S.auditTop}>
            <View style={[S.auditBadge, { backgroundColor: getAuditColor(audit.action) + '22' }]}>
              <Text style={[S.auditBadgeText, { color: getAuditColor(audit.action) }]}>
                {audit.action.toUpperCase()}
              </Text>
            </View>
            <Text style={S.auditTime}>{timeAgo(audit.created_at)}</Text>
          </View>
          <Text style={S.auditTable}>{audit.table_name}</Text>
          <Text style={S.auditId}>ID: {audit.record_id?.slice(0, 8)}</Text>
        </Pressable>
      );
    }

    return (
      <View style={[S.row, item.deleted_at && S.rowDeleted]}>
        <View style={S.rowInfo}>
          <Text style={[S.rowTitle, item.deleted_at && S.rowTitleDeleted]}>
            {item.title ?? item.name ?? item.asset_code ?? item.full_name ?? 'Item'}
          </Text>
          {item.deleted_at && (
            <Text style={S.deletedBadge}>DELETED</Text>
          )}
        </View>
        <View style={S.rowActions}>
          {item.deleted_at ? (
            <Pressable
              onPress={() => handleRestore(item)}
              style={({ pressed }) => [S.restoreBtn, pressed && { opacity: 0.6 }]}
            >
              <RefreshCw size={16} color={theme.primary} strokeWidth={2} />
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => haptics.impactMedium()} style={({ pressed }) => [S.editBtn, pressed && { opacity: 0.6 }]}>
                <Pencil size={16} color={theme.primary} strokeWidth={2} />
              </Pressable>
              {activeTab !== 'users' && (
                <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [S.deleteBtn, pressed && { opacity: 0.6 }]}>
                  <Trash2 size={16} color={theme.danger} strokeWidth={2} />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={S.screen}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Admin Panel</Text>
        <Pressable onPress={handleExport} style={S.exportBtn}>
          <Share2 size={18} color="#FFF" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={S.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTab(tab.key)}
            style={({ pressed }) => [S.tab, activeTab === tab.key && S.tabActive, pressed && S.pressed]}
          >
            <Text style={[S.tabText, activeTab === tab.key && S.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setShowDeleted((v) => !v)}
        style={[S.deletedToggle, showDeleted && S.deletedToggleActive]}
      >
        <Text style={[S.deletedToggleText, showDeleted && S.deletedToggleTextActive]}>
          {showDeleted ? 'Showing archived' : 'Show archived'}
        </Text>
      </Pressable>

      {activeTab !== 'audit' && rows.length > 0 && (
        <View style={S.countBadge}>
          <Text style={S.countText}>{rows.length} items</Text>
        </View>
      )}

      {loading ? (
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => activeTab === 'audit' ? item.id : item.id}
          renderItem={renderRow}
          contentContainerStyle={S.list}
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <CircleCheck size={40} color={theme.textFaint} strokeWidth={1.5} />
              <Text style={S.emptyText}>{showDeleted ? 'No archived items' : 'No items found'}</Text>
            </View>
          }
        />
      )}

      {dialog}
      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'success' })} />

      {auditModal && (
        <Modal transparent animationType="fade" visible={!!auditModal} onRequestClose={() => setAuditModal(null)}>
          <Pressable style={S.modalOverlay} onPress={() => setAuditModal(null)}>
            <View style={S.modalCard}>
              <Text style={S.modalTitle}>Audit Entry</Text>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>Table:</Text>
                <Text style={S.auditModalValue}>{auditModal.table_name}</Text>
              </View>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>Record ID:</Text>
                <Text style={S.auditModalValue}>{auditModal.record_id}</Text>
              </View>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>Action:</Text>
                <Text style={[S.auditModalValue, { color: getAuditColor(auditModal.action) }]}>{auditModal.action.toUpperCase()}</Text>
              </View>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>Time:</Text>
                <Text style={S.auditModalValue}>{new Date(auditModal.created_at).toLocaleString()}</Text>
              </View>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>User ID:</Text>
                <Text style={S.auditModalValue}>{auditModal.user_id ?? '—'}</Text>
              </View>
              <View style={S.auditModalRow}>
                <Text style={S.auditModalLabel}>User Email:</Text>
                <Text style={S.auditModalValue}>{auditModal.user_email ?? '—'}</Text>
              </View>

              <Text style={S.modalSubtitle}>Before</Text>
              <View style={S.jsonBox}>
                <Text style={S.jsonText}>{JSON.stringify(auditModal.before_data, null, 2) ?? '—'}</Text>
              </View>

              <Text style={S.modalSubtitle}>After</Text>
              <View style={S.jsonBox}>
                <Text style={S.jsonText}>{JSON.stringify(auditModal.after_data, null, 2) ?? '—'}</Text>
              </View>

              <Pressable
                onPress={() => setAuditModal(null)}
                style={({ pressed }) => [S.modalCloseBtn, pressed && S.pressed]}
              >
                <Text style={S.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const C = { ink: '#0F172A' };

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: theme.text },
  headerTitle: { fontSize: 17, fontWeight: '800', color: theme.text, flex: 1, textAlign: 'center' },
  exportBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  tab: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  tabActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: theme.textDim },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  deletedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginHorizontal: 12, marginTop: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  deletedToggleText: { fontSize: 12, fontWeight: '600', color: theme.textDim },
  deletedToggleActive: { backgroundColor: '#FEF7E0', borderColor: '#EA580C' },
  deletedToggleTextActive: { color: '#EA580C', fontWeight: '700' },
  countBadge: { alignSelf: 'center', marginTop: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: theme.primaryLight },
  countText: { fontSize: 11, fontWeight: '700', color: theme.primary },
  list: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  rowDeleted: { opacity: 0.5, borderColor: '#FCA5A5' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  rowTitleDeleted: { textDecorationLine: 'line-through', color: '#64748B' },
  deletedBadge: { fontSize: 10, fontWeight: '700', color: '#DC2626', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.dangerLight, alignItems: 'center', justifyContent: 'center' },
  restoreBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: theme.textDim },
  auditRow: { padding: 14, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  auditTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  auditBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  auditBadgeText: { fontSize: 10, fontWeight: '700' },
  auditTime: { fontSize: 11, color: theme.textDim },
  auditTable: { fontSize: 13, fontWeight: '700', color: theme.text },
  auditId: { fontSize: 11, color: theme.textDim, marginTop: 2 },
  auditModalRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  auditModalLabel: { fontSize: 12, fontWeight: '600', color: theme.textDim, minWidth: 70 },
  auditModalValue: { fontSize: 12, fontWeight: '500', color: theme.text, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.card, borderRadius: 16, padding: 20, width: '100%', gap: 8, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, fontWeight: '700', color: theme.textDim, marginTop: 8, textTransform: 'uppercase' },
  jsonBox: { backgroundColor: theme.bg, borderRadius: 8, padding: 10, maxHeight: 120, borderWidth: 1, borderColor: theme.border },
  jsonText: { fontSize: 10, fontFamily: 'monospace', color: theme.text, flex: 1 },
  modalCloseBtn: { paddingVertical: 12, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center', marginTop: 8 },
  modalCloseText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
