import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CircleCheck, Pencil, Trash2, MapPin, Link2, Clock, UserRound, RefreshCw } from '@/lib/icons';
import { softDelete, restoreRow } from '@/lib/softDelete';
import { C, IMG } from '@/theme/colors';
import { StatusPill } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/useRole';
import { requireAdmin } from '@/lib/requireAdmin';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface AssetItem {
  id: string;
  asset_code: string;
  name: string;
  type: string | null;
  location: string | null;
  status: string | null;
  image_url: string | null;
  deleted_at: string | null;
}

const STATUS_TONE: Record<string, 'green' | 'orange' | 'gray'> = {
  active: 'green',
  in_maintenance: 'orange',
  maintenance: 'orange',
};

export default function AssetDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const { isAdmin } = useRole();
  const assetId: string = route.params?.assetId ?? '';
  const [asset, setAsset] = useState<AssetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [archivedModal, setArchivedModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('assets').select('*').eq('id', assetId).maybeSingle();
      setAsset(data as AssetItem | null);
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
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      haptics.notificationError();
      Alert.alert('Access Denied', 'Admin access required to delete.');
      return;
    }
    const confirmed = await confirm({
      title: 'Delete asset?',
      message: 'It will be moved to archive. You can restore it later.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    haptics.impactMedium();
    try {
      const result = await softDelete('assets', assetId);
      if (!result.ok) {
        haptics.notificationError();
        Alert.alert('Error', result.error ?? 'Delete failed');
        return;
      }
      haptics.notificationSuccess();
      setTimeout(() => navigation.goBack(), 500);
    } catch (err) {
      console.error('Delete error:', err);
      haptics.notificationError();
      Alert.alert('Error', 'Failed to delete asset.');
    }
  };

  const handleRestore = async () => {
    haptics.impactMedium();
    try {
      const result = await restoreRow('assets', assetId);
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
          <Pressable onPress={() => navigation.goBack()} style={S.backBtn}><Text style={S.backText}>Go Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isDeleted = !!asset.deleted_at;

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Asset Detail</Text>
        <View style={{ width: 70 }} />
      </View>

      {isDeleted && (
        <View style={S.archivedBanner}>
          <Text style={S.archivedBannerText}>
            ⚠ This item is archived (deleted on {new Date(asset.deleted_at).toLocaleDateString()})
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.topRow}>
          <Text style={S.assetCode}>{asset.asset_code}</Text>
          <StatusPill label={asset.status ?? 'active'} tone={STATUS_TONE[asset.status ?? 'active']} />
        </View>

        <Text style={S.assetName}>{asset.name}</Text>

        <View style={S.infoCard}>
          {asset.type && (
            <View style={S.metaRow}>
              <Text style={S.metaLabel}>Type</Text>
              <Text style={S.metaValue}>{asset.type}</Text>
            </View>
          )}
          <View style={S.metaRow}>
            <Text style={S.metaLabel}>Location</Text>
            <Text style={S.metaValue}>{asset.location ?? '—'}</Text>
          </View>
          {asset.image_url && (
            <View style={S.imageWrap}>
              <Image source={{ uri: asset.image_url }} style={S.image} />
            </View>
          )}
        </View>

        <View style={S.imageWrap}>
          <Image source={{ uri: asset.image_url || IMG.truck }} style={S.imageLarge} />
        </View>

        <View style={S.actionsRow}>
          <Pressable style={({ pressed }) => [S.mapBtn, pressed && S.pressed]}>
            <MapPin size={14} color={C.accent} strokeWidth={2} />
            <Text style={S.mapBtnText}>View on map</Text>
          </Pressable>
        </View>

        <View style={S.footer}>
          {isDeleted ? (
            <Pressable onPress={() => setArchivedModal(true)} style={({ pressed }) => [S.restoreBtn, pressed && S.pressed]}>
              <RefreshCw size={16} color={C.accent} strokeWidth={2} />
              <Text style={[S.deleteText, { color: C.accent }]}>Restore</Text>
            </Pressable>
          ) : (
            <>
              {isAdmin && (
                <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset', { mode: 'edit', assetId: asset.id }); }} style={({ pressed }) => [S.editBtn, pressed && S.pressed]}>
                  <Pencil size={16} color="#0EA5E9" strokeWidth={2} />
                  <Text style={S.editBtnText}>Edit</Text>
                </Pressable>
              )}
              {isAdmin && (
                <Pressable onPress={() => setDeleteModal(true)} style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}>
                  <Trash2 size={16} color={C.red} strokeWidth={2} />
                  <Text style={S.deleteBtnText}>Delete</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={deleteModal} onRequestClose={() => setDeleteModal(false)}>
        <Pressable style={S.modalOverlay} onPress={() => setDeleteModal(false)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Delete Asset?</Text>
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
            <Text style={S.modalTitle}>Restore Asset?</Text>
            <Text style={S.modalSubtitle}>This will unarchive the asset and make it visible again.</Text>
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
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink },
  headerTitle: { fontSize: 17, fontFamily: 'Chevalon-ExtraBold', color: C.ink, flex: 1, textAlign: 'center' },
  archivedBanner: { backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  archivedBannerText: { fontSize: 13, fontFamily: 'Chevalon-SemiBold', color: '#DC2626', textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assetCode: { fontSize: 14, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  assetName: { fontSize: 22, fontFamily: 'Chevalon-ExtraBold', color: C.ink, marginBottom: 4 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginHorizontal: 0, marginBottom: 12, gap: 14 },
  metaLabel: { fontSize: 14, fontFamily: 'Chevalon-SemiBold', color: C.muted, minWidth: 90 },
  metaValue: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imageWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  image: { width: '100%', height: 120, resizeMode: 'cover' },
  imageLarge: { width: '100%', height: 220, resizeMode: 'cover', borderRadius: 14 },
  actionsRow: { gap: 8 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  mapBtnText: { fontSize: 13, fontFamily: 'Chevalon-Bold', color: C.accent },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#0EA5E9', backgroundColor: '#E0F2FE' },
  editBtnText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: '#0EA5E9' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: C.red },
  deleteBtnText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: C.red },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  restoreBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#0EA5E9', backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#DC2626' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 18, fontFamily: 'Chevalon-ExtraBold', color: C.ink },
  modalSubtitle: { fontSize: 14, fontFamily: 'Chevalon-Regular', color: C.muted, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 16, fontFamily: 'Chevalon-SemiBold', color: C.muted },
  modalDeleteBtn: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  modalDeleteText: { fontSize: 16, fontFamily: 'Chevalon-Bold', color: '#FFF' },
  pressed: { opacity: 0.7 },
});
