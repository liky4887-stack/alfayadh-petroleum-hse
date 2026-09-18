import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CircleCheck } from '@/lib/icons';
import { C, IMG } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

interface FeedItem {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  author: string | null;
  category: string | null;
  created_at: string;
}

export default function FeedDetailScreen({ navigation, route }: { navigation: NativeStackNavigationProp<RootStackParamList>; route: any }) {
  const haptics = useHapticFeedback();
  const feedId: string = route.params?.feedId ?? '';
  const [feed, setFeed] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('feeds').select('*').eq('id', feedId).maybeSingle();
      setFeed(data as FeedItem | null);
    } catch (err) {
      console.error('FeedDetail load error:', err);
    }
    setLoading(false);
  }, [feedId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.loadingWrap}><ActivityIndicator size="large" color="#0EA5E9" /></View>
      </SafeAreaView>
    );
  }

  if (!feed) {
    return (
      <SafeAreaView style={S.screen} edges={['top']}>
        <View style={S.header}>
          <Pressable onPress={() => navigation.goBack()} style={S.backBtn}>
            <ChevronLeft size={20} color={C.ink} />
            <Text style={S.backText}>Back</Text>
          </Pressable>
          <Text style={S.headerTitle}>Feed Detail</Text>
          <View style={{ width: 70 }} />
        </View>
        <View style={S.loadingWrap}>
          <CircleCheck size={48} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={S.emptyText}>Feed item not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={S.goBackBtn}>
            <Text style={S.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top']}>
      <View style={S.header}>
        <Pressable onPress={() => { haptics.impactMedium(); navigation.goBack(); }} style={({ pressed }) => [S.backBtn, pressed && S.pressed]}>
          <ChevronLeft size={20} color={C.ink} />
          <Text style={S.backText}>Back</Text>
        </Pressable>
        <Text style={S.headerTitle}>Feed Detail</Text>
        <View style={{ width: 70 }} />
      </View>
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: feed.image_url || IMG.warehouse }} style={S.feedImage} />
        <View style={S.body}>
          {feed.category && (
            <View style={S.categoryBadge}>
              <Text style={S.categoryText}>{feed.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={S.feedTitle}>{feed.title}</Text>
          {feed.author && <Text style={S.feedAuthor}>By {feed.author}</Text>}
          {feed.body && <Text style={S.feedBody}>{feed.body}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontFamily: 'Chevalon-SemiBold', color: C.ink },
  headerTitle: { fontSize: 18, fontFamily: 'Chevalon-ExtraBold', color: C.ink, flex: 1, textAlign: 'center' },
  scrollContent: { paddingBottom: 100 },
  feedImage: { width: '100%', height: 240, resizeMode: 'cover' },
  body: { padding: 20, gap: 12 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E0F2FE' },
  categoryText: { fontSize: 10, fontFamily: 'Chevalon-Bold', color: '#0EA5E9', letterSpacing: 0.4 },
  feedTitle: { fontSize: 22, fontFamily: 'Chevalon-ExtraBold', color: C.ink, letterSpacing: -0.3 },
  feedAuthor: { fontSize: 14, fontFamily: 'Chevalon-Medium', color: C.muted },
  feedBody: { fontSize: 15, fontFamily: 'Chevalon-Regular', color: C.ink, lineHeight: 24, marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Chevalon-Medium', color: C.muted },
  goBackBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#0EA5E9' },
  goBackText: { fontSize: 15, fontFamily: 'Chevalon-Bold', color: '#FFF' },
  pressed: { opacity: 0.7 },
});
