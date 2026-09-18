import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, AlertTriangle, FileText } from '@/lib/icons';
import { theme } from '@/theme/theme';
import { TYPE_LABELS, formatDate } from '@/theme/colors';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/lib/haptics';
import { StatusBadge, LoadingState } from '@/components/ui';
import { Header } from '@/components/Header';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function DashboardScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const { reports, loading, loadReports } = useHSEStore();
  const haptics = useHapticFeedback();

  useEffect(() => { loadReports(); }, [loadReports]);

  const recentReports = useMemo(() => reports.slice(0, 30), [reports]);

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <Header title="Dashboard" currentScreen="Dashboard" navigation={navigation} />
      <ScrollView style={S.scroll}>
        <View style={S.body}>
          <Pressable
            onPress={() => { haptics.impactMedium(); navigation.navigate('SafeReport'); }}
            style={({ pressed }) => [S.actionBlock, { borderColor: theme.success }, pressed && S.pressed]}
          >
            <View style={[S.actionIconWrap, { borderColor: `${theme.success}44`, backgroundColor: theme.successLight }]}>
              <ShieldCheck size={22} color={theme.success} />
            </View>
            <View style={S.actionText}>
              <Text style={S.actionTitleGreen}>Safe Observation</Text>
              <Text style={S.actionSub}>Document a safe behavior or condition</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => { haptics.impactMedium(); navigation.navigate('UnsafeReport'); }}
            style={({ pressed }) => [S.actionBlock, { borderColor: theme.danger }, pressed && S.pressed]}
          >
            <View style={[S.actionIconWrap, { borderColor: `${theme.danger}44`, backgroundColor: theme.dangerLight }]}>
              <AlertTriangle size={22} color={theme.danger} />
            </View>
            <View style={S.actionText}>
              <Text style={S.actionTitleRed}>Unsafe Observation</Text>
              <Text style={S.actionSub}>Report an unsafe condition or act</Text>
            </View>
          </Pressable>

          <View style={S.recentSection}>
            <View style={S.recentHeader}>
              <FileText size={16} color={theme.textDim} />
              <Text style={S.recentTitle}>Recent Reports</Text>
              <View style={S.recentLine} />
            </View>

            {loading ? (
              <LoadingState />
            ) : recentReports.length === 0 ? (
              <View style={S.emptyState}>
                <Text style={S.emptyText}>No reports yet</Text>
              </View>
            ) : (
              <View style={S.reportList}>
                {recentReports.map((report, i) => (
                  <Pressable
                    key={report.id}
                    onPress={() => { haptics.impactMedium(); navigation.navigate('ReportDetail', { reportId: report.id }); }}
                    style={({ pressed }) => [S.reportRow, i < recentReports.length - 1 && S.reportRowBorder, pressed && S.pressed]}
                  >
                    <View style={S.reportType}>
                      <Text style={[S.reportTypeText, { color: report.type === 'safe' ? theme.success : theme.danger }]}>
                        {TYPE_LABELS[report.type] ?? report.type}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={S.reportNote}>{report.note}</Text>
                    <StatusBadge status={report.status} />
                    <Text style={S.reportDate}>{formatDate(report.created_at)}</Text>
                  </Pressable>
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
  screen: { flex: 1, backgroundColor: theme.bg },
  scroll: { flex: 1 },
  body: { padding: 20, gap: 16 },
  actionBlock: {
    borderWidth: 1,
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 22,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitleGreen: { color: theme.success, fontSize: 18, fontFamily: 'Chevalon-Bold' },
  actionTitleRed: { color: theme.danger, fontSize: 18, fontFamily: 'Chevalon-Bold' },
  actionSub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  recentSection: { marginTop: 8 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  recentTitle: { color: theme.textDim, fontSize: 14, fontFamily: 'Chevalon-Bold', letterSpacing: 0.3 },
  recentLine: { flex: 1, height: 1, backgroundColor: theme.border, marginLeft: 8 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: theme.textDim, fontSize: 14 },
  reportList: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.card },
  reportRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    gap: 12,
  },
  reportRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  reportType: { minWidth: 90 },
  reportTypeText: { fontSize: 13, fontFamily: 'Chevalon-Bold' },
  reportNote: { flex: 1, color: theme.text, fontSize: 14, fontFamily: 'Chevalon-Regular' },
  reportDate: { color: theme.textFaint, fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 70, textAlign: 'left' },
  pressed: { opacity: 0.7 },
});
