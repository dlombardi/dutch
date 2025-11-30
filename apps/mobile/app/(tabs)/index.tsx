import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItemInfo } from 'react-native';
import { Link, router, Stack } from 'expo-router';
import { useGroupsStore, Group } from '../../stores/groupsStore';

// Fixed height for FlatList optimization (padding 16*2 + content ~32 + border 1)
const GROUP_ITEM_HEIGHT = 65;

export default function GroupsScreen() {
  const { groups } = useGroupsStore();

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleJoinGroup = () => {
    router.push('/join-group');
  };

  // Memoized render function for FlatList optimization
  const renderGroup = useCallback(({ item }: ListRenderItemInfo<Group>) => (
    <Link href={`/group/${item.id}`} asChild>
      <TouchableOpacity style={styles.groupItem}>
        <Text style={styles.groupEmoji}>{item.emoji}</Text>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupCurrency}>{item.defaultCurrency}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  ), []);

  // Pre-computed layout for FlatList virtualization
  const getItemLayout = useCallback((_: ArrayLike<Group> | null | undefined, index: number) => ({
    length: GROUP_ITEM_HEIGHT,
    offset: GROUP_ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Group) => item.id, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.joinHeaderButton} onPress={handleJoinGroup}>
                <Text style={styles.joinHeaderButtonText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleCreateGroup}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a group to start splitting expenses with friends
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
            <Text style={styles.joinButtonText}>Join with Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={keyExtractor}
          renderItem={renderGroup}
          // Performance optimizations for large lists
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinHeaderButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
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
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
  },
  groupCurrency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
