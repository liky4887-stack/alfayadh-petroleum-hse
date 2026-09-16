import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ClipboardCheck } from '@/lib/icons';
import { C } from '@/theme/colors';
import { BrandHeader, IconButton } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';

export default function ActionsScreen() {
  const haptics = useHapticFeedback();
  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <BrandHeader
        title="Actions"
        right={<IconButton icon={<Plus size={21} color={C.accent} strokeWidth={2} />} onPress={() => { haptics.impactMedium(); Alert.alert('New action', 'Choose an action type to continue.'); }} />}
      />
      <Pressable
        onPress={() => { haptics.impactMedium(); Alert.alert('New action', 'Choose an action type to continue.'); }}
        style={({ pressed }) => [S.emptyState, pressed && S.cardPressed]}
      >
        <ClipboardCheck size={44} color={C.faint} strokeWidth={1.5} />
        <Text style={S.emptyTitle}>Stay on top of actions</Text>
        <Text style={S.emptyText}>Your assigned actions and follow-ups will appear here.</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  emptyState: { alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, gap: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  emptyText: { fontSize: 15, fontWeight: '400', color: C.muted, textAlign: 'center', lineHeight: 22 },
  cardPressed: { opacity: 0.6 },
});
