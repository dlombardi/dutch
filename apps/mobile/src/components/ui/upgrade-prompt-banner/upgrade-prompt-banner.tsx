import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/theme';

export interface UpgradePromptBannerProps {
  onClaim: () => void;
  onDismiss: () => void;
  isDark?: boolean;
}

export function UpgradePromptBanner({
  onClaim,
  onDismiss,
  isDark = false,
}: UpgradePromptBannerProps) {
  const bgColor = isDark ? colors.dark.blue : colors.light.blue;
  const textColor = '#FFFFFF';

  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      testID="upgrade-prompt-banner"
    >
      <Ionicons name="person-add" size={20} color={textColor} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>
          Add your email to access on all devices
        </Text>
        <Text style={{ color: textColor, opacity: 0.9, fontSize: 12, marginTop: 2 }}>
          Keep your data safe and get notifications
        </Text>
      </View>
      <Pressable
        onPress={onClaim}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          marginRight: 8,
        }}
        testID="upgrade-prompt-claim-button"
      >
        <Text style={{ color: textColor, fontWeight: '600', fontSize: 13 }}>Add</Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="upgrade-prompt-dismiss-button"
      >
        <Ionicons name="close" size={20} color={textColor} />
      </Pressable>
    </View>
  );
}
