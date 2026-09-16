import { Pressable, Text, View } from 'react-native';
import { Colors } from '@/lib/design';
import { useHSEStore } from '@/lib/store';
import { Shield, BarChart3, ArrowLeft } from 'lucide-react';

export type ScreenName = 'dashboard' | 'safe' | 'unsafe' | 'admin';

interface HeaderProps {
  title: string;
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  showBack?: boolean;
}

export function Header({ title, currentScreen, onNavigate, showBack }: HeaderProps) {
  const { isOnline, syncPending } = useHSEStore();

  return (
    <View style={{
      backgroundColor: Colors.slate,
      borderBottomWidth: 1,
      borderBottomColor: Colors.graphite,
      paddingTop: 16,
      paddingBottom: 14,
      paddingHorizontal: 20,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
        {/* Left: nav icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100 }}>
          {showBack ? (
            <Pressable
              onPress={() => onNavigate('dashboard')}
              hitSlop={12}
              style={({ hovered }) => ({ opacity: hovered ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={20} color={Colors.steel} />
                <Text style={{ color: Colors.steel, fontSize: 14 }}>رجوع</Text>
              </View>
            </Pressable>
          ) : currentScreen === 'dashboard' ? (
            <Pressable
              onPress={() => onNavigate('admin')}
              hitSlop={12}
              style={({ hovered }) => ({ opacity: hovered ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={18} color={Colors.steel} />
                <Text style={{ color: Colors.steel, fontSize: 13, fontWeight: '600' }}>لوحة المسؤول</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        {/* Center: Title */}
        <Text style={{
          fontWeight: '800',
          fontSize: 18,
          color: Colors.offWhite,
          letterSpacing: -0.2,
        }}>
          {title}
        </Text>

        {/* Right: offline pill / logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100, justifyContent: 'flex-start' }}>
          {!isOnline && (
            <View style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${Colors.red}44`,
              backgroundColor: Colors.redBg,
            }}>
              <Text style={{ color: Colors.red, fontSize: 11, fontWeight: '600' }}>
                غير متصل{syncPending > 0 ? ` · ${syncPending}` : ''}
              </Text>
            </View>
          )}
          {isOnline && syncPending > 0 && (
            <View style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${Colors.emerald}44`,
              backgroundColor: Colors.emeraldBg,
            }}>
              <Text style={{ color: Colors.emerald, fontSize: 11, fontWeight: '600' }}>
                مزامنة {syncPending}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
