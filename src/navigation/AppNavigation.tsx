import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { C } from '@/theme/colors';
import { useHapticFeedback } from '@/lib/haptics';

import HomeScreen from '@/screens/HomeScreen';
import AssetScreen from '@/screens/AssetScreen';
import ActionsScreen from '@/screens/ActionsScreen';
import TrainingScreen from '@/screens/TrainingScreen';
import MoreScreen from '@/screens/MoreScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import SafeReportScreen from '@/screens/SafeReportScreen';
import UnsafeReportScreen from '@/screens/UnsafeReportScreen';
import AdminScreen from '@/screens/AdminScreen';
import MediaScreen from '@/screens/MediaScreen';
import FeedScreen from '@/screens/FeedScreen';
import NewActionScreen from '@/screens/NewActionScreen';
import NewAssetScreen from '@/screens/NewAssetScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import MediaLibraryScreen from '@/screens/MediaLibraryScreen';
import HelpScreen from '@/screens/HelpScreen';

import {
  UserRound,
  ClipboardCheck,
  Tag,
  GraduationCap,
  MoreHorizontal,
} from '@/lib/icons';
import type { LucideIcon } from '@/lib/icons';

export type RootStackParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  SafeReport: undefined;
  UnsafeReport: undefined;
  Admin: undefined;
  Media: undefined;
  Feed: undefined;
  NewAction: undefined;
  NewAsset: undefined;
  Profile: undefined;
  MediaLibrary: undefined;
  Help: undefined;
};

export type TabParamList = {
  Home: undefined;
  Assets: undefined;
  Actions: undefined;
  Training: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, LucideIcon> = {
    Home: UserRound,
    Assets: ClipboardCheck,
    Actions: Tag,
    Training: GraduationCap,
    More: MoreHorizontal,
  };
  const Icon = icons[name];
  return <Icon color={color} size={size} strokeWidth={1.8} />;
}

function MainTabs() {
  const haptics = useHapticFeedback();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: S.tabBar,
        tabBarLabelStyle: S.tabLabel,
        tabBarItemStyle: S.tabItem,
      }}
      screenListeners={{
        tabPress: () => haptics.impactMedium(),
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <TabIcon name="Home" color={color} size={size} /> }} />
      <Tab.Screen name="Assets" component={AssetScreen} options={{ tabBarIcon: ({ color, size }) => <TabIcon name="Assets" color={color} size={size} /> }} />
      <Tab.Screen name="Actions" component={ActionsScreen} options={{ tabBarIcon: ({ color, size }) => <TabIcon name="Actions" color={color} size={size} /> }} />
      <Tab.Screen name="Training" component={TrainingScreen} options={{ tabBarIcon: ({ color, size }) => <TabIcon name="Training" color={color} size={size} /> }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarIcon: ({ color, size }) => <TabIcon name="More" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="SafeReport" component={SafeReportScreen} />
        <Stack.Screen name="UnsafeReport" component={UnsafeReportScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Media" component={MediaScreen} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="NewAction" component={NewActionScreen} />
        <Stack.Screen name="NewAsset" component={NewAssetScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MediaLibrary" component={MediaLibraryScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const S = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 80,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabItem: {
    minHeight: 56,
  },
});
