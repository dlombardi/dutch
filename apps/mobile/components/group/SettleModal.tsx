import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { getCurrencySymbol, formatAmount } from '../../lib/formatters';
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
                  placeholderTextColor="#999"
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
              <ActivityIndicator color="#fff" />
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  details: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currency: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 120,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
