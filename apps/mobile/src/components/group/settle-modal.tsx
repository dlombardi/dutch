import { ActivityIndicator, Modal } from 'react-native';
import { useColorScheme } from 'nativewind';
import { View, Text, Pressable, TextInput } from '@/components/ui/primitives';
import { formatAmount, getCurrencySymbol } from '@/lib/utils/formatters';
import { colors } from '@/constants/theme';
import type { Balance } from '@/modules/groups';

interface SettleModalProps {
  visible: boolean;
  selectedBalance: Balance | null;
  settleAmount: string;
  isPending: boolean;
  getDisplayName: (userId: string) => string;
  onAmountChange: (amount: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function SettleModal({
  visible,
  selectedBalance,
  settleAmount,
  isPending,
  getDisplayName,
  onAmountChange,
  onConfirm,
  onClose,
}: SettleModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl p-6 pb-10 ${isDark ? 'bg-dark-elevated' : 'bg-light-elevated'}`}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              Record Payment
            </Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Text className="text-dutch-orange text-base">Cancel</Text>
            </Pressable>
          </View>

          {selectedBalance && (
            <View className="mb-6">
              {/* Description */}
              <Text className={`text-base text-center mb-4 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                {getDisplayName(selectedBalance.from)} pays{' '}
                {getDisplayName(selectedBalance.to)}
              </Text>

              {/* Amount Input */}
              <View className="flex-row items-center justify-center mb-2">
                <Text className={`text-4xl font-semibold mr-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  {getCurrencySymbol(selectedBalance.currency)}
                </Text>
                <TextInput
                  className={`text-4xl font-semibold text-center min-w-[120px] ${isDark ? 'text-white' : 'text-black'}`}
                  value={settleAmount}
                  onChangeText={onAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textTertiary}
                />
              </View>

              {/* Hint */}
              <Text className={`text-sm text-center ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                Full amount owed: {getCurrencySymbol(selectedBalance.currency)}
                {formatAmount(selectedBalance.amount, selectedBalance.currency)}
              </Text>
            </View>
          )}

          {/* Confirm Button */}
          <Pressable
            className={`bg-dutch-green py-4 rounded-2xl items-center active:opacity-90 ${isPending ? 'opacity-60' : ''}`}
            onPress={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-semibold">Confirm Payment</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
