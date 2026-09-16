import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Filter,
  GraduationCap,
  Image as ImageIcon,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Send,
  Tag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useHapticFeedback } from '@/hooks/useHaptics';

const C = {
  canvas: '#F2FAFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5FBFF',
  border: '#D8ECF7',
  borderStrong: '#B6D9EC',
  ink: '#102A43',
  inkSecondary: '#486581',
  muted: '#6B8298',
  faint: '#9BB6C8',
  accent: '#138FC2',
  accentSoft: '#DDF4FF',
  accentHover: '#087EAE',
  greenBg: '#E6F4EA',
  green: '#137333',
  orangeBg: '#FEF7E0',
  orange: '#B06000',
  redBg: '#FCE8E6',
  red: '#C5221F',
  blueBg: '#E8F2FF',
  blue: '#138FC2',
  sky: '#5BC0EB',
};

const IMG = {
  warehouse: 'https://images.pexels.com/photos/37589838/pexels-photo-37589838.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  wetFloor: 'https://images.pexels.com/photos/5884386/pexels-photo-5884386.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  truck: 'https://images.pexels.com/photos/10673703/pexels-photo-10673703.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  driver: 'https://images.pexels.com/photos/15947456/pexels-photo-15947456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  barrels: 'https://images.pexels.com/photos/6060191/pexels-photo-6060191.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  worker: 'https://images.pexels.com/photos/16368437/pexels-photo-16368437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

type Tab = 'home' | 'assets' | 'actions' | 'training' | 'more';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const haptics = useHapticFeedback();

  useEffect(() => {
    const ch = supabase.channel('hse-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'hse_reports' }, () => undefined).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const navigate = (next: Tab) => { haptics.impactMedium(); setTab(next); };

  const shell = (children: React.ReactNode) => (
    <View style={S.outer}>
      <View style={S.phone}>
        {children}
      </View>
    </View>
  );

  if (mediaOpen) return shell(<MediaScreen onClose={() => setMediaOpen(false)} />);
  if (feedOpen) return shell(<FeedScreen onClose={() => setFeedOpen(false)} />);

  return shell(
    <>
      {tab === 'home' && <HomeScreen onFeed={() => setFeedOpen(true)} onMedia={() => setMediaOpen(true)} onTraining={() => setTab('training')} onIssues={() => setTab('actions')} />}
      {tab === 'assets' && <AssetScreen onBack={() => setTab('home')} />}
      {tab === 'actions' && <ActionsScreen />}
      {tab === 'training' && <TrainingScreen />}
      {tab === 'more' && <MoreScreen />}
      <BottomTabs active={tab} onChange={navigate} />
    </>
  );
}

function BrandHeader({ title, right, onBack }: { title: string; right?: React.ReactNode; onBack?: () => void }) {
  return (
    <View style={S.header}>
      <View style={S.headerLeft}>
        {onBack ? (
          <IconButton icon={<ChevronRight size={26} color={C.ink} />} onPress={onBack} />
        ) : null}
      </View>
      <View style={S.headerCenter}>
        <View style={S.brandLockup}>
          <View style={S.brandMark}><View style={S.brandMarkInner} /></View>
          <View>
            <Text style={S.brandName}>ALFAYADH</Text>
            <Text style={S.brandSubline}>PETROLEUM · HSE</Text>
          </View>
        </View>
      </View>
      <View style={S.headerRight}>{right}</View>
    </View>
  );
}

function ScreenTitle({ title }: { title: string }) {
  return <Text style={S.screenTitle}>{title}</Text>;
}

function HomeScreen({ onFeed, onMedia, onTraining, onIssues }: { onFeed: () => void; onMedia: () => void; onTraining: () => void; onIssues: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  return (
    <ScrollView ref={scrollRef} style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
      <BrandHeader title="Home" right={<IconButton icon={<Bell size={22} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => Alert.alert('Notifications', 'You are all caught up.')} />} />
      <View style={S.body}>
        <SectionLabel title="Heads up" action="View all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hStrip}>
          <HeadsUpCard image={IMG.warehouse} tag="New stock delivered" author="Maria Murphy" status="Acknowledged" onPress={onMedia} />
          <HeadsUpCard image={IMG.wetFloor} tag="Heavy storms announced" author="Craig Tiley" status="Not viewed" onPress={onFeed} danger />
        </ScrollView>
        <View style={S.kpiRow}>
          <KpiCard value="2" label="Training" onPress={onTraining} />
          <KpiCard value="12" label="Open Issues" onPress={onIssues} />
        </View>
        <View style={S.sectionRow}>
          <Text style={S.sectionLabel}>Today</Text>
          <View style={S.countBadge}><Text style={S.countBadgeText}>3</Text></View>
        </View>
        <View style={S.taskList}>
          <TaskRow category="Inspection" title="Monthly maintenance check" meta="Low priority" status="To Do" tone="orange" />
          <TaskRow category="Action" title="Restock store room supplies" meta="Low priority" status="In Progress" tone="blue" />
          <TaskRow category="Inspection" title="Monthly van maintenance check" meta="Due Dec 21" status="Completed" tone="green" last />
        </View>
      </View>
    </ScrollView>
  );
}

function HeadsUpCard({ image, tag, author, status, danger, onPress }: { image: string; tag: string; author: string; status: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.headsCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.headsImage} />
      <View style={S.headsBody}>
        <Text style={S.headsTag}>{tag}</Text>
        <View style={S.headsFooter}>
          <Avatar initials={author === 'Maria Murphy' ? 'MM' : 'CT'} color={danger ? '#F3B7B2' : '#D3CCFF'} />
          <Text style={S.headsAuthor} numberOfLines={1} ellipsizeMode="middle">{author}</Text>
          <StatusPill label={status} tone={danger ? 'red' : 'green'} />
        </View>
      </View>
    </Pressable>
  );
}

function KpiCard({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.kpiCard, pressed && S.cardPressed]}>
      <View style={S.kpiAccent} />
      <View style={S.kpiCopy}>
        <Text style={S.kpiValue}>{value}</Text>
        <Text style={S.kpiLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );
}

function SectionLabel({ title, action }: { title: string; action?: string }) {
  return (
    <View style={S.sectionRow}>
      <Text style={S.sectionLabel}>{title}</Text>
      {action && <Text style={S.sectionAction}>{action}</Text>}
    </View>
  );
}

function TaskRow({ category, title, meta, status, tone, last }: { category: string; title: string; meta: string; status: string; tone: 'orange' | 'blue' | 'green'; last?: boolean }) {
  return (
    <View style={[S.taskRow, last && S.taskRowLast]}>
      <View style={S.taskRowTop}>
        <View style={S.taskRowLeft}>
          <Text style={S.taskCategory}>{category}</Text>
          <Text style={S.taskTitle}>{title}</Text>
        </View>
        <StatusPill label={status} tone={tone} />
      </View>
      <Text style={S.taskMeta}>{meta}</Text>
    </View>
  );
}

function AssetScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
      <BrandHeader title="Profile" right={
        <View style={S.headerActions}>
          <IconButton icon={<Filter size={18} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => Alert.alert('Filter inspections', 'Showing all scheduled inspections.')} />
          <IconButton icon={<MoreHorizontal size={18} color={C.inkSecondary} strokeWidth={1.8} />} onPress={() => Alert.alert('Asset options', 'Asset details are up to date.')} />
        </View>
      } onBack={onBack} />
      <View style={S.body}>
        <View style={S.assetHero}>
          <Image source={{ uri: IMG.truck }} style={S.assetImage} />
          <View style={S.assetInfo}>
            <View>
              <Text style={S.assetId}>EA-DB08N</Text>
              <Text style={S.assetType}>Truck</Text>
            </View>
            <View style={S.assetLocation}>
              <MapPin size={14} color={C.muted} strokeWidth={1.8} />
              <Text style={S.assetLocationText}>Kansas</Text>
            </View>
          </View>
        </View>
        <SectionLabel title="Scheduled" />
        <View style={S.scheduleList}>
          <ScheduleCard title="Replace track chain" tag="Action" meta="Kansas  ·  Low" assignee="Assigned to Jamie Hong" status="To do" tone="orange" />
          <ScheduleCard title="Monthly truck condition check" tag="Inspection" meta="Dozer inspection checklist" status="Overdue" tone="red" last />
        </View>
      </View>
    </ScrollView>
  );
}

