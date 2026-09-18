import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
const CIRCLE_SIZE = 280;

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const topBarOpacity = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0.6)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.9)).current;
  const icon1Opacity = useRef(new Animated.Value(0)).current;
  const icon2Opacity = useRef(new Animated.Value(0)).current;
  const icon3Opacity = useRef(new Animated.Value(0)).current;
  const icon4Opacity = useRef(new Animated.Value(0)).current;
  const icon5Opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(12)).current;
  const head1Opacity = useRef(new Animated.Value(0)).current;
  const head1Slide = useRef(new Animated.Value(16)).current;
  const head2Opacity = useRef(new Animated.Value(0)).current;
  const head2Slide = useRef(new Animated.Value(16)).current;
  const btnScale = useRef(new Animated.Value(0.7)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = [];

    const run = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      delay: number,
      easing?: (v: number) => number,
    ) => {
      const a = Animated.timing(value, {
        toValue,
        duration,
        delay,
        easing: easing ?? Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      a.start();
      anims.push(a);
    };

    run(topBarOpacity, 1, 300, 0);
    run(circleScale, 1.0, 500, 100, Easing.out(Easing.back(1.2)));
    run(heroOpacity, 1, 400, 400);
    run(heroScale, 1.0, 400, 400);
    run(icon1Opacity, 1, 300, 500);
    run(icon2Opacity, 1, 300, 560);
    run(icon3Opacity, 1, 300, 620);
    run(icon4Opacity, 1, 300, 680);
    run(icon5Opacity, 1, 300, 740);
    run(taglineOpacity, 1, 400, 800);
    run(taglineSlide, 0, 400, 800);
    run(head1Opacity, 1, 400, 1000);
    run(head1Slide, 0, 400, 1000);
    run(head2Opacity, 1, 450, 1150);
    run(head2Slide, 0, 450, 1150);
    run(btnScale, 1.0, 400, 1400, Easing.out(Easing.back(1.5)));
    run(dotsOpacity, 1, 300, 1400);

    const timer = setTimeout(() => {
      onFinish?.();
    }, 2500);

    return () => {
      clearTimeout(timer);
      anims.forEach((a) => a.stop());
    };
  }, [onFinish]);

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <Animated.View style={[S.topBar, { opacity: topBarOpacity }]}>
        <Ionicons name="menu-outline" size={26} color="#0F172A" />
        <Ionicons name="notifications-outline" size={24} color="#0F172A" />
      </Animated.View>

      <View style={S.centerArea}>
        <Animated.View style={[S.scatterIcon, S.iconTL, { opacity: icon1Opacity }]} pointerEvents="none">
          <Ionicons name="construct-outline" size={18} color="#CBD5E1" />
        </Animated.View>
        <Animated.View style={[S.scatterIcon, S.iconTR, { opacity: icon2Opacity }]} pointerEvents="none">
          <Ionicons name="shield-checkmark-outline" size={16} color="#CBD5E1" />
        </Animated.View>
        <Animated.View style={[S.scatterIcon, S.iconBL, { opacity: icon3Opacity }]} pointerEvents="none">
          <Ionicons name="document-text-outline" size={16} color="#CBD5E1" />
        </Animated.View>
        <Animated.View style={[S.scatterIcon, S.iconBR, { opacity: icon4Opacity }]} pointerEvents="none">
          <Ionicons name="car-outline" size={18} color="#CBD5E1" />
        </Animated.View>
        <Animated.View style={[S.scatterIcon, S.iconMid, { opacity: icon5Opacity }]} pointerEvents="none">
          <Ionicons name="flash-outline" size={14} color="#CBD5E1" />
        </Animated.View>

        <Animated.View style={[S.circle, { transform: [{ scale: circleScale }] }]}>
          <Animated.View
            style={[
              S.heroWrap,
              { opacity: heroOpacity, transform: [{ scale: heroScale }] },
            ]}
          >
            {/* Replace this View with: <Image source={require('../../assets/icon.png')} style={S.heroImage} resizeMode="contain" /> once assets/icon.png exists */}
            <View style={S.heroFallback}>
              <Text style={S.heroLetter}>A</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={S.bottomSection}>
        <Animated.Text
          style={[S.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineSlide }] }]}
        >
          SAFETY · PRECISION · EXCELLENCE
        </Animated.Text>

        <Animated.Text
          style={[S.headlineSmall, { opacity: head1Opacity, transform: [{ translateY: head1Slide }] }]}
        >
          Building
        </Animated.Text>

        <Animated.Text
          style={[S.headlineBig, { opacity: head2Opacity, transform: [{ translateY: head2Slide }] }]}
        >
          THE FUTURE
        </Animated.Text>
      </View>

      <View style={S.footer}>
        <Animated.View style={[S.dotsRow, { opacity: dotsOpacity }]}>
          <View style={[S.dot, S.dotActive]} />
          <View style={S.dot} />
          <View style={S.dot} />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable onPress={() => onFinish?.()} style={S.nextBtn}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingBottom: 20 },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroWrap: { alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: 200, height: 200 },
  heroFallback: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  heroLetter: { fontSize: 80, fontWeight: '800', color: '#0EA5E9', letterSpacing: -3 },
  scatterIcon: { position: 'absolute', zIndex: 2 },
  iconTL: { top: '15%', left: '5%' },
  iconTR: { top: '22%', right: '8%' },
  iconBL: { bottom: '22%', left: '8%' },
  iconBR: { bottom: '15%', right: '5%' },
  iconMid: { top: '10%', right: '25%' },
  bottomSection: { paddingBottom: 30 },
  tagline: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 3, marginBottom: 12 },
  headlineSmall: { fontSize: 22, fontWeight: '400', color: '#0F172A', marginBottom: 2 },
  headlineBig: { fontSize: 42, fontWeight: '800', color: '#0EA5E9', letterSpacing: -1, lineHeight: 46 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
  dotActive: { backgroundColor: '#0EA5E9', width: 20 },
  nextBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
