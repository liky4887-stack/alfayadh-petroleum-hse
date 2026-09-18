import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme/theme';
import { TYPE_LABELS } from '@/theme/colors';
import { useHSEStore } from '@/lib/store';
import { LoadingState } from '@/components/ui';
import { Header } from '@/components/Header';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function AdminScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { reports, loading, loadReports, subscribeToReports } = useHSEStore();

  useEffect(() => {
    loadReports();
    const unsub = subscribeToReports();
    return unsub;
  }, [loadReports, subscribeToReports]);

  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.status === 'open').length;
    const closed = reports.filter((r) => r.status === 'closed').length;
    const safe = reports.filter((r) => r.type === 'safe').length;
    const unsafe = reports.filter((r) => r.type !== 'safe').length;
    return { total, open, closed, safe, unsafe };
  }, [reports]);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => { if (r.type !== 'safe' && r.department) counts[r.department] = (counts[r.department] ?? 0) + 1; });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = entries.length > 0 ? (entries[0]?.[1] ?? 1) : 1;
    return entries.map(([dept, count]) => ({ dept, count, pct: Math.round((count / max) * 100) }));
  }, [reports]);

  const recentOpen = useMemo(() => reports.filter((r) => r.status === 'open').slice(0, 10), [reports]);

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <Header title="Admin Dashboard" currentScreen="Admin" navigation={navigation} showBack />
        <View style={{ flex: 1 }}><LoadingState label="Loading data..." /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="Admin Dashboard" currentScreen="Admin" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View style={S.kpiRow}>
            <KPICard label="Total Reports" value={stats.total} color={theme.text} />
            <KPICard label="Open" value={stats.open} color={theme.danger} />
            <KPICard label="Closed" value={stats.closed} color={theme.success} />
          </View>
          <View style={S.kpiRow}>
            <KPICard label="Safe" value={stats.safe} color={theme.success} small />
            <KPICard label="Unsafe" value={stats.unsafe} color={theme.danger} small />
          </View>
          <View style={S.section}>
            <Text style={S.sectionTitle}>Most Frequent Problem Departments</Text>
            <View style={S.chartCard}>
              {deptCounts.length === 0 ? (
                <Text style={S.chartEmpty}>No data yet</Text>
              ) : (
                deptCounts.map(({ dept, count, pct }) => (
                  <View key={dept} style={S.barRow}>
                    <View style={S.barLabel}>
                      <Text style={S.barDept}>{dept}</Text>
                      <Text style={S.barCount}>{count}</Text>
                    </View>
                    <View style={S.barTrack}>
                      <View style={[S.barFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={S.section}>
            <Text style={S.sectionTitle}>Open Reports — Needs Action</Text>
            {recentOpen.length === 0 ? (
              <View style={S.emptyCard}><Text style={S.emptyText}>No open reports</Text></View>
            ) : (
              <View style={S.reportList}>
                {recentOpen.map((r, i) => (
                  <View key={r.id} style={[S.reportRow, i < recentOpen.length - 1 && S.reportBorder]}>
                    <View style={S.reportType}>
                      <Text style={S.reportTypeText}>{TYPE_LABELS[r.type] ?? r.type}</Text>
                      {r.department && <Text style={S.reportDept}>{r.department}</Text>}
                    </View>
                    <Text numberOfLines={1} style={S.reportNote}>{r.note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KPICard({ label, value, color, small }: { label: string; value: number; color: string; small?: boolean }) {
  return (
    <View style={S.kpiCard}>
      <Text style={[S.kpiValue, { color, fontSize: small ? 24 : 32 }]}>{value}</Text>
      <Text style={S.kpiLabel}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 24 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.card, paddingVertical: 20, paddingHorizontal: 16 },
  kpiValue: { fontFamily: 'Chevalon-Bold', fontVariant: ['tabular-nums'] },
  kpiLabel: { color: theme.textDim, fontSize: 12, marginTop: 4 },
  section: { gap: 12 },
  sectionTitle: { color: theme.textDim, fontSize: 14, fontFamily: 'Chevalon-Bold', letterSpacing: 0.3 },
  chartCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.card, padding: 16, gap: 14 },
  chartEmpty: { color: theme.textDim, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  barRow: { gap: 6 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barDept: { color: theme.text, fontSize: 13, fontFamily: 'Chevalon-SemiBold' },
  barCount: { color: theme.textDim, fontSize: 13, fontFamily: 'Chevalon-Bold', fontVariant: ['tabular-nums'] },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 3 },
  emptyCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.card, padding: 20, alignItems: 'center' },
  emptyText: { color: theme.success, fontSize: 14, fontFamily: 'Chevalon-SemiBold' },
  reportList: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.card },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  reportBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  reportType: { minWidth: 80 },
  reportTypeText: { color: theme.danger, fontSize: 12, fontFamily: 'Chevalon-Bold' },
  reportDept: { color: theme.textDim, fontSize: 11, marginTop: 2 },
  reportNote: { flex: 1, color: theme.text, fontSize: 14 },
});
