import { ScrollView, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import type { GroupMember } from '../../stores/groupsStore';

interface MembersTabProps {
  members: GroupMember[];
  createdById: string;
}

export function MembersTab({ members, createdById }: MembersTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (members.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <View className="w-16 h-16 rounded-2xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20 mb-4">
          <Text className="text-3xl">👥</Text>
        </View>
        <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          No members yet
        </Text>
        <Text className={`text-sm text-center ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
          Invite friends to join this group
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      {members.map((member) => (
        <View
          key={member.userId}
          className={`flex-row items-center p-4 border-b ${
            isDark ? 'border-dark-border' : 'border-light-border'
          }`}
        >
          <View className="w-11 h-11 rounded-full bg-dutch-orange items-center justify-center mr-3">
            <Text className="text-white text-base font-semibold">
              {member.userId.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-base font-medium mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
              {member.userId}
              {member.userId === createdById && ' (Creator)'}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              {member.role === 'admin' ? 'Admin' : 'Member'} · Joined{' '}
              {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
          {member.role === 'admin' && (
            <View className={`px-2 py-1 rounded ${isDark ? 'bg-dark-card' : 'bg-light-border'}`}>
              <Text className={`text-xs font-medium ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                Admin
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
