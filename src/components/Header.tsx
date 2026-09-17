import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Dark } from '@/theme/colors';
import { useHSEStore } from '@/lib/store';
import { useHapticFeedback } from '@/lib/haptics';
import { useSyncStatus } from '@/lib/network';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

type ScreenName = 'Dashboard' | 'SafeReport' | 'UnsafeReport' | 'Admin';

interface HeaderProps {
  title: string;
  currentScreen: ScreenName;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  showBack?: boolean;
  isAdmin?: boolean;
}

export function Header({ title, currentScreen, navigation, showBack, isAdmin }: HeaderProps) {
  const { isOnline, syncPending } = useHSEStore();
  const { pending, syncing } = useSyncStatus();
  const haptics = useHapticFeedback();

  const handleLongPress = () => {
    if (!isAdmin) return;
    haptics.impactMedium();
    navigation.navigate('AdminGate');
  };

  return (
    <View style={S.container}>
      <View style={S.row}>
        <View style={S.left}>
          {showBack ? (
            <Pressable
              onPress={() => { haptics.impactMedium(); navigation.navigate('Dashboard'); }}
              hitSlop={12}
              style={({ pressed }) => [S.backBtn, pressed && S.pressed]}
            >
              <ArrowLeft size={20} color={Dark.steel} />
              <Text style={S.backText}>رجوع</Text>
            </Pressable>
          ) : currentScreen === 'Dashboard' ? (
            <Pressable
              onPress={() => { haptics.impactMedium(); navigation.navigate('Admin'); }}
              hitSlop={12}
              style={({ pressed }) => [S.backBtn, pressed && S.pressed]}
            >
              <BarChart3 size={18} color={Dark.steel} />
              <Text style={S.adminText}>لوحة المسؤول</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onLongPress={handleLongPress} delayLongPress={800} hitSlop={8}>
          <Text style={S.title}>{title}</Text>
        </Pressable>

        <View style={S.right}>
          {syncing ? (
            <View style={S.syncPill}>
              <Text style={S.syncText}>مزامنة</Text>
            </View>
          ) : !isOnline ? (
            <View style={S.offlinePill}>
              <Text style={S.offlineText}>
                غير متصل{syncPending > 0 ? ` · ${syncPending}` : ''}
              </Text>
            </View>
          ) : pending > 0 ? (
            <View style={S.pendingPill}>
              <Text style={S.pendingText}>{pending} pending</Text>
            </View>
          ) : (
            <View style={S.onlineDot} />
          )}
        </View>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    backgroundColor: Dark.slate,
    borderBottomWidth: 1,
    borderBottomColor: Dark.graphite,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: Dark.steel, fontSize: 14 },
  adminText: { color: Dark.steel, fontSize: 13, fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 18, color: Dark.offWhite, letterSpacing: -0.2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100, justifyContent: 'flex-end' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Dark.green },
  offlinePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Dark.red}44`,
    backgroundColor: Dark.redBg,
  },
  offlineText: { color: Dark.red, fontSize: 11, fontWeight: '600' },
  pendingPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Dark.emerald}44`,
    backgroundColor: Dark.emeraldBg,
  },
  pendingText: { color: Dark.emerald, fontSize: 11, fontWeight: '600' },
  syncPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3399FF44',
    backgroundColor: 'rgba(51,153,255,0.13)',
  },
  syncText: { color: '#3399FF', fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
