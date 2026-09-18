import { useEffect } from 'react';
import { Image, StyleSheet, View, Dimensions, StatusBar } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish?.(), 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={S.screen}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('../../assets/splash_bbb.png')}
        style={S.image}
        resizeMode="cover"
      />
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  image: { width: SCREEN_W, height: SCREEN_H },
});
