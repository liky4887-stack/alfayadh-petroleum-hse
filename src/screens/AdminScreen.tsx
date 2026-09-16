import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dark, TYPE_LABELS } from '@/theme/colors';
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
    reports.forEach((r) => {
      if (r.type !== 'safe' && r.department) {
        counts[r.department] = (counts[r.department] ?? 0) + 1;
      }
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = entries.length > 0 ? entries[0][1] : 1;
    return entries.map(([dept, count]) => ({ dept, count, pct: Math.round((count / max) * 100) }));
  }, [reports]);

  const recentOpen = useMemo(() => reports.filter((r) => r.status === 'open').slice(0, 10), [reports]);

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <Header title="لوحة المسؤول" currentScreen="Admin" navigation={navigation} showBack />
        <View style={{ flex: 1 }}>
          <LoadingState label="جاري تحميل البيانات..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="لوحة المسؤول" currentScreen="Admin" navigation={navigation} showBack />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <View style={S.kpiRow}>
            <KPICard label="إجمالي التقارير" value={stats.total} color={Dark.offWhite} />
            <KPICard label="مفتوحة" value={stats.open} color={Dark.red} />
            <KPICard label="مغلقة" value={stats.closed} color={Dark.green} />
          </View>
          <View style={S.kpiRow}>
            <KPICard label="وضع آمن" value={stats.safe} color={Dark.emerald} small />
            <KPICard label="وضع غير آمن" value={stats.unsafe} color={Dark.red} small />
          </View>

          <View style={S.section}>
            <Text style={S.sectionTitle}>الأقسام الأكثر تكراراً للمشاكل</Text>
            <View style={S.chartCard}>
              {deptCounts.length === 0 ? (
                <Text style={S.chartEmpty}>لا توجد بيانات بعد</Text>
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
            <Text style={S.sectionTitle}>التقارير المفتوحة — تحتاج تدخل</Text>
            {recentOpen.length === 0 ? (
              <View style={S.emptyCard}>
                <Text style={S.emptyText}>لا توجد تقارير مفتوحة</Text>
              </View>
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
  screen: { flex: 1, backgroundColor: Dark.obsidian },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 24 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: Dark.graphite, borderRadius: 10, backgroundColor: Dark.slate, paddingVertical: 20, paddingHorizontal: 16 },
  kpiValue: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  kpiLabel: { color: Dark.steel, fontSize: 12, marginTop: 4 },
  section: { gap: 12 },
  sectionTitle: { color: Dark.steel, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  chartCard: { borderWidth: 1, borderColor: Dark.graphite, borderRadius: 10, backgroundColor: Dark.slate, padding: 16, gap: 14 },
  chartEmpty: { color: Dark.steel, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  barRow: { gap: 6 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barDept: { color: Dark.offWhite, fontSize: 13, fontWeight: '600' },
  barCount: { color: Dark.steel, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: Dark.graphite, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Dark.emerald, borderRadius: 3 },
  emptyCard: { borderWidth: 1, borderColor: Dark.graphite, borderRadius: 10, backgroundColor: Dark.slate, padding: 20, alignItems: 'center' },
  emptyText: { color: Dark.green, fontSize: 14, fontWeight: '600' },
  reportList: { borderWidth: 1, borderColor: Dark.graphite, borderRadius: 10, overflow: 'hidden' },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: Dark.slate, gap: 12 },
  reportBorder: { borderBottomWidth: 1, borderBottomColor: Dark.graphite },
  reportType: { minWidth: 80 },
  reportTypeText: { color: Dark.red, fontSize: 12, fontWeight: '700' },
  reportDept: { color: Dark.steel, fontSize: 11, marginTop: 2 },
  reportNote: { flex: 1, color: Dark.offWhite, fontSize: 14 },
});
