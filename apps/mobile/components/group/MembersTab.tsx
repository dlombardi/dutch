import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../lib/theme';
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[0.5],
  },
  role: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  adminBadge: {
    backgroundColor: colors.border.light,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
});
