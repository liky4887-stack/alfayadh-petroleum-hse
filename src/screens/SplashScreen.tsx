import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(12)).current;
  const underlineScale = useRef(new Animated.Value(0)).current;
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

    run(titleOpacity, 1, 600, 0);
    run(titleSlide, 0, 600, 0);
    run(subtitleOpacity, 1, 500, 250);
    run(subtitleSlide, 0, 500, 250);
    run(underlineScale, 1, 400, 500);
    run(loaderOpacity, 1, 400, 800);

    const timer = setTimeout(() => {
      onFinish?.();
    }, 1400);

    return () => {
      clearTimeout(timer);
      animations.forEach((a) => a.stop());
    };
  }, [onFinish]);

  return (
    <SafeAreaView style={S.screen} edges={['top', 'bottom']}>
      <View style={S.container}>
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

        <View style={S.spacer32} />

        <Animated.View
          style={[S.underline, { transform: [{ scaleX: underlineScale }] }]}
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
  spacer32: {
    height: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 10,
  },
  underline: {
    height: 2,
    width: 60,
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
