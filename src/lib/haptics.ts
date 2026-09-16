import * as Haptics from 'expo-haptics';

export function useHapticFeedback() {
  return {
    impactMedium: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    selection: () => {
      Haptics.selectionAsync();
    },
    notificationSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    notificationError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  };
}
