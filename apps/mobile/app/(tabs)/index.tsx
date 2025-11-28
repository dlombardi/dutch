import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder data - will be replaced with real data from stores
const PLACEHOLDER_GROUPS: Array<{ id: string; name: string; emoji: string }> = [];

export default function GroupsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {PLACEHOLDER_GROUPS.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a group to start splitting expenses with friends
          </Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join with Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={PLACEHOLDER_GROUPS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/group/${item.id}`} asChild>
              <TouchableOpacity style={styles.groupItem}>
                <Text style={styles.groupEmoji}>{item.emoji}</Text>
                <Text style={styles.groupName}>{item.name}</Text>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  joinButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
  },
});
