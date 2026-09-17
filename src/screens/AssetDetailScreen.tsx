import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Link2, CircleCheck, Pencil, Trash2 } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { StatusPill } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useHSEStore } from '@/lib/store';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  type: string | null;
  location: string | null;
  status: string | null;
  image_url: string | null;
}

interface ActionItem {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  status: string;
}

export default function AssetDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const { loadAssets } = useHSEStore();
  const { isAdmin } = useRole();
  const assetId: string = route.params?.assetId ?? '';
  const [asset, setAsset] = useState<Asset | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: assetData } = await supabase.from('assets').select('*').eq('id', assetId).maybeSingle();
      setAsset(assetData as Asset | null);
      const { data: actionsData } = await supabase
        .from('actions')
        .select('id, title, type, priority, status')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .limit(20);
      setActions((actionsData ?? []) as ActionItem[]);
    } catch (err) {
      console.error('AssetDetail load error:', err);
    }
    setLoading(false);
  }, [assetId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleDelete = async () => {
    const ok = await requireAdmin();
    if (!ok) { Alert.alert('Access Denied', 'Admin access required to delete assets.'); return; }
    haptics.impactMedium();
    setDeleteModal(false);
    try {
      const { error } = await supabase.from('assets').delete().eq('id', assetId);
      if (error) {
        haptics.notificationError();
        Alert.alert('Error', `Failed to delete: ${error.message}`);
        return;
      }
      await loadAssets();
      haptics.notificationSuccess();
      navigation.goBack();
    } catch (err) {
      console.error('Delete error:', err);
      haptics.notificationError();
      Alert.alert('Error', 'Failed to delete asset.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.header}>
          <Pressable onPress={() => navigation.goBack()} style={S.backBtn}>
            <ChevronLeft size={20} color={C.ink} />
            <Text style={S.backText}>Back</Text>
          </Pressable>
          <Text style={S.headerTitle}>Asset Detail</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={S.loadingWrap}>
          <CircleCheck size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={S.emptyText}>Asset not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={S.goBackBtn}>
            <Text style={S.goBackText}>Go Back</Text>
          </Pressable>
        </View>
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
        <Text style={S.headerTitle}>Asset Detail</Text>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset', { mode: 'edit', assetId }); }} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
          <Pencil size={16} color="#0EA5E9" strokeWidth={2} />
          <Text style={S.editText}>Edit</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.assetHero}>
          <Image source={{ uri: asset.image_url || IMG.truck }} style={S.assetImage} />
          <View style={S.assetInfo}>
            <View>
              <Text style={S.assetId}>{asset.asset_code ?? '—'}</Text>
              <Text style={S.assetName}>{asset.name}</Text>
            </View>
            <StatusPill label={asset.status ?? 'active'} tone={asset.status === 'maintenance' ? 'orange' : 'green'} />
          </View>
        </View>

        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Type</Text>
          <Text style={S.infoValue}>{asset.type ?? '—'}</Text>
        </View>
        <View style={S.infoRow}>
          <Text style={S.infoLabel}>Location</Text>
          <View style={S.locationPill}>
            <MapPin size={14} color={C.muted} strokeWidth={1.8} />
            <Text style={S.infoValue}>{asset.location ?? '—'}</Text>
          </View>
        </View>

        <View style={S.sectionRow}>
          <View style={S.sectionTitleRow}>
            <Link2 size={18} color={C.accent} strokeWidth={2} />
            <Text style={S.sectionLabel}>Linked Actions</Text>
          </View>
          <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} style={({ pressed }) => [S.addActionBtn, pressed && S.pressed]}>
            <Pencil size={14} color={C.accent} strokeWidth={2} />
            <Text style={S.addActionText}>Add</Text>
          </Pressable>
        </View>

        {actions.length > 0 ? (
          <View style={S.actionList}>
            {actions.map((action, i) => (
              <Pressable
                key={action.id}
                onPress={() => { haptics.impactMedium(); navigation.navigate('ActionDetail', { actionId: action.id }); }}
                style={({ pressed }) => [S.actionRow, i === actions.length - 1 && S.actionRowLast, pressed && S.pressed]}
              >
                <View style={S.actionInfo}>
                  <Text style={S.actionTitle} numberOfLines={2}>{action.title}</Text>
                  <Text style={S.actionMeta}>{action.type ?? 'Action'} · {action.priority ?? 'Normal'}</Text>
                </View>
                <StatusPill label={action.status} tone={action.status === 'completed' ? 'green' : action.status === 'overdue' ? 'red' : 'orange'} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={S.emptyState}>
            <CircleCheck size={36} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={S.emptyText}>No actions linked to this asset.</Text>
          </View>
        )}
      </ScrollView>

      <View style={S.footer}>
        {isAdmin && (
          <Pressable onPress={() => setDeleteModal(true)} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
            <Trash2 size={18} color="#DC2626" strokeWidth={2} />
            <Text style={S.deleteText}>Delete Asset</Text>
          </Pressable>
        )}
      </View>

      <Modal transparent animationType="fade" visible={deleteModal} onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setDeleteModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Delete Asset?</Text>
            <Text style={S.modalSubtitle}>This action cannot be undone.</Text>
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
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E0F2FE' },
  editText: { fontSize: 14, fontWeight: '700', color: '#0EA5E9' },
  scrollContent: { paddingBottom: 100 },
  assetHero: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 20, marginTop: 20 },
  assetImage: { width: '100%', height: 200 },
  assetInfo: { padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  assetId: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  assetName: { fontSize: 15, fontWeight: '500', color: C.inkSecondary, marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: C.muted },
  infoValue: { fontSize: 15, fontWeight: '600', color: C.ink },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 28, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  addActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addActionText: { fontSize: 13, fontWeight: '700', color: C.accent },
  actionList: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginHorizontal: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  actionRowLast: { borderBottomWidth: 0 },
  actionInfo: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  actionMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center' },
  goBackBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#0EA5E9' },
  goBackText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
  deleteBtn: { minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
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
