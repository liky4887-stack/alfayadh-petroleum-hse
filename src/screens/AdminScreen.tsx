import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Colors, TYPE_LABELS } from '@/lib/design';
import { useHSEStore } from '@/lib/store';
import { LoadingState } from '@/components/ui';
import type { ScreenName } from '@/components/Header';

export function AdminScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
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

  const recentOpen = useMemo(() =>
    reports.filter((r) => r.status === 'open').slice(0, 10),
    [reports]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.obsidian }}>
        <LoadingState label="جاري تحميل البيانات..." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.obsidian }}>
      <View style={{ padding: 20, gap: 24 }}>
        {/* KPI Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <KPICard label="إجمالي التقارير" value={stats.total} color={Colors.offWhite} />
          <KPICard label="مفتوحة" value={stats.open} color={Colors.red} />
          <KPICard label="مغلقة" value={stats.closed} color={Colors.green} />
        </View>

        {/* Secondary KPIs */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <KPICard label="وضع آمن" value={stats.safe} color={Colors.emerald} small />
          <KPICard label="وضع غير آمن" value={stats.unsafe} color={Colors.red} small />
        </View>

        {/* Bar Chart — Most frequent problem departments */}
        <View style={{ gap: 12 }}>
          <Text style={{ color: Colors.steel, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
            الأقسام الأكثر تكراراً للمشاكل
          </Text>
          <View style={{ borderWidth: 1, borderColor: Colors.graphite, borderRadius: 10, backgroundColor: Colors.slate, padding: 16, gap: 14 }}>
            {deptCounts.length === 0 ? (
              <Text style={{ color: Colors.steel, fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>
                لا توجد بيانات بعد
              </Text>
            ) : (
              deptCounts.map(({ dept, count, pct }) => (
                <View key={dept} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: Colors.offWhite, fontSize: 13, fontWeight: '600' }}>{dept}</Text>
                    <Text style={{ color: Colors.steel, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                      {count}
                    </Text>
                  </View>
                  <View style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: Colors.graphite,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: Colors.emerald,
                      borderRadius: 3,
                    }} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Open Reports List */}
        <View style={{ gap: 12 }}>
          <Text style={{ color: Colors.steel, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
            التقارير المفتوحة — تحتاج تدخل
          </Text>
          {recentOpen.length === 0 ? (
            <View style={{
              borderWidth: 1,
              borderColor: Colors.graphite,
              borderRadius: 10,
              backgroundColor: Colors.slate,
              padding: 20,
              alignItems: 'center',
            }}>
              <Text style={{ color: Colors.green, fontSize: 14, fontWeight: '600' }}>
                لا توجد تقارير مفتوحة
              </Text>
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderColor: Colors.graphite, borderRadius: 10, overflow: 'hidden' }}>
              {recentOpen.map((r, i) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: Colors.slate,
                    borderBottomWidth: i < recentOpen.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.graphite,
                    gap: 12,
                  }}
                >
                  <View style={{ minWidth: 80 }}>
                    <Text style={{ color: Colors.red, fontSize: 12, fontWeight: '700' }}>
                      {TYPE_LABELS[r.type] ?? r.type}
                    </Text>
                    {r.department && (
                      <Text style={{ color: Colors.steel, fontSize: 11, marginTop: 2 }}>{r.department}</Text>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ flex: 1, color: Colors.offWhite, fontSize: 14 }}>
                    {r.note}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function KPICard({ label, value, color, small }: { label: string; value: number; color: string; small?: boolean }) {
  return (
    <View style={{
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.graphite,
      borderRadius: 10,
      backgroundColor: Colors.slate,
      paddingVertical: small ? 14 : 20,
      paddingHorizontal: 16,
      alignItems: 'flex-start',
    }}>
      <Text style={{
        color,
        fontSize: small ? 24 : 32,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
      }}>
        {value}
      </Text>
      <Text style={{ color: Colors.steel, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}
