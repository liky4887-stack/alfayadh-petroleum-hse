import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C, TYPE_LABELS, STATUS_LABELS, formatDate } from '@/theme/colors';
import { BrandHeader, IconButton } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import { Plus, ChevronRight } from '@/lib/icons';
import type { HSEReport } from '@/lib/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

type FilterKey = 'safe' | 'unsafe' | 'open' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'safe', label: 'Safe' },
  { key: 'unsafe', label: 'Unsafe' },
  { key: 'open', label: 'Open' },
];

export default function ActionsScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const [activeFilter, setActiveFilter] = useState<FilterKey>((route.params?.filter as FilterKey) ?? 'all');
  const [reports, setReports] = useState<HSEReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('hse_reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (activeFilter === 'safe') query = query.eq('type', 'safe');
    else if (activeFilter === 'unsafe') query = query.in('type', ['unsafe_condition', 'unsafe_act']);
    else if (activeFilter === 'open') query = query.eq('status', 'open');
    const { data } = await query;
    setReports(data ?? []);
    setLoading(false);
    console.log('[ActionsScreen] filter:', activeFilter, 'rows:', (data ?? []).length);
  }, [activeFilter]);

  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => { navigation.addListener('focus', loadReports); return () => navigation.removeListener('focus', loadReports); }, [navigation, loadReports]);

  useEffect(() => {
    const f = route.params?.filter as FilterKey | undefined;
    if (f) setActiveFilter(f);
  }, [route.params?.filter]);

  const handleFilterChange = (key: FilterKey) => {
    haptics.impactMedium();
    setActiveFilter(key);
  };

  const renderReport: ListRenderItem<HSEReport> = ({ item }) => {
    const typeColor = item.type === 'safe' ? '#16A34A' : '#DC2626';
    const typeBg = item.type === 'safe' ? '#E6F4EA' : '#FCE8E6';
    const isOpen = item.status === 'open';
    return (
      <Pressable
        onPress={() => { haptics.impactMedium(); navigation.navigate('ReportDetail', { reportId: item.id }); }}
        style={({ pressed }) => [S.reportRow, pressed && S.pressed]}
      >
        <View style={[S.typeBadge, { backgroundColor: typeBg }]}>
          <Text style={[S.typeBadgeText, { color: typeColor }]}>{TYPE_LABELS[item.type] ?? item.type}</Text>
        </View>
        <View style={S.reportBody}>
          <Text style={S.reportNote} numberOfLines={2}>{item.note}</Text>
          <View style={S.reportFooter}>
            {item.department && <Text style={S.reportDept}>{item.department}</Text>}
            <Text style={S.reportTime}>{formatDate(item.created_at)}</Text>
            <View style={[S.statusPill, { backgroundColor: isOpen ? '#FEF7E0' : '#E6F4EA' }]}>
              <Text style={[S.statusPillText, { color: isOpen ? '#EA580C' : '#16A34A' }]}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={16} color="#94A3B8" strokeWidth={2} />
      </Pressable>
    );
  };

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
            onPress={() => handleFilterChange(f.key)}
            style={({ pressed }) => [S.filterChip, activeFilter === f.key && S.filterChipActive, pressed && S.pressed]}
          >
            <Text style={[S.filterChipText, activeFilter === f.key && S.filterChipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      ) : reports.length === 0 ? (
        <View style={S.emptyState}>
          <Text style={S.emptyTitle}>No reports found</Text>
          <Text style={S.emptyText}>Reports matching this filter will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          contentContainerStyle={S.listContent}
        />
      )}
      <Pressable
        onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }}
        style={({ pressed }) => [S.fab, pressed && S.pressed]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 12 },
  reportRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  reportBody: { flex: 1, minWidth: 0 },
  reportNote: { fontSize: 14, fontWeight: '600', color: '#0F172A', lineHeight: 20, marginBottom: 8 },
  reportFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reportDept: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  reportTime: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptyText: { fontSize: 14, fontWeight: '400', color: '#64748B', textAlign: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pressed: { opacity: 0.7 },
});
