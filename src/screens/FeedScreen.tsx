import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, CheckCircle2, Eye, Play, Send } from 'lucide-react';
import { C, IMG } from '@/theme/colors';
import { IconButton, Avatar } from '@/components/Shared';
import { useHapticFeedback } from '@/lib/haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigation';

export default function FeedScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [comment, setComment] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const haptics = useHapticFeedback();

  return (
    <SafeAreaView style={S.fullScreen} edges={['top']}>
      <View style={S.feedHeader}>
        <IconButton icon={<X size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => navigation.goBack()} />
        <Pressable
          onPress={() => { haptics.impactMedium(); setAcknowledged((c) => !c); }}
          style={({ pressed }) => [S.ackBtn, acknowledged && S.ackBtnDone, pressed && S.cardPressed]}
        >
          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={S.ackText}>{acknowledged ? 'Acknowledged' : 'Acknowledge'}</Text>
        </Pressable>
      </View>
      <ScrollView style={S.feedBody} showsVerticalScrollIndicator={false}>
        <View style={S.videoWrap}>
          <Image source={{ uri: IMG.worker }} style={S.videoImage} />
          <View style={S.playBtn}>
            <Play size={28} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
          </View>
        </View>
        <View style={S.feedMeta}>
          <Avatar initials="MM" color="#D3CCFF" />
          <View style={S.feedAuthor}>
            <Text style={S.feedTitle} numberOfLines={2}>Fuel line maintenance reminder</Text>
            <Text style={S.feedSub}>Maria Murphy  ·  4 hours ago</Text>
          </View>
        </View>
        <View style={S.engagement}>
          <View style={S.engItem}>
            <CheckCircle2 size={16} color={C.accent} strokeWidth={1.8} />
            <Text style={S.engNum}>144</Text>
          </View>
          <View style={S.engItem}>
            <Eye size={16} color={C.accent} strokeWidth={1.8} />
            <Text style={S.engNum}>253</Text>
          </View>
          <Text style={S.engComments}>19 comments</Text>
        </View>
        <Text style={S.feedDescription}>Please watch this reminder video on fuel line maintenance changes.</Text>
        <View style={S.commentsSection}>
          <CommentBubble initials="LH" color="#D5F7FF" text="Thanks for this reminder. On it." />
          <CommentBubble initials="AG" color="#D9FBEF" text="Is there any difference between this truck model and the rest of the fleet?" />
        </View>
      </ScrollView>
      <View style={S.commentBar}>
        <Avatar initials="MM" color="#D3CCFF" />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment"
          placeholderTextColor={C.muted}
          style={S.commentInput}
        />
        <Pressable
          disabled={!comment.trim()}
          onPress={() => { haptics.notificationSuccess(); setComment(''); }}
          style={({ pressed }) => [S.sendBtn, !comment.trim() && S.sendBtnDisabled, pressed && S.cardPressed]}
        >
          <Send size={20} color={C.accent} strokeWidth={1.8} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CommentBubble({ initials, color, text }: { initials: string; color: string; text: string }) {
  return (
    <View style={S.commentRow}>
      <Avatar initials={initials} color={color} />
      <View style={S.commentBubble}>
        <Text style={S.commentText}>{text}</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  feedHeader: { height: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  ackBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ackBtnDone: { backgroundColor: C.green },
  ackText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  feedBody: { flex: 1 },
  videoWrap: { height: 260, position: 'relative', backgroundColor: '#1C1C1E' },
  videoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  playBtn: { position: 'absolute', left: '50%', top: '50%', marginLeft: -30, marginTop: -30, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  feedMeta: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedAuthor: { flex: 1, minWidth: 0 },
  feedTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  feedSub: { fontSize: 14, fontWeight: '500', color: C.muted, marginTop: 3 },
  engagement: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingHorizontal: 16, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 20 },
  engItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  engNum: { fontSize: 14, fontWeight: '600', color: C.ink, fontVariant: ['tabular-nums'] },
  engComments: { fontSize: 13, fontWeight: '500', color: C.inkSecondary, marginLeft: 'auto' },
  feedDescription: { padding: 16, fontSize: 15, fontWeight: '400', color: C.ink, lineHeight: 24 },
  commentsSection: { backgroundColor: C.canvas, padding: 16, gap: 14 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentBubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, minWidth: 0 },
  commentText: { fontSize: 14, fontWeight: '400', color: C.ink, lineHeight: 21 },
  commentBar: { minHeight: 72, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#FFFFFF', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentInput: { flex: 1, height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 16, fontSize: 14, fontWeight: '400', color: C.ink, backgroundColor: C.surfaceAlt },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  cardPressed: { opacity: 0.6 },
});
