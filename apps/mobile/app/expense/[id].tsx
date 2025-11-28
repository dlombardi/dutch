import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Placeholder data - will be replaced with real data from stores
  const expense = {
    id,
    description: 'Dinner at restaurant',
    amount: 120.50,
    currency: 'EUR',
    category: 'Food',
    paidBy: { id: '1', name: 'John' },
    splitType: 'equal',
    participants: [
      { id: '1', name: 'John', amount: 40.17 },
      { id: '2', name: 'Sarah', amount: 40.17 },
      { id: '3', name: 'Mike', amount: 40.16 },
    ],
    date: new Date().toISOString(),
    createdBy: { id: '1', name: 'John' },
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Expense',
          headerRight: () => (
            <TouchableOpacity>
              <Text style={styles.headerButton}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.categoryEmoji}>🍽️</Text>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.amount}>
            €{expense.amount.toFixed(2)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid by</Text>
            <Text style={styles.detailValue}>{expense.paidBy.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(expense.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{expense.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Split type</Text>
            <Text style={styles.detailValue}>Equal</Text>
          </View>
        </View>

        {/* Split breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split</Text>
          {expense.participants.map((participant) => (
            <View key={participant.id} style={styles.participantRow}>
              <Text style={styles.participantName}>{participant.name}</Text>
              <Text style={styles.participantAmount}>
                €{participant.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Added by {expense.createdBy.name} on{' '}
            {new Date(expense.date).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      {/* Delete button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Expense</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  description: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantName: {
    fontSize: 16,
  },
  participantAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  metadata: {
    padding: 16,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
