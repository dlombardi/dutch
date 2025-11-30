import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getCurrencySymbol, formatAmount } from '../../lib/formatters';
import type { Balance, BalancesData } from '../../stores/groupsStore';

interface BalancesTabProps {
  balances: BalancesData | undefined;
  getDisplayName: (userId: string) => string;
  onSettleUp: (balance: Balance) => void;
}

export function BalancesTab({ balances, getDisplayName, onSettleUp }: BalancesTabProps) {
  if (!balances || balances.balances.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyTitle}>All settled up!</Text>
        <Text style={styles.emptySubtitle}>
          No outstanding balances in this group
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Who pays whom</Text>
      {balances.balances.map((balance, index) => (
        <View key={`${balance.from}-${balance.to}-${index}`} style={styles.balanceItem}>
          <View style={styles.balanceParties}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {balance.from.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.fromText}>{getDisplayName(balance.from)}</Text>
              <Text style={styles.arrowText}>owes</Text>
              <Text style={styles.toText}>{getDisplayName(balance.to)}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Text style={styles.amount}>
              {getCurrencySymbol(balance.currency)}
              {formatAmount(balance.amount, balance.currency)}
            </Text>
            <TouchableOpacity
              style={styles.settleButton}
              onPress={() => onSettleUp(balance)}
            >
              <Text style={styles.settleButtonText}>Settle</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    padding: 16,
    paddingBottom: 8,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  balanceParties: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  fromText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  arrowText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  toText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  actions: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  settleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
