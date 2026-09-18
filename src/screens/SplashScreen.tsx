import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(12)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    const run = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      delay: number,
      easing?: (value: number) => number,
    ) => {
      const anim = Animated.timing(value, {
        toValue,
        duration,
        delay,
        easing: easing ?? Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      anim.start();
      animations.push(anim);
    };

    run(logoScale, 1.0, 600, 0);
    run(logoOpacity, 1, 600, 0);
    run(titleOpacity, 1, 500, 300);
    run(titleSlide, 0, 500, 300);
    run(subtitleOpacity, 1, 500, 450);
    run(subtitleSlide, 0, 500, 450);
    run(underlineWidth, 60, 400, 700);
    run(loaderOpacity, 1, 400, 1000);

    const timer = setTimeout(() => {
      onFinish?.();
    }, 1400);

    return () => {
      clearTimeout(timer);
      animations.forEach((a) => a.stop());
    };
  }, [onFinish]);

  const logoStyle = StyleSheet.flatten([
    S.logoBox,
    {
      transform: [{ scale: logoScale }],
      opacity: logoOpacity,
    },
  ]) as any;

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <View style={S.container}>
        <Animated.View style={logoStyle}>
          <View style={S.logoInner}>
            <Text style={S.logoText}>A</Text>
          </View>
        </Animated.View>

        <View style={S.spacer32} />

        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
          }}
        >
          <Text style={S.title}>ALFAYADH</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleSlide }],
          }}
        >
          <Text style={S.subtitle}>PETROLEUM · HSE</Text>
        </Animated.View>

        <View style={S.spacer48} />

        <Animated.View
          style={[S.underline, { width: underlineWidth }]}
        />

        <Animated.View
          style={[S.loaderWrap, { opacity: loaderOpacity }]}
        >
          <ActivityIndicator size="small" color="#94A3B8" />
          <Text style={S.loaderText}>LOADING</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  logoBox: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  spacer32: {
    height: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 6,
  },
  spacer48: {
    height: 48,
  },
  underline: {
    height: 2,
    backgroundColor: '#0EA5E9',
    borderRadius: 1,
    alignSelf: 'center',
  },
  loaderWrap: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#94A3B8',
    marginTop: 8,
  },
});
