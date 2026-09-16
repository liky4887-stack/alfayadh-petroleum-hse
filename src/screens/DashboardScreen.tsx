import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Colors, Typography, formatDate, TYPE_LABELS } from '@/lib/design';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/hooks/useHaptics';
import { StatusBadge, LoadingState } from '@/components/ui';
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import type { ScreenName } from '@/components/Header';

export function DashboardScreen({ onNavigate }: { onNavigate: (s: ScreenName) => void }) {
  const { reports, loading, loadReports } = useHSEStore();
  const haptics = useHapticFeedback();

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const recentReports = useMemo(() => reports.slice(0, 30), [reports]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.obsidian }}>
      <View style={{ padding: 20, gap: 16 }}>
        {/* Two action blocks */}
        <Pressable
          onPress={() => { haptics.impactMedium(); onNavigate('safe'); }}
          style={({ hovered, pressed }) => ({
            borderWidth: 1,
            borderColor: Colors.emerald,
            backgroundColor: pressed ? Colors.emeraldBg : hovered ? Colors.emeraldBg : Colors.slate,
            borderRadius: 12,
            padding: 22,
            minHeight: 72,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          })}
        >
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${Colors.emerald}55`,
            backgroundColor: Colors.emeraldBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color={Colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.emerald, fontSize: 18, fontWeight: '800' }}>وضع آمن</Text>
            <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 2 }}>سلوك أو حالة آمنة — توثيق إيجابي</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => { haptics.impactMedium(); onNavigate('unsafe'); }}
          style={({ hovered, pressed }) => ({
            borderWidth: 1,
            borderColor: Colors.red,
            backgroundColor: pressed ? Colors.redBg : hovered ? Colors.redBg : Colors.slate,
            borderRadius: 12,
            padding: 22,
            minHeight: 72,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          })}
        >
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${Colors.red}55`,
            backgroundColor: Colors.redBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color={Colors.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.red, fontSize: 18, fontWeight: '800' }}>وضع غير آمن</Text>
            <Text style={{ color: Colors.steel, fontSize: 13, marginTop: 2 }}>حالة أو تصرف غير آمن — يحتاج إجراء</Text>
          </View>
        </Pressable>

        {/* Recent Reports */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={16} color={Colors.steel} />
            <Text style={{ color: Colors.steel, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
              أحدث التقارير
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.graphite, marginStart: 8 }} />
          </View>

          {loading ? (
            <LoadingState />
          ) : recentReports.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: Colors.steel, fontSize: 14 }}>لا توجد تقارير بعد</Text>
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderColor: Colors.graphite, borderRadius: 10, overflow: 'hidden' }}>
              {recentReports.map((report, i) => (
                <View
                  key={report.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: Colors.slate,
                    borderBottomWidth: i < recentReports.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.graphite,
                    gap: 12,
                  }}
                >
                  {/* Type label */}
                  <View style={{ minWidth: 90 }}>
                    <Text style={{
                      color: report.type === 'safe' ? Colors.green : Colors.red,
                      fontSize: 13,
                      fontWeight: '700',
                    }}>
                      {TYPE_LABELS[report.type] ?? report.type}
                    </Text>
                  </View>

                  {/* Note */}
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: Colors.offWhite,
                      fontSize: 14,
                      fontWeight: '400',
                    }}
                  >
                    {report.note}
                  </Text>

                  {/* Status */}
                  <StatusBadge status={report.status} />

                  {/* Timestamp */}
                  <Text style={{
                    color: Colors.steel,
                    fontSize: 12,
                    fontVariant: ['tabular-nums'],
                    minWidth: 70,
                    textAlign: 'left',
                  }}>
                    {formatDate(report.created_at)}
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
