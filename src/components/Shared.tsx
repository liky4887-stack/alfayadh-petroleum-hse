import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@/lib/icons';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import type { ReactNode } from 'react';

interface BrandHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}

export function BrandHeader({ title, right, onBack }: BrandHeaderProps) {
  return (
    <View style={S.header}>
      <View style={S.headerLeft}>
        {onBack ? (
          <IconButton icon={<ChevronRight size={26} color={C.ink} />} onPress={onBack} />
        ) : null}
      </View>
      <View style={S.headerCenter}>
        <View>
          <Text style={S.brandName}>ALFAYADH</Text>
          <Text style={S.brandSubline}>PETROLEUM · HSE</Text>
        </View>
      </View>
      <View style={S.headerRight}>{right}</View>
    </View>
  );
}

export function IconButton({ icon, onPress }: { icon: ReactNode; onPress: () => void }) {
  const haptics = useHapticFeedback();
  return (
    <Pressable
      onPress={() => { haptics.impactMedium(); onPress(); }}
      style={({ pressed }) => [S.iconBtn, pressed && S.cardPressed]}
    >
      {icon}
    </Pressable>
  );
}

export function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <View style={[S.avatar, { backgroundColor: color }]}>
      <Text style={S.avatarText}>{initials}</Text>
    </View>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'green' | 'red' | 'orange' | 'blue' }) {
  const map = {
    green: [C.greenBg, C.green],
    red: [C.redBg, C.red],
    orange: [C.orangeBg, C.orange],
    blue: [C.blueBg, C.blue],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[S.statusPill, { backgroundColor: bg }]}>
      <Text style={[S.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ title, action }: { title: string; action?: string }) {
  return (
    <View style={S.sectionRow}>
      <Text style={S.sectionLabel}>{title}</Text>
      {action && <Text style={S.sectionAction}>{action}</Text>}
    </View>
  );
}

const S = StyleSheet.create({
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { width: 44, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { width: 44, alignItems: 'center' },
  brandName: { fontSize: 19, fontWeight: '800', letterSpacing: 1.4, color: C.ink, lineHeight: 21 },
  brandSubline: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: C.accent, marginTop: 2 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cardPressed: { opacity: 0.6 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: C.ink },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  sectionAction: { fontSize: 14, fontWeight: '600', color: C.accent },
});
