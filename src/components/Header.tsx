import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, BarChart3 } from '@/lib/icons';
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
    haptics.notificationError();
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
              <ArrowLeft size={20} color="#0F172A" />
              <Text style={S.backText}>Back</Text>
            </Pressable>
          ) : currentScreen === 'Dashboard' ? (
            <Pressable
              onPress={() => { haptics.impactMedium(); navigation.navigate('Admin'); }}
              hitSlop={12}
              style={({ pressed }) => [S.backBtn, pressed && S.pressed]}
            >
              <BarChart3 size={18} color="#0F172A" />
              <Text style={S.adminText}>Admin</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={3000}
          onPressIn={() => haptics.impactMedium()}
          hitSlop={8}
          disabled={!isAdmin}
        >
          <Text style={S.title} numberOfLines={1}>{title}</Text>
        </Pressable>

        <View style={S.right}>
          {syncing ? (
            <View style={S.syncPill}>
              <Text style={S.syncText}>Syncing</Text>
            </View>
          ) : !isOnline ? (
            <View style={S.offlinePill}>
              <Text style={S.offlineText}>
                Offline{syncPending > 0 ? ` · ${syncPending}` : ''}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  backText: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  adminText: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 20, color: '#0F172A', letterSpacing: 2, flex: 1, textAlign: 'center', marginEnd: 8 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100, justifyContent: 'flex-end' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  offlinePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DC262644',
    backgroundColor: '#FCE8E6',
  },
  offlineText: { color: '#DC2626', fontSize: 11, fontWeight: '600' },
  pendingPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0EA5E944',
    backgroundColor: '#E0F2FE',
  },
  pendingText: { color: '#0EA5E9', fontSize: 11, fontWeight: '600' },
  syncPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0EA5E944',
    backgroundColor: '#E0F2FE',
  },
  syncText: { color: '#0EA5E9', fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
