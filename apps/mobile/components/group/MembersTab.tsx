import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { GroupMember } from '../../stores/groupsStore';

interface MembersTabProps {
  members: GroupMember[];
  createdById: string;
}

export function MembersTab({ members, createdById }: MembersTabProps) {
  if (members.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>No members yet</Text>
        <Text style={styles.emptySubtitle}>
          Invite friends to join this group
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {members.map((member) => (
        <View key={member.userId} style={styles.memberItem}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member.userId.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>
              {member.userId}
              {member.userId === createdById && ' (Creator)'}
            </Text>
            <Text style={styles.role}>
              {member.role === 'admin' ? 'Admin' : 'Member'} · Joined{' '}
              {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
          {member.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
});
