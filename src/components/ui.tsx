import { Pressable, Text, View, TextInput as RNTextInput } from 'react-native';
import { Colors } from '@/lib/design';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = 'primary', disabled, fullWidth, icon }: ButtonProps) {
  const bg =
    variant === 'primary' ? Colors.emerald
    : variant === 'danger' ? Colors.red
    : variant === 'secondary' ? Colors.slate
    : 'transparent';
  const borderColor =
    variant === 'primary' ? Colors.emerald
    : variant === 'danger' ? Colors.red
    : variant === 'secondary' ? Colors.graphite
    : Colors.graphite;
  const textColor = variant === 'ghost' ? Colors.steel : Colors.offWhite;
  const hoverBg =
    variant === 'primary' ? Colors.emeraldHover
    : variant === 'danger' ? Colors.redHover
    : variant === 'secondary' ? Colors.graphiteLight
    : Colors.slate;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ hovered, pressed }) => ({
        backgroundColor: pressed ? hoverBg : hovered ? hoverBg : bg,
        borderColor,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 48,
        minWidth: 48,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: disabled ? 0.4 : 1,
        flex: fullWidth ? 1 : undefined,
      })}
    >
      {icon}
      <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export function Chip({ label, selected, onPress, color }: ChipProps) {
  const accent = color ?? Colors.emerald;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? accent : Colors.graphite,
        backgroundColor: selected ? `${accent}22` : 'transparent',
        opacity: pressed ? 0.7 : hovered ? 0.85 : 1,
      })}
    >
      <Text style={{
        color: selected ? accent : Colors.offWhite,
        fontSize: 14,
        fontWeight: selected ? '700' : '400',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: 'open' | 'closed' }) {
  const isOpen = status === 'open';
  const color = isOpen ? Colors.red : Colors.green;
  return (
    <View style={{
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: `${color}55`,
      backgroundColor: `${color}22`,
    }}>
      <Text style={{
        color,
        fontSize: 11,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
      }}>
        {isOpen ? 'مفتوحة' : 'مغلقة'}
      </Text>
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Colors.graphite,
        borderTopColor: Colors.emerald,
        animation: 'spin 0.8s linear infinite',
      }} />
      <Text style={{ color: Colors.steel, fontSize: 14 }}>{label ?? 'جاري التحميل...'}</Text>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </View>
  );
}

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

export function TextInput({ value, onChangeText, placeholder, multiline, numberOfLines }: TextInputProps) {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: Colors.graphite,
      borderRadius: 10,
      backgroundColor: Colors.slate,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 48,
    }}>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.steel}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlign="right"
        style={{
          color: Colors.offWhite,
          fontSize: 15,
          fontWeight: '400',
          lineHeight: 1.6,
          textAlign: 'right',
          minHeight: multiline ? 100 : undefined,
        }}
      />
    </View>
  );
}
