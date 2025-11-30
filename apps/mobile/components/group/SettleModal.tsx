import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatAmount, getCurrencySymbol } from '../../lib/formatters';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../lib/theme';
import type { Balance } from '../../stores/groupsStore';

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Record Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {selectedBalance && (
            <View style={styles.details}>
              <Text style={styles.description}>
                {getDisplayName(selectedBalance.from)} pays{' '}
                {getDisplayName(selectedBalance.to)}
              </Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>
                  {getCurrencySymbol(selectedBalance.currency)}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={settleAmount}
                  onChangeText={onAmountChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                />
              </View>
              <Text style={styles.hint}>
                Full amount owed: {getCurrencySymbol(selectedBalance.currency)}
                {formatAmount(selectedBalance.amount, selectedBalance.currency)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, isPending && styles.confirmButtonDisabled]}
            onPress={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background.DEFAULT,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[6],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  cancelText: {
    fontSize: fontSize.base,
    color: colors.primary.DEFAULT,
  },
  details: {
    marginBottom: spacing[6],
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  currency: {
    fontSize: 32,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing[1],
  },
  amountInput: {
    fontSize: 32,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    minWidth: 120,
    textAlign: 'center',
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: colors.success.DEFAULT,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
