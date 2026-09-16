import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRound, Image as ImageIcon, Menu, ChevronRight } from 'lucide-react';
import { C } from '@/theme/colors';
import { BrandHeader } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import type { ReactNode } from 'react';

export default function MoreScreen() {
  const haptics = useHapticFeedback();
  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader title="More" />
      <View style={S.body}>
        <View style={S.moreList}>
          <MoreRow icon={<UserRound size={19} color={C.accent} strokeWidth={1.8} />} label="Profile and preferences" onPress={() => { haptics.impactMedium(); Alert.alert('Profile', 'Your profile settings are ready.'); }} />
          <MoreRow icon={<ImageIcon size={19} color={C.accent} strokeWidth={1.8} />} label="Media library" onPress={() => { haptics.impactMedium(); Alert.alert('Media library', 'Your saved safety media will appear here.'); }} />
          <MoreRow icon={<Menu size={19} color={C.accent} strokeWidth={1.8} />} label="Help and support" onPress={() => { haptics.impactMedium(); Alert.alert('Help and support', 'Contact your HSE administrator for assistance.'); }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MoreRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.moreRow, pressed && S.cardPressed]}>
      <View style={S.moreIcon}>{icon}</View>
      <Text style={S.moreLabel} numberOfLines={1}>{label}</Text>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  moreList: { gap: 10, marginTop: 20 },
  moreRow: { minHeight: 64, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: C.border },
  moreIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  moreLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink, minWidth: 0 },
  cardPressed: { opacity: 0.6 },
});
