import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, MoreHorizontal, Filter, Bell, X } from '@/lib/icons';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useOnline } from '@/lib/network';

interface BrandHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
  onLogoLongPress?: () => void;
}

export function BrandHeader({ title, right, onBack, onLogoLongPress }: BrandHeaderProps) {
  const haptics = useHapticFeedback();
  const online = useOnline();
  const tapCount = useRef(0);
  const tapTimer = useRef(0);

  return (
    <View style={S.header}>
      <View style={S.headerLeft}>
        {onBack ? (
          <IconButton icon={<ChevronRight size={26} color={C.ink} />} onPress={onBack} />
        ) : (
          <View style={[S.onlineDot, { backgroundColor: online ? '#0EA5E9' : '#EF4444' }]} />
        )}
      </View>
      <View style={S.headerCenter}>
        <Pressable
          onLongPress={onLogoLongPress}
          delayLongPress={1200}
          onPress={() => {
            if (!onLogoLongPress) return;
            const now = Date.now();
            if (now - tapTimer.current > 4000) {
              tapCount.current = 0;
            }
            tapCount.current += 1;
            tapTimer.current = now;
            haptics.selection();
            console.log('[LOGO TAP]', tapCount.current);
            if (tapCount.current >= 3) {
              tapCount.current = 0;
              onLogoLongPress();
            }
          }}
          hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, paddingVertical: 4, paddingHorizontal: 8 }]}
        >
          <View style={S.brandRow}>
            <View>
              <Text style={S.brandName} numberOfLines={1}>ALFAYADH</Text>
              <Text style={S.brandSubline}>PETROLEUM · HSE</Text>
            </View>
          </View>
        </Pressable>
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

export function StatusPill({ label, tone }: { label: string; tone: 'green' | 'red' | 'orange' | 'blue' | 'yellow' | 'gray' }) {
  const map = {
    green: [C.greenBg, C.green],
    red: [C.redBg, C.red],
    orange: [C.orangeBg, C.orange],
    blue: [C.blueBg, C.blue],
    yellow: [C.warningBg, C.warning],
    gray: [C.surfaceAlt, C.muted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[S.statusPill, { backgroundColor: bg }]}>
      <Text style={[S.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const haptics = useHapticFeedback();
  return (
    <View style={S.sectionRow}>
      <Text style={S.sectionLabel}>{title}</Text>
      {action && (
        <Pressable onPress={() => { haptics.impactMedium(); onAction?.(); }} hitSlop={8}>
          <Text style={S.sectionAction}>{action}</Text>
        </Pressable>
      )}
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
  headerLeft: { width: 60, alignItems: 'flex-start', paddingLeft: 20 },
  onlineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  headerCenter: { flex: 1, alignItems: 'center', marginEnd: 8 },
  headerRight: { flexShrink: 0, maxWidth: 140, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '800', letterSpacing: 2, color: C.ink, lineHeight: 22 },
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
