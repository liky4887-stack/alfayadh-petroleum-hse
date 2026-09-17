import { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight } from '@/lib/icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;
const CARD_GAP = 12;

type Promo = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  onPress: () => void;
};

interface Props {
  promos?: Promo[];
  onPressCard?: (id: string) => void;
}

const DEFAULT_PROMOS: Omit<Promo, 'onPress'>[] = [
  {
    id: 'q4-zero-incident',
    tag: 'SAFETY CAMPAIGN',
    title: 'Q4 Zero-Incident Initiative',
    subtitle: 'Complete your safety training by October 31',
    cta: 'Start training',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
  },
  {
    id: 'oct-safety',
    tag: 'SAFETY WEEK',
    title: 'October Safety Awareness',
    subtitle: 'Join the team-wide safety events this week',
    cta: 'View schedule',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200',
  },
  {
    id: 'equipment-inspection',
    tag: 'INSPECTION DRIVE',
    title: 'Equipment Inspection Month',
    subtitle: 'Ensure all assets are inspected by October 31',
    cta: 'Start inspection',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200',
  },
];

export function PromoCarousel({ promos, onPressCard }: Props) {
  const haptics = useHapticFeedback();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const items: Promo[] = (promos ?? DEFAULT_PROMOS).map((p) => ({
    ...p,
    onPress: () => {
      haptics.impactMedium();
      onPressCard?.(p.id);
    },
  }));

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        scrollRef.current?.scrollTo({ x: next * (CARD_W + CARD_GAP), animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_W + CARD_GAP));
    if (index !== activeIndex && index >= 0 && index < items.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={S.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        contentContainerStyle={S.scrollContent}
      >
        {items.map((promo) => (
          <Pressable
            key={promo.id}
            onPress={promo.onPress}
            style={({ pressed }) => [S.card, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: promo.image }} style={S.image} resizeMode="cover" />
            <View style={S.overlay} />
            <View style={S.content}>
              <View style={S.tagWrap}>
                <Text style={S.tag}>{promo.tag}</Text>
              </View>
              <Text style={S.title} numberOfLines={2}>{promo.title}</Text>
              <Text style={S.subtitle} numberOfLines={2}>{promo.subtitle}</Text>
              <View style={S.ctaWrap}>
                <Text style={S.ctaText}>{promo.cta}</Text>
                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={S.dotsRow}>
        {items.map((_, i) => (
          <View key={i} style={[S.dot, i === activeIndex && S.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: { marginTop: 16, marginBottom: 8 },
  scrollContent: { paddingHorizontal: 20, gap: CARD_GAP },
  card: {
    width: CARD_W,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  image: { width: '100%', height: '100%', position: 'absolute' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  content: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  tagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  tag: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, lineHeight: 26 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  ctaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    gap: 4,
  },
  ctaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  dotActive: { width: 20, backgroundColor: '#0EA5E9' },
});
