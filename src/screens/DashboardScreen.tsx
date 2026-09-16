import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { Dark, formatDate, TYPE_LABELS } from '@/theme/colors';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/lib/haptics';
import { StatusBadge, LoadingState } from '@/components/ui';
import { Header } from '@/components/Header';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function DashboardScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { reports, loading, loadReports } = useHSEStore();
  const haptics = useHapticFeedback();

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const recentReports = useMemo(() => reports.slice(0, 30), [reports]);

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="لوحة التحكم" currentScreen="Dashboard" navigation={navigation} />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <Pressable
            onPress={() => { haptics.impactMedium(); navigation.navigate('SafeReport'); }}
            style={({ pressed }) => [S.actionBlock, { borderColor: Dark.emerald }, pressed && S.pressed]}
          >
            <View style={S.actionIconWrap}>
              <ShieldCheck size={22} color={Dark.emerald} />
            </View>
            <View style={S.actionText}>
              <Text style={S.actionTitleGreen}>وضع آمن</Text>
              <Text style={S.actionSub}>سلوك أو حالة آمنة — توثيق إيجابي</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => { haptics.impactMedium(); navigation.navigate('UnsafeReport'); }}
            style={({ pressed }) => [S.actionBlock, { borderColor: Dark.red }, pressed && S.pressed]}
          >
            <View style={[S.actionIconWrap, { borderColor: `${Dark.red}55`, backgroundColor: Dark.redBg }]}>
              <AlertTriangle size={22} color={Dark.red} />
            </View>
            <View style={S.actionText}>
              <Text style={S.actionTitleRed}>وضع غير آمن</Text>
              <Text style={S.actionSub}>حالة أو تصرف غير آمن — يحتاج إجراء</Text>
            </View>
          </Pressable>

          <View style={S.recentSection}>
            <View style={S.recentHeader}>
              <FileText size={16} color={Dark.steel} />
              <Text style={S.recentTitle}>أحدث التقارير</Text>
              <View style={S.recentLine} />
            </View>

            {loading ? (
              <LoadingState />
            ) : recentReports.length === 0 ? (
              <View style={S.emptyState}>
                <Text style={S.emptyText}>لا توجد تقارير بعد</Text>
              </View>
            ) : (
              <View style={S.reportList}>
                {recentReports.map((report, i) => (
                  <View key={report.id} style={[S.reportRow, i < recentReports.length - 1 && S.reportRowBorder]}>
                    <View style={S.reportType}>
                      <Text style={[S.reportTypeText, { color: report.type === 'safe' ? Dark.green : Dark.red }]}>
                        {TYPE_LABELS[report.type] ?? report.type}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={S.reportNote}>{report.note}</Text>
                    <StatusBadge status={report.status} />
                    <Text style={S.reportDate}>{formatDate(report.created_at)}</Text>
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

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dark.obsidian },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 16 },
  actionBlock: { borderWidth: 1, backgroundColor: Dark.slate, borderRadius: 12, padding: 22, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: `${Dark.emerald}55`, backgroundColor: Dark.emeraldBg, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitleGreen: { color: Dark.emerald, fontSize: 18, fontWeight: '800' },
  actionTitleRed: { color: Dark.red, fontSize: 18, fontWeight: '800' },
  actionSub: { color: Dark.steel, fontSize: 13, marginTop: 2 },
  recentSection: { marginTop: 8 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  recentTitle: { color: Dark.steel, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  recentLine: { flex: 1, height: 1, backgroundColor: Dark.graphite, marginLeft: 8 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: Dark.steel, fontSize: 14 },
  reportList: { borderWidth: 1, borderColor: Dark.graphite, borderRadius: 10, overflow: 'hidden' },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: Dark.slate, gap: 12 },
  reportRowBorder: { borderBottomWidth: 1, borderBottomColor: Dark.graphite },
  reportType: { minWidth: 90 },
  reportTypeText: { fontSize: 13, fontWeight: '700' },
  reportNote: { flex: 1, color: Dark.offWhite, fontSize: 14, fontWeight: '400' },
  reportDate: { color: Dark.steel, fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 70, textAlign: 'left' },
  pressed: { opacity: 0.8 },
});
