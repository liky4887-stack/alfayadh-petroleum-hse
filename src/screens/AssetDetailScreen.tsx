import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Link2, CircleCheck, Pencil } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { StatusPill } from '@/components/Shared';
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

export default function AssetDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const assetId: string = route.params?.assetId ?? '';
  const [asset, setAsset] = useState<Asset | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}>
          <Text style={S.emptyText}>Asset not found.</Text>
          <Pressable onPress={() => navigation.goBack()}><Text style={S.backText}>Go Back</Text></Pressable>
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
        <View style={{ width: 70 }} />
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
            <Text style={S.sectionLabel}>Related Actions</Text>
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
                onPress={() => { haptics.impactMedium(); navigation.navigate('ReportDetail', { reportId: action.id }); }}
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
            <CircleCheck size={36} color={C.faint} strokeWidth={1.5} />
            <Text style={S.emptyText}>No actions linked to this asset.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: C.ink },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.ink, flex: 1, textAlign: 'center' },
  scrollContent: { paddingBottom: 100 },
  assetHero: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginHorizontal: 20, marginTop: 20 },
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
  actionList: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginHorizontal: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  actionRowLast: { borderBottomWidth: 0 },
  actionInfo: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  actionMeta: { fontSize: 12, fontWeight: '500', color: C.muted, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', color: C.muted, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
