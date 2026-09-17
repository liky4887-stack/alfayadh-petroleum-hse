import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CircleCheck, Pencil, Trash2, Check, Link2, Clock, UserRound, RefreshCw } from '@/lib/icons';
import { softDelete, restoreRow } from '@/lib/softDelete';
import { C, IMG } from '@/theme/colors';
import { StatusPill } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { useConfirm } from '@/components/ConfirmDialog';
import { supabase } from '@/lib/supabase';
import { useHSEStore } from '@/lib/store';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  assignee: string | null;
  due_date: string | null;
  status: string;
  image_url: string | null;
  asset_id: string | null;
  deleted_at: string | null;
}

interface AssetInfo {
  id: string;
  name: string;
  asset_code: string;
}

const PRIORITY_TONE: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  Critical: 'red', High: 'orange', Medium: 'yellow', Low: 'gray',
};

export default function ActionDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const { confirm } = useConfirm();
  const { loadActions } = useHSEStore();
  const { isAdmin } = useRole();
  const actionId: string = route.params?.actionId ?? '';
  const [action, setAction] = useState<ActionItem | null>(null);
  const [linkedAsset, setLinkedAsset] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archivedModal, setArchivedModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('actions').select('*').eq('id', actionId).maybeSingle();
      const a = data as ActionItem | null;
      setAction(a);
      if (a?.asset_id) {
        const { data: assetData } = await supabase.from('assets').select('id, name, asset_code').eq('id', a.asset_id).maybeSingle();
        setLinkedAsset(assetData as AssetInfo | null);
      } else {
        setLinkedAsset(null);
      }
    } catch (err) {
      console.error('ActionDetail load error:', err);
    }
    setLoading(false);
  }, [actionId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleComplete = async () => {
    haptics.impactMedium();
    try {
      const { error } = await supabase.from('actions').update({ status: 'completed' }).eq('id', actionId);
      if (error) {
        haptics.notificationError();
        Alert.alert('Error', `Failed: ${error.message}`);
        return;
      }
      await loadActions();
      haptics.notificationSuccess();
      load();
    } catch (err) {
      console.error('Complete error:', err);
      haptics.notificationError();
    }
  };

  const handleDelete = async () => {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      haptics.notificationError();
      Alert.alert('Access Denied', 'Admin access required to delete.');
      return;
    }
    const confirmed = await confirm({
      title: 'Delete action?',
      message: 'It will be moved to archive. You can restore it later.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    haptics.impactMedium();
    try {
      const result = await softDelete('actions', actionId);
      if (!result.ok) {
        haptics.notificationError();
        Alert.alert('Error', result.error ?? 'Delete failed');
        return;
      }
      haptics.notificationSuccess();
      loadActions();
      setTimeout(() => navigation.goBack(), 500);
    } catch (err) {
      console.error('Delete error:', err);
      haptics.notificationError();
      Alert.alert('Error', 'Failed to delete action.');
    }
  };

  const handleRestore = async () => {
    haptics.impactMedium();
    try {
      const result = await restoreRow('actions', actionId);
      if (!result.ok) {
        haptics.notificationError();
        Alert.alert('Error', result.error ?? 'Restore failed');
        return;
      }
      haptics.notificationSuccess();
      setArchivedModal(false);
      load();
    } catch (err) {
      haptics.notificationError();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      </SafeAreaView>
    );
  }

  if (!action) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.header}>
          <Pressable onPress={() => navigation.goBack()} style={S.backBtn}>
            <ChevronLeft size={20} color={C.ink} />
            <Text style={S.backText}>Back</Text>
          </Pressable>
          <Text style={S.headerTitle}>Action Detail</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={S.loadingWrap}>
          <CircleCheck size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={S.emptyText}>Action not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={S.goBackBtn}>
            <Text style={S.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDeleted = !!action.deleted_at;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Action Detail</Text>
        <View style={{ width: 70 }} />
      </View>

      {isDeleted && (
        <View style={S.archivedBanner}>
          <Text style={S.archivedBannerText}>
            ⚠ This item is archived (deleted on {new Date(action.deleted_at).toLocaleDateString()})
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        {action.image_url && (
          <Image source={{ uri: action.image_url }} style={S.actionImage} />
        )}

        <View style={S.titleSection}>
          <View style={S.badgeRow}>
            {action.type && (
              <View style={S.typeBadge}>
                <Text style={S.typeBadgeText}>{action.type.toUpperCase()}</Text>
              </View>
            )}
            {action.subcategory && (
              <View style={[S.typeBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[S.typeBadgeText, { color: '#92400E' }]}>{action.subcategory}</Text>
              </View>
            )}
            <StatusPill label={action.status} tone={PRIORITY_TONE[action.status] ?? 'gray'} />
            <StatusPill label={action.priority ?? 'Low'} tone={PRIORITY_TONE[action.priority ?? 'Low']} />
          </View>
          <Text style={S.actionTitle}>{action.title}</Text>
        </View>

        <View style={S.infoCard}>
          <View style={S.metaRow}>
            <Text style={S.metaLabel}>Description</Text>
          </View>
          <Text style={S.descriptionText}>{action.description ?? 'No description provided.'}</Text>

          <View style={S.metaRow}>
            <Text style={S.metaLabel}>Assignee</Text>
            <Text style={S.metaValue}>{action.assignee ?? 'Unassigned'}</Text>
          </View>

          <View style={S.metaRow}>
            <Text style={S.metaLabel}>Due Date</Text>
            <Text style={S.metaValue}>{action.due_date ?? 'No due date'}</Text>
          </View>

          {action.asset_id && linkedAsset && (
            <Pressable onPress={() => navigation.navigate('AssetDetail', { assetId: linkedAsset.id })} style={S.metaRow}>
              <Text style={S.metaLabel}>Asset</Text>
              <Text style={S.metaValueLink}>{linkedAsset.asset_code} — {linkedAsset.name}</Text>
              <Link2 size={14} color={C.accent} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <View style={S.footer}>
          {action.status !== 'completed' && (
            <Pressable onPress={handleComplete} style={({ pressed }) => [S.completeBtn, pressed && S.pressed]}>
              <Check size={18} color="#16A34A" strokeWidth={2.5} />
              <Text style={S.completeText}>Mark Complete</Text>
            </Pressable>
          )}

          {isDeleted ? (
            <Pressable onPress={() => setArchivedModal(true)} style={({ pressed }) => [S.restoreBtn, pressed && S.pressed]}>
              <RefreshCw size={16} color={C.accent} strokeWidth={2} />
              <Text style={[S.deleteText, { color: C.accent }]}>Restore</Text>
            </Pressable>
          ) : (
            isAdmin && (
              <Pressable onPress={() => setDeleteModal(true)} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
                <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                <Text style={S.deleteText}>Delete</Text>
              </Pressable>
            )
          )}
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={deleteModal} onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setDeleteModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Delete Action?</Text>
            <Text style={S.modalSubtitle}>It will be moved to archive. You can restore it later.</Text>
            <View style={S.modalBtns}>
              <Pressable onPress={() => setDeleteModal(false)} style={S.modalCancelBtn}>
                <Text style={S.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDelete} style={S.modalDeleteBtn}>
                <Text style={S.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={archivedModal} onRequestClose={() => setArchivedModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setArchivedModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Restore Action?</Text>
            <Text style={S.modalSubtitle}>This will unarchive the action and make it visible again.</Text>
            <View style={S.modalBtns}>
              <Pressable onPress={() => setArchivedModal(false)} style={S.modalCancelBtn}>
                <Text style={S.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRestore} style={[S.modalDeleteBtn, { backgroundColor: '#0EA5E9' }]}>
                <Text style={S.modalDeleteText}>Restore</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  archivedBanner: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  archivedBannerText: { fontSize: 13, fontWeight: '600', color: '#DC2626', textAlign: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E0F2FE' },
  editText: { fontSize: 14, fontWeight: '700', color: '#0EA5E9' },
  scrollContent: { paddingBottom: 100 },
  actionImage: { width: '100%', height: 220, resizeMode: 'cover' },
  titleSection: { padding: 20, gap: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E0F2FE' },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#0EA5E9', letterSpacing: 0.4 },
  actionTitle: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginHorizontal: 20, marginBottom: 12, gap: 14 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: C.muted },
  descriptionText: { fontSize: 15, fontWeight: '400', color: C.ink, lineHeight: 22, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaLabel: { fontSize: 14, fontWeight: '600', color: C.muted, minWidth: 90 },
  metaValue: { fontSize: 15, fontWeight: '600', color: C.ink, flex: 1 },
  metaValueLink: { fontSize: 15, fontWeight: '700', color: '#0EA5E9', flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center' },
  goBackBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#0EA5E9' },
  goBackText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
  completeBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#16A34A', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeText: { fontSize: 16, fontWeight: '700', color: '#16A34A' },
  restoreBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#0EA5E9', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  modalSubtitle: { fontSize: 14, fontWeight: '400', color: C.muted, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: C.muted },
  modalDeleteBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  modalDeleteText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  pressed: { opacity: 0.7 },
});
