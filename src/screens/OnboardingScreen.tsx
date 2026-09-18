import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, FlatList, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHapticFeedback } from '@/lib/haptics';

const { width: W } = Dimensions.get('window');

const PAGES = [
  {
    id: '1',
    photo: 'https://images.pexels.com/photos/35224901/pexels-photo-35224901.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    eyebrow: 'WELCOME',
    headline: 'Safety\nFirst,\nAlways.',
    body: 'The complete HSE platform built for oil services professionals in the field.',
    cta: 'Next',
    isLast: false,
  },
  {
    id: '2',
    photo: 'https://images.pexels.com/photos/34421779/pexels-photo-34421779.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    eyebrow: 'TRACK EVERYTHING',
    headline: 'Assets,\nActions &\nReports.',
    body: 'Log incidents, manage equipment and track corrective actions — all in one place.',
    cta: 'Next',
    isLast: false,
  },
  {
    id: '3',
    photo: 'https://images.pexels.com/photos/34442635/pexels-photo-34442635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    eyebrow: 'READY',
    headline: 'Let\'s Get\nStarted.',
    body: 'Sign in to your account and start managing your team\'s safety today.',
    cta: 'Get Started',
    isLast: true,
  },
];

type Page = (typeof PAGES)[number];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const haptics = useHapticFeedback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Page>>(null);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const animateCta = (toValue: number) => {
    Animated.spring(ctaScale, { toValue, friction: 8, tension: 80, useNativeDriver: true }).start();
  };

  const goNext = () => {
    haptics.impactMedium();
    if (currentIndex < PAGES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      haptics.notificationSuccess();
      onFinish();
    }
  };

  const onScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
      haptics.selection();
    }
  };

  const isLast = currentIndex === PAGES.length - 1;
  const page = PAGES[currentIndex]!;

  const renderPage = ({ item }: { item: Page }) => (
    <ImageBackground source={{ uri: item.photo }} style={[S.page, { width: W }]} resizeMode="cover">
      <View style={S.photoOverlay} />
    </ImageBackground>
  );

  return (
    <View style={S.screen}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        bounces={false}
        scrollEnabled
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={S.overlay} edges={['top', 'bottom']}>
        <View style={S.topSection}>
          <Text style={S.eyebrow}>{page.eyebrow}</Text>
          <Text style={S.headline}>{page.headline}</Text>
          <Text style={S.body}>{page.body}</Text>
        </View>

        <View style={S.bottomSection}>
          <View style={S.dotsRow}>
            {PAGES.map((_, i) => (
              <View
                key={i}
                style={[S.dot, i === currentIndex && S.dotActive]}
              />
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <Pressable
              onPress={goNext}
              onPressIn={() => animateCta(0.96)}
              onPressOut={() => animateCta(1)}
              style={[S.cta, isLast && S.ctaLast]}
            >
              <Text style={[S.ctaText, isLast && S.ctaTextLast]}>{isLast ? 'Get Started' : 'Next'}</Text>
              <Ionicons name="arrow-forward" size={18} color={isLast ? '#0A2540' : '#FFFFFF'} />
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A2540' },
  page: { flex: 1 },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 12, 24, 0.58)' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  topSection: {
    paddingHorizontal: 28,
    paddingTop: 32,
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0EA5E9',
    letterSpacing: 4,
    marginBottom: 14,
  },
  headline: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 58,
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    maxWidth: '88%',
  },

  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.30)' },
  dotActive: { width: 26, backgroundColor: '#FFFFFF' },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaLast: { backgroundColor: '#FFFFFF' },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  ctaTextLast: { color: '#0A2540' },
});