function ScheduleCard({ title, tag, meta, assignee, status, tone, last }: { title: string; tag: string; meta: string; assignee?: string; status: string; tone: 'orange' | 'red'; last?: boolean }) {
  return (
    <View style={[S.scheduleCard, last && S.scheduleLast]}>
      <View style={S.scheduleTop}>
        <Text style={S.scheduleTitle} numberOfLines={2}>{title}</Text>
        <StatusPill label={status} tone={tone} />
      </View>
      <View style={S.scheduleTagRow}>
        <View style={S.scheduleTag}>
          <Text style={S.scheduleTagText}>{tag}</Text>
        </View>
        <Text style={S.scheduleMeta}>{meta}</Text>
      </View>
      {assignee && <Text style={S.scheduleAssignee}>{assignee}</Text>}
      <View style={S.scheduleFooter}>
        <Text style={S.scheduleUpdated}>Updated 1 day ago</Text>
      </View>
    </View>
  );
}

function MediaScreen({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(0);
  const thumbs = [IMG.worker, IMG.warehouse, IMG.truck, IMG.barrels];
  return (
    <View style={S.fullScreen}>
      <View style={S.mediaHeader}>
        <IconButton icon={<ChevronRight size={26} color={C.ink} />} onPress={onClose} />
        <Pressable onPress={onClose} style={({ pressed }) => [S.doneBtn, pressed && S.cardPressed]}>
          <Text style={S.doneText}>Done</Text>
        </Pressable>
      </View>
      <View style={S.mediaViewer}>
        <Image source={{ uri: thumbs[selected] }} style={S.mediaImage} />
        <View style={S.mediaActions}>
          <View style={S.mediaActionBtn}>
            <IconButton icon={<Trash2 size={22} color={C.red} strokeWidth={1.8} />} onPress={() => Alert.alert('Delete', 'Remove this image?')} />
          </View>
          <View style={S.mediaActionBtn}>
            <IconButton icon={<Pencil size={22} color={C.ink} strokeWidth={1.8} />} onPress={() => Alert.alert('Edit', 'Annotation tools ready.')} />
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.thumbStrip}>
        {thumbs.map((uri, i) => (
          <Pressable key={uri} onPress={() => setSelected(i)} style={[S.thumb, selected === i && S.thumbSelected]}>
            <Image source={{ uri }} style={S.thumbImage} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FeedScreen({ onClose }: { onClose: () => void }) {
  const [comment, setComment] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <View style={S.fullScreen}>
      <View style={S.feedHeader}>
        <IconButton icon={<X size={22} color={C.ink} strokeWidth={1.8} />} onPress={onClose} />
        <Pressable onPress={() => setAcknowledged((current) => !current)} style={({ pressed }) => [S.ackBtn, acknowledged && S.ackBtnDone, pressed && S.cardPressed]}>
          <Check size={14} color={C.surface} strokeWidth={2.5} />
          <Text style={S.ackText}>{acknowledged ? 'Acknowledged' : 'Acknowledge'}</Text>
        </Pressable>
      </View>
      <ScrollView style={S.feedBody} showsVerticalScrollIndicator={false}>
        <View style={S.videoWrap}>
          <Image source={{ uri: IMG.worker }} style={S.videoImage} />
          <View style={S.playBtn}>
            <Play size={28} color={C.surface} fill={C.surface} strokeWidth={0} />
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
        <TextInput value={comment} onChangeText={setComment} placeholder="Add a comment" placeholderTextColor={C.muted} style={S.commentInput} />
        <Pressable disabled={!comment.trim()} onPress={() => setComment('')} style={({ pressed }) => [S.sendBtn, !comment.trim() && S.sendBtnDisabled, pressed && S.cardPressed]}>
          <Send size={20} color={C.accent} strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
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

function TrainingScreen() {
  const [quiz, setQuiz] = useState(false);
  return (
    <View style={S.screen}>
      <BrandHeader title="Training" />
      <View style={S.trainingTabs}>
        <Pressable onPress={() => undefined} style={S.trainingTabButton}><Text style={S.activeTab}>Learn</Text></Pressable>
        <Pressable onPress={() => Alert.alert('Training management', 'Training management is available to supervisors.')} style={S.trainingTabButton}><Text style={S.inactiveTab}>Manage</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={S.body}>
          <Text style={S.subHeading}>Continue learning</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.courseStrip}>
            <CourseCard image={IMG.worker} title="Fuel line maintenance" onPress={() => setQuiz(true)} />
            <CourseCard image={IMG.driver} title="Truck driver safety" onPress={() => setQuiz(true)} />
            <CourseCard image={IMG.barrels} title="Hazardous materials" onPress={() => setQuiz(true)} />
          </ScrollView>
          <Text style={[S.subHeading, { marginTop: 32 }]}>Your progress</Text>
          <View style={S.progressCard}>
            <View style={S.progressTop}>
              <GraduationCap size={20} color={C.accent} strokeWidth={1.8} />
              <Text style={S.progressTitle} numberOfLines={1}>Field safety essentials</Text>
              <Text style={S.progressPct}>68%</Text>
            </View>
            <View style={S.progressTrack}>
              <View style={S.progressFill} />
            </View>
            <Text style={S.progressMeta}>8 of 12 lessons completed</Text>
          </View>
        </View>
      </ScrollView>
      {quiz && <QuizOverlay onClose={() => setQuiz(false)} />}
    </View>
  );
}

function CourseCard({ image, title, onPress }: { image: string; title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.courseCard, pressed && S.cardPressed]}>
      <Image source={{ uri: image }} style={S.courseImage} />
      <Text style={S.courseTitle}>{title}</Text>
    </Pressable>
  );
}

function QuizOverlay({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState('Parking lots and bridges');
  const options = ['Parking lots and bridges', 'Highways and streets', 'Rural roads', 'High density traffic'];
  return (
    <View style={S.quizOverlay}>
      <View style={S.quizTop}>
        <Text style={S.quizProgress}>6 / 12</Text>
        <IconButton icon={<MoreHorizontal size={22} color={C.surface} strokeWidth={1.8} />} onPress={() => undefined} />
      </View>
      <Text style={S.quizQuestion}>What are the common locations of crashes?</Text>
      <Text style={S.quizSubtitle}>Select all that apply</Text>
      <View style={S.quizOptions}>
        {options.map((option) => (
          <Pressable key={option} onPress={() => setSelected(option)} style={({ pressed }) => [S.quizOption, selected === option && S.quizSelected, pressed && S.cardPressed]}>
            <Text style={[S.quizOptionText, selected === option && S.quizSelectedText]}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => { Alert.alert('Submitted', 'Answer recorded.'); onClose(); }} style={({ pressed }) => [S.quizContinue, pressed && S.cardPressed]}>
        <Text style={S.quizContinueText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function ActionsScreen() {
  return (
    <View style={S.screen}>
      <BrandHeader title="Actions" right={<IconButton icon={<Plus size={21} color={C.accent} strokeWidth={2} />} onPress={() => Alert.alert('New action', 'Choose an action type to continue.')} />} />
      <Pressable onPress={() => Alert.alert('New action', 'Choose an action type to continue.')} style={({ pressed }) => [S.emptyState, pressed && S.cardPressed]}>
        <ClipboardCheck size={44} color={C.faint} strokeWidth={1.5} />
        <Text style={S.emptyTitle}>Stay on top of actions</Text>
        <Text style={S.emptyText}>Your assigned actions and follow-ups will appear here.</Text>
      </Pressable>
    </View>
  );
}

function MoreScreen() {
  return (
    <View style={S.screen}>
      <BrandHeader title="More" />
      <View style={S.body}>
        <View style={S.moreList}>
          <MoreRow icon={<UserRound size={19} color={C.accent} strokeWidth={1.8} />} label="Profile and preferences" onPress={() => Alert.alert('Profile', 'Your profile settings are ready.')} />
          <MoreRow icon={<ImageIcon size={19} color={C.accent} strokeWidth={1.8} />} label="Media library" onPress={() => Alert.alert('Media library', 'Your saved safety media will appear here.')} />
          <MoreRow icon={<Menu size={19} color={C.accent} strokeWidth={1.8} />} label="Help and support" onPress={() => Alert.alert('Help and support', 'Contact your HSE administrator for assistance.')} />
        </View>
      </View>
    </View>
  );
}

function MoreRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.moreRow, pressed && S.cardPressed]}>
      <View style={S.moreIcon}>{icon}</View>
      <Text style={S.moreLabel} numberOfLines={1}>{label}</Text>
      <ChevronRight size={18} color={C.faint} strokeWidth={2} />
    </Pressable>
  );
}

function BottomTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: (color: string) => React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: (c) => <UserRound size={22} color={c} strokeWidth={1.8} /> },
    { key: 'assets', label: 'Inspections', icon: (c) => <ClipboardCheck size={22} color={c} strokeWidth={1.8} /> },
    { key: 'actions', label: 'Actions', icon: (c) => <Tag size={22} color={c} strokeWidth={1.8} /> },
    { key: 'training', label: 'Training', icon: (c) => <GraduationCap size={22} color={c} strokeWidth={1.8} /> },
    { key: 'more', label: 'More', icon: (c) => <MoreHorizontal size={22} color={c} strokeWidth={1.8} /> },
  ];
  return (
    <View style={S.bottomTabs}>
      {tabs.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={({ pressed }) => [S.tabItem, pressed && S.cardPressed]}>
            {item.icon(isActive ? C.accent : C.muted)}
            <Text style={[S.tabLabel, isActive && S.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.iconBtn, pressed && S.cardPressed]}>
      {icon}
    </Pressable>
  );
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <View style={[S.avatar, { backgroundColor: color }]}>
      <Text style={S.avatarText}>{initials}</Text>
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'red' | 'orange' | 'blue' }) {
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

const S = StyleSheet.create({
  outer: { flex: 1, minHeight: '100vh', backgroundColor: C.canvas, alignItems: 'center' },
  phone: { flex: 1, minHeight: '100vh', backgroundColor: C.canvas, maxWidth: 430, width: '100%', position: 'relative' },
  scroll: { flex: 1, backgroundColor: C.canvas },
  scrollContent: { paddingBottom: 110, paddingEnd: 0 },
  screen: { flex: 1, backgroundColor: C.canvas },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // @ts-ignore
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  headerLeft: { width: 44, flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerRight: { width: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  headerActions: { flexDirection: 'row', gap: 2 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  brandMarkInner: { width: 13, height: 17, borderRadius: 8, borderWidth: 3, borderColor: C.surface, borderTopColor: 'transparent', transform: [{ rotate: '18deg' }] },
  brandName: { fontSize: 19, fontWeight: '800', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1.4, color: C.ink, lineHeight: 21 },
  brandSubline: { fontSize: 8, fontWeight: '700', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1.5, color: C.accent, marginTop: 2 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  sectionLabel: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  sectionAction: { fontSize: 14, fontWeight: '600', color: C.accent },
  hStrip: { paddingStart: 20, paddingEnd: 20, gap: 16 },
  headsCard: { width: 280, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  headsImage: { width: '100%', height: 130 },
  headsBody: { padding: 16 },
  headsTag: { fontSize: 16, fontWeight: '700', color: C.ink, letterSpacing: -0.2, minHeight: 44 },
  headsFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  headsAuthor: { fontSize: 13, fontWeight: '500', color: C.inkSecondary, flex: 1, minWidth: 0 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 20 },
  kpiCard: { flex: 1, minHeight: 96, backgroundColor: C.surface, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  kpiAccent: { width: 5, height: 48, borderRadius: 3, backgroundColor: C.sky },
  kpiCopy: { flex: 1 },
  kpiValue: { fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 2 },
  countBadge: { backgroundColor: C.accent, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: C.surface, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  taskList: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 18, overflow: 'hidden' },
  taskRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  taskRowLast: { borderBottomWidth: 0 },
  taskRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  taskRowLeft: { flex: 1, marginRight: 12, minWidth: 0 },
  taskCategory: { fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 0.4, textTransform: 'uppercase' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginTop: 5, letterSpacing: -0.2 },
  taskMeta: { fontSize: 13, fontWeight: '400', color: C.muted, marginTop: 6 },
  assetHero: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginTop: 20 },
  assetImage: { width: '100%', height: 200 },
  assetInfo: { padding: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  assetId: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  assetType: { fontSize: 15, fontWeight: '500', color: C.inkSecondary, marginTop: 4 },
  assetLocation: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  assetLocationText: { fontSize: 14, fontWeight: '600', color: C.inkSecondary },
  scheduleList: { gap: 14, marginTop: 4 },
  scheduleCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  scheduleLast: { marginBottom: 24 },
  scheduleTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  scheduleTitle: { fontSize: 17, fontWeight: '700', color: C.ink, flex: 1, marginRight: 12, letterSpacing: -0.2, minWidth: 0 },
  scheduleTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  scheduleTag: { backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  scheduleTagText: { fontSize: 12, fontWeight: '700', color: C.inkSecondary },
  scheduleMeta: { fontSize: 13, fontWeight: '500', color: C.inkSecondary },
  scheduleAssignee: { fontSize: 14, fontWeight: '500', color: C.ink, marginTop: 12 },
  scheduleFooter: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 16, paddingTop: 14 },
  scheduleUpdated: { fontSize: 13, fontWeight: '400', color: C.muted },
  fullScreen: { flex: 1, backgroundColor: C.surface },
  mediaHeader: { height: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneBtn: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10 },
  doneText: { fontSize: 17, fontWeight: '700', color: C.ink },
  mediaViewer: { flex: 1, marginHorizontal: 16, backgroundColor: '#E8E6E1', borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 8 },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mediaActions: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  mediaActionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  thumbStrip: { gap: 10, padding: 16 },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: C.accent },
  thumbImage: { width: '100%', height: '100%' },
  feedHeader: { height: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  ackBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ackBtnDone: { backgroundColor: C.green },
  ackText: { color: C.surface, fontSize: 13, fontWeight: '700' },
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
  engComments: { fontSize: 13, fontWeight: '500', color: C.inkSecondary, marginStart: 'auto' },
  feedDescription: { padding: 16, fontSize: 15, fontWeight: '400', color: C.ink, lineHeight: 24 },
  commentsSection: { backgroundColor: C.canvas, padding: 16, gap: 14 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentBubble: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, minWidth: 0 },
  commentText: { fontSize: 14, fontWeight: '400', color: C.ink, lineHeight: 21, overflowWrap: 'anywhere' },
  commentBar: { minHeight: 72, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentInput: { flex: 1, height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 16, fontSize: 14, fontWeight: '400', color: C.ink, backgroundColor: C.surfaceAlt },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  trainingTabs: { height: 52, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center' },
  trainingTabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52 },
  activeTab: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: C.ink, paddingVertical: 16, borderBottomWidth: 2.5, borderBottomColor: C.accent },
  inactiveTab: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: C.muted, paddingVertical: 16 },
  subHeading: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.3, marginBottom: 14 },
  courseStrip: { gap: 12 },
  courseCard: { width: 168, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  courseImage: { width: '100%', height: 100 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: C.ink, padding: 13, letterSpacing: -0.1, minHeight: 58 },
  progressCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink, minWidth: 0 },
  progressPct: { fontSize: 15, fontWeight: '800', color: C.accent, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.accentSoft, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', width: '68%', backgroundColor: C.accent, borderRadius: 4 },
  progressMeta: { fontSize: 13, fontWeight: '400', color: C.muted, marginTop: 10 },
  quizOverlay: { position: 'absolute', inset: 0, backgroundColor: C.accent, paddingHorizontal: 24, paddingTop: 28 },
  quizTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizProgress: { fontSize: 16, fontWeight: '700', color: C.surface, fontVariant: ['tabular-nums'] },
  quizQuestion: { fontSize: 28, fontWeight: '800', color: C.surface, textAlign: 'center', marginTop: 80, lineHeight: 36, letterSpacing: -0.5 },
  quizSubtitle: { fontSize: 17, fontWeight: '500', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 12 },
  quizOptions: { gap: 14, marginTop: 50 },
  quizOption: { minHeight: 56, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  quizSelected: { backgroundColor: C.surface, borderColor: C.surface },
  quizOptionText: { fontSize: 15, fontWeight: '700', color: C.surface },
  quizSelectedText: { color: C.ink },
  quizContinue: { position: 'absolute', left: 24, right: 24, bottom: 32, minHeight: 56, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  quizContinueText: { fontSize: 16, fontWeight: '800', color: C.accent },
  emptyState: { alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, gap: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  emptyText: { fontSize: 15, fontWeight: '400', color: C.muted, textAlign: 'center', lineHeight: 22 },
  moreList: { gap: 10, marginTop: 20 },
  moreRow: { minHeight: 64, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: C.border },
  moreIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  moreLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink, minWidth: 0 },
  bottomTabs: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.88)', borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 8, // @ts-ignore
    backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 56, gap: 4, borderRadius: 12 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: C.muted },
  tabLabelActive: { color: C.accent, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cardPressed: { opacity: 0.6, transform: 'scale(0.97)' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: C.ink },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
});
