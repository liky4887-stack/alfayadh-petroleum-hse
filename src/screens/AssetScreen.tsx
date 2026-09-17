import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, MapPin, Pencil, Trash2, CircleCheck } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
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

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  type: string | null;
  location: string | null;
  status: string | null;
  image_url: string | null;
}

export default function AssetScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const { assets, loadAssets } = useHSEStore();
  const { isAdmin } = useRole();
  const [loading, setLoading] = useState(true);
  const [quickAction, setQuickAction] = useState<Asset | null>(null);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' as 'success' | 'error' });

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadAssets().finally(() => setLoading(false));
  }, [loadAssets]));

  const handleDelete = async (asset: Asset) => {
    const isAdmin = await requireAdmin();
    if (!isAdmin) { setToast({ visible: true, msg: 'Admin access required', type: 'error' }); return; }
    haptics.impactMedium();
    setQuickAction(null);
    try {
      const result = await softDelete('assets', asset.id);
      if (!result.ok) {
        haptics.notificationError();
        setToast({ visible: true, msg: result.error ?? 'Failed', type: 'error' });
        return;
      }
      haptics.notificationSuccess();
      setToast({ visible: true, msg: 'Asset archived', type: 'success' });
    } catch (err) {
      console.error('Delete error:', err);
      haptics.notificationError();
      setToast({ visible: true, msg: 'Failed to delete', type: 'error' });
    }
  };

  const getStatusTone = (status: string | null): 'green' | 'orange' | 'gray' => {
    if (status === 'active') return 'green';
    if (status === 'in_maintenance' || status === 'maintenance') return 'orange';
    return 'gray';
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Assets"
        right={
          <IconButton icon={<Plus size={18} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
        }
      />
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          {loading ? (
            <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
          ) : assets.length === 0 ? (
            <View style={S.emptyState}>
              <CircleCheck size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={S.emptyTitle}>No assets yet</Text>
              <Text style={S.emptyText}>Tap + to create one</Text>
            </View>
          ) : (
            <View style={S.assetList}>
              {assets.filter((a) => !a.deleted_at).map((asset, i) => (
                <Pressable
                  key={asset.id}
                  onPress={() => { haptics.impactMedium(); navigation.navigate('AssetDetail', { assetId: asset.id }); }}
                  onLongPress={() => { if (isAdmin) { haptics.impactMedium(); setQuickAction(asset); } }}
                  style={({ pressed }) => [S.assetCard, i === assets.length - 1 && S.assetCardLast, pressed && S.cardPressed]}
                >
                  <Image source={{ uri: asset.image_url || IMG.truck }} style={S.assetImage} />
                  <View style={S.assetInfo}>
                    <Text style={S.assetName}>{asset.name}</Text>
                    <Text style={S.assetCode}>{asset.asset_code}</Text>
                    <View style={S.assetMeta}>
                      <MapPin size={12} color="#94A3B8" strokeWidth={1.8} />
                      <Text style={S.assetLocation}>{asset.location ?? '—'}</Text>
                    </View>
                  </View>
                  <StatusPill label={asset.status ?? 'active'} tone={getStatusTone(asset.status)} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }}
        style={({ pressed }) => [S.fab, pressed && S.pressed]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      <Modal transparent animationType="fade" visible={!!quickAction} onRequestClose={() => setQuickAction(null)}>
        <Pressable style={S.modalOverlay} onPress={() => setQuickAction(null)}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle} numberOfLines={1}>{quickAction?.name ?? 'Asset'}</Text>
            <Pressable
              onPress={() => { const a = quickAction; setQuickAction(null); if (a) navigation.navigate('NewAsset', { mode: 'edit', assetId: a.id }); }}
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptyText: { fontSize: 14, fontWeight: '400', color: '#64748B' },
  assetList: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  assetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  assetCardLast: { borderBottomWidth: 0 },
  assetImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F1F5F9' },
  assetInfo: { flex: 1, minWidth: 0 },
  assetName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  assetCode: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 2 },
  assetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  assetLocation: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', gap: 4 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalRowText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  cardPressed: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});
