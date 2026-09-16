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

type FilterKey = 'safe_reports' | 'unsafe_reports' | 'open_issues' | 'total_reports';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'total_reports', label: 'All' },
  { key: 'safe_reports', label: 'Safe' },
  { key: 'unsafe_reports', label: 'Unsafe' },
  { key: 'open_issues', label: 'Open' },
];

export default function ActionsScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const [activeFilter, setActiveFilter] = useState<FilterKey>((route.params?.filter as FilterKey) ?? 'total_reports');
  const [reports, setReports] = useState<HSEReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('hse_reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (activeFilter === 'safe_reports') query = query.eq('type', 'safe');
    else if (activeFilter === 'unsafe_reports') query = query.in('type', ['unsafe_condition', 'unsafe_act']);
    else if (activeFilter === 'open_issues') query = query.eq('status', 'open');
    const { data } = await query;
    setReports(data ?? []);
    setLoading(false);
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
    const typeColor = item.type === 'safe' ? C.green : C.red;
    const typeBg = item.type === 'safe' ? C.greenBg : C.redBg;
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
            <View style={[S.statusPill, { backgroundColor: isOpen ? C.orangeBg : C.greenBg }]}>
              <Text style={[S.statusPillText, { color: isOpen ? C.orange : C.green }]}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={16} color={C.faint} strokeWidth={2} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Actions"
        right={<IconButton icon={<Plus size={21} color={C.accent} strokeWidth={2} />} onPress={() => { haptics.impactMedium(); navigation.navigate('NewAction'); }} />}
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
        <View style={S.loadingWrap}><ActivityIndicator size="large" color={C.accent} /></View>
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
        <Plus size={26} color="#FFF" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: C.border },
  filterChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF' },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterChipTextActive: { color: '#FFF', fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 12 },
  reportRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  reportBody: { flex: 1, minWidth: 0 },
  reportNote: { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20, marginBottom: 8 },
  reportFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reportDept: { fontSize: 12, fontWeight: '500', color: C.muted },
  reportTime: { fontSize: 12, fontWeight: '400', color: C.faint },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
  emptyText: { fontSize: 14, fontWeight: '400', color: C.muted, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  pressed: { opacity: 0.7 },
});
