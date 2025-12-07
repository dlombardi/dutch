import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, Pressable } from '../primitives';

export interface UpgradePromptBannerProps {
  onClaim: () => void;
  onDismiss: () => void;
  isDark?: boolean;
}

/**
 * Content-only version for use with DropdownAlert or other overlay systems.
 * Does not include the background wrapper - that's provided by the parent.
 */
export function UpgradePromptBannerContent({
  onClaim,
  onDismiss,
}: Omit<UpgradePromptBannerProps, 'isDark'>) {
  return (
    <View
      className="flex-row items-center"
      testID="upgrade-prompt-banner"
    >
      <Ionicons name="person-add" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm">
          Add your email to access on all devices
        </Text>
        <Text className="text-white/90 text-xs mt-0.5">
          Keep your data safe and get notifications
        </Text>
      </View>
      <Pressable
        onPress={onClaim}
        className="bg-white/20 px-3 py-1.5 rounded-md mr-2 active:opacity-70"
        testID="upgrade-prompt-claim-button"
      >
        <Text className="text-white font-semibold text-sm">Add</Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="active:opacity-70"
        testID="upgrade-prompt-dismiss-button"
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

/**
 * Banner prompting guest users to claim their account by adding email.
 * Displayed at the top of the app when user is a guest.
 * @deprecated Use UpgradePromptBannerContent with DropdownAlert instead
 */
export function UpgradePromptBanner({
  onClaim,
  onDismiss,
}: UpgradePromptBannerProps) {
  return (
    <View className="bg-dutch-blue py-3 px-4">
      <UpgradePromptBannerContent onClaim={onClaim} onDismiss={onDismiss} />
    </View>
  );
}
