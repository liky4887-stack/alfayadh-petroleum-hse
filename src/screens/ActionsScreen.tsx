import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, Modal, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, ChevronRight, Pencil, Trash2, CircleCheck } from '@/lib/icons';
import { C } from '@/theme/colors';
import { BrandHeader, IconButton, StatusPill } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { softDelete } from '@/lib/softDelete';
import { useHSEStore } from '@/lib/store';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import { Toast } from '@/components/Toast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

type FilterKey = 'all' | 'todo' | 'in_progress' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To-Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Done' },
];

const PRIORITY_TONE: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  Critical: 'red', High: 'orange', Medium: 'yellow', Low: 'gray',
};

const STATUS_TONE: Record<string, 'blue' | 'yellow' | 'green'> = {
  todo: 'blue', in_progress: 'yellow', completed: 'green',
};

interface ActionItem {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  status: string;
  assignee: string | null;
  due_date: string | null;
}

export default function ActionsScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const { actions, loadActions } = useHSEStore();
  const { isAdmin } = useRole();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [quickAction, setQuickAction] = useState<ActionItem | null>(null);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadActions().finally(() => setLoading(false));
  }, [loadActions]));

  const filteredActions = actions.filter((a) => {
    if (a.deleted_at) return false;
    if (activeFilter === 'all') return true;
    return a.status === activeFilter;
  });

  const handleDelete = async (action: ActionItem) => {
    const isAdmin = await requireAdmin();
    if (!isAdmin) { setToast({ visible: true, msg: 'Admin access required', type: 'error' }); return; }
    haptics.impactMedium();
    setQuickAction(null);
    try {
      const result = await softDelete('actions', action.id);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Action archived', type: 'success' });
    } catch (err) {
      console.error('Delete error:', err);
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to delete', type: 'error' });
    }
  };

  const renderAction: ListRenderItem<ActionItem> = ({ item }) => (
    <Pressable
      onPress={() => { haptics.impactMedium(); navigation.navigate('ActionDetail', { actionId: item.id }); }}
      onLongPress={() => { if (isAdmin) { haptics.impactMedium(); setQuickAction(item); } }}
      style={({ pressed }) => [S.actionRow, pressed && S.pressed]}
    >
      <View style={S.rowTop}>
        {item.type && <View style={S.typeBadge}><Text style={S.typeBadgeText}>{item.type.toUpperCase()}</Text></View>}
        {item.priority && <StatusPill label={item.priority} tone={PRIORITY_TONE[item.priority] ?? 'gray'} />}
      </View>
      <Text style={S.actionTitle} numberOfLines={2}>{item.title}</Text>
      <View style={S.rowBottom}>
        <Text style={S.actionMeta}>{item.assignee ?? 'Unassigned'}</Text>
        <Text style={S.actionDue}>{item.due_date ?? 'No due date'}</Text>
        <StatusPill label={item.status} tone={STATUS_TONE[item.status] ?? 'blue'} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Actions"
        right={<IconButton icon={<Plus size={21} color="#0EA5E9" strokeWidth={2} />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />}
      />
      <View style={S.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => { haptics.impactMedium(); setActiveFilter(f.key); }}
            style={({ pressed }) => [S.filterChip, activeFilter === f.key && S.filterChipActive, pressed && S.pressed]}
          >
            <Text style={[S.filterChipText, activeFilter === f.key && S.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      ) : filteredActions.length === 0 ? (
        <View style={S.emptyState}>
          <CircleCheck size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={S.emptyTitle}>No actions yet</Text>
          <Text style={S.emptyText}>Tap + to create one</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActions}
          keyExtractor={(item) => item.id}
          renderItem={renderAction}
          contentContainerStyle={S.listContent}
        />
      )}
      <Pressable
        onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }}
        style={({ pressed }) => [S.fab, pressed && S.pressed]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      <Modal transparent animationType="fade" visible={!!quickAction} onRequestClose={() => setQuickAction(null)}>
        <Pressable style={S.modalOverlay} onPress={() => setQuickAction(null)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle} numberOfLines={1}>{quickAction?.title ?? 'Action'}</Text>
            <Pressable
              onPress={() => { const a = quickAction; setQuickAction(null); if (a) navigation.navigate('NewAction', { mode: 'edit', actionId: a.id }); }}
              style={({ pressed }) => [S.modalRow, pressed && S.pressed]}
            >
              <Pencil size={18} color="#0EA5E9" strokeWidth={2} />
              <Text style={S.modalRowText}>Edit</Text>
            </Pressable>
            {isAdmin && (
              <Pressable
                onPress={() => { if (quickAction) handleDelete(quickAction); }}
                style={({ pressed }) => [S.modalRow, pressed && S.pressed]}
              >
                <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                <Text style={[S.modalRowText, { color: '#DC2626' }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      <Toast message={toast.msg} type={toast.type} visible={toast.visible} onHide={() => setToast({ visible: false, msg: '', type: 'success' })} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  filterChipText: { fontSize: 13, fontFamily: 'Chevalon-SemiBold', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontFamily: 'Chevalon-Bold' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 12 },
  actionRow: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E0F2FE' },
  typeBadgeText: { fontSize: 10, fontFamily: 'Chevalon-Bold', color: '#0EA5E9', letterSpacing: 0.4 },
  actionTitle: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#0F172A' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  actionMeta: { fontSize: 12, fontFamily: 'Chevalon-Medium', color: '#64748B' },
  actionDue: { fontSize: 12, fontFamily: 'Chevalon-Regular', color: '#94A3B8' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Chevalon-Bold', color: '#0F172A' },
  emptyText: { fontSize: 14, fontFamily: 'Chevalon-Regular', color: '#64748B', textAlign: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 4 },
  modalTitle: { fontSize: 17, fontFamily: 'Chevalon-ExtraBold', color: '#0F172A', marginBottom: 12 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalRowText: { fontSize: 16, fontFamily: 'Chevalon-SemiBold', color: '#0F172A' },
  pressed: { opacity: 0.7 },
});
