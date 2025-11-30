import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatAmount, getCurrencySymbol } from '../../lib/formatters';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../lib/theme';
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
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: fontSize['5xl'],
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  balanceParties: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  fromText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  arrowText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing[1],
  },
  toText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  actions: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  settleButton: {
    backgroundColor: colors.success.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.sm,
  },
  settleButtonText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
