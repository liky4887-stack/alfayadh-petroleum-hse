import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin, Link2 } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { BrandHeader, IconButton, StatusPill } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
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

export default function AssetScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const haptics = useHapticFeedback();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [linkedActions, setLinkedActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: assetsData }] = await Promise.all([
        supabase.from('assets').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setAssets((assetsData ?? []) as Asset[]);
      if (assetsData && assetsData.length > 0) {
        const { data: actionsData } = await supabase
          .from('actions')
          .select('id, title, type, priority, status')
          .eq('asset_id', assetsData[0].id)
          .order('created_at', { ascending: false })
          .limit(10);
        setLinkedActions((actionsData ?? []) as ActionItem[]);
      }
      setLoading(false);
    };
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Assets"
        right={
          <View style={S.headerActions}>
            <IconButton icon={<Plus size={18} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} />
          </View>
        }
      />
      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          {loading ? (
            <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
          ) : assets.length === 0 ? (
            <View style={S.emptyState}>
              <Text style={S.emptyTitle}>No assets yet</Text>
              <Text style={S.emptyText}>Tap "Add Asset" to create your first asset.</Text>
            </View>
          ) : (
            <>
              <View style={S.assetHero}>
                <Image source={{ uri: assets[0]?.image_url || IMG.truck }} style={S.assetImage} />
                <View style={S.assetInfo}>
                  <View>
                    <Text style={S.assetId}>{assets[0]?.asset_code ?? '—'}</Text>
                    <Text style={S.assetType}>{assets[0]?.name ?? 'Asset'}</Text>
                  </View>
                  <View style={S.assetLocation}>
                    <MapPin size={14} color={C.muted} strokeWidth={1.8} />
                    <Text style={S.assetLocationText}>{assets[0]?.location ?? '—'}</Text>
                  </View>
                </View>
              </View>

              {linkedActions.length > 0 && (
                <>
                  <View style={S.sectionRow}>
                    <View style={S.sectionTitleRow}>
                      <Link2 size={18} color={C.accent} strokeWidth={2} />
                      <Text style={S.sectionLabel}>Related Actions</Text>
                    </View>
                  </View>
                  <View style={S.linkedActionsList}>
                    {linkedActions.map((action, i) => (
                      <View key={action.id} style={[S.linkedRow, i === linkedActions.length - 1 && S.linkedRowLast]}>
                        <View style={S.linkedInfo}>
                          <Text style={S.linkedTitle} numberOfLines={2}>{action.title}</Text>
                          <Text style={S.linkedMeta}>{action.type ?? 'Action'} · {action.priority ?? 'Normal'}</Text>
                        </View>
                        <StatusPill label={action.status} tone={action.status === 'completed' ? 'green' : action.status === 'overdue' ? 'red' : 'orange'} />
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={S.sectionRow}>
                <Text style={S.sectionLabel}>All Assets</Text>
                <Pressable onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} style={({ pressed }) => [S.addAssetBtn, pressed && S.cardPressed]}>
                  <Plus size={16} color="#FFF" strokeWidth={2.5} />
                  <Text style={S.addAssetText}>Add Asset</Text>
                </Pressable>
              </View>
              {assets.map((asset) => (
                <Pressable key={asset.id} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAsset'); }} style={({ pressed }) => [S.assetCard, pressed && S.cardPressed]}>
                  <Image source={{ uri: asset.image_url || IMG.truck }} style={S.assetCardImage} />
                  <View style={S.assetCardInfo}>
                    <Text style={S.assetCardName}>{asset.name}</Text>
                    <Text style={S.assetCardCode}>{asset.asset_code}</Text>
                  </View>
                  <StatusPill label={asset.status ?? 'active'} tone={asset.status === 'maintenance' ? 'orange' : 'green'} />
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  scroll: { flex: 1, backgroundColor: C.canvas },
  scrollContent: { paddingBottom: 110 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  headerActions: { flexDirection: 'row', gap: 2 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  emptyText: { fontSize: 14, fontWeight: '400', color: C.muted, textAlign: 'center' },
  assetHero: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginTop: 20 },
  assetImage: { width: '100%', height: 200 },
  assetInfo: { padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  assetId: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  assetType: { fontSize: 15, fontWeight: '500', color: C.inkSecondary, marginTop: 4 },
  assetLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  assetLocationText: { fontSize: 14, fontWeight: '600', color: C.inkSecondary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  addAssetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addAssetText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  linkedActionsList: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  linkedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  linkedRowLast: { borderBottomWidth: 0 },
  linkedInfo: { flex: 1, minWidth: 0 },
  linkedTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  linkedMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 3 },
  assetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  assetCardImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.surfaceAlt },
  assetCardInfo: { flex: 1, minWidth: 0 },
  assetCardName: { fontSize: 15, fontWeight: '700', color: C.ink },
  assetCardCode: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 2 },
  cardPressed: { opacity: 0.6 },
});
