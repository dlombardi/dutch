import { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';
import { Link, router, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { type Group, useGroupsStore } from '@/modules/groups';
import { View, Text, Pressable } from '@/components/ui/primitives';
import { GhostButton, PrimaryButton } from '@/components/ui';
import { colors } from '@/constants/theme';

// Fixed height for FlatList optimization
const GROUP_ITEM_HEIGHT = 80;

export default function GroupsScreen() {
  const { groups } = useGroupsStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleJoinGroup = () => {
    router.push('/join-group');
  };

  // Memoized render function for FlatList optimization
  const renderGroup = useCallback(({ item }: ListRenderItemInfo<Group>) => (
    <Link href={`/group/${item.id}`} asChild>
      <Pressable
        className={`flex-row items-center p-4 mx-4 mb-3 rounded-2xl active:opacity-70 ${
          isDark ? 'bg-dark-card' : 'bg-light-card'
        }`}
      >
        <View className="w-12 h-12 rounded-xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20">
          <Text className="text-2xl">{item.emoji}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {item.name}
          </Text>
          <Text className={`text-sm mt-0.5 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            {item.defaultCurrency}
          </Text>
        </View>
        <Text className={`text-lg ${isDark ? 'text-dark-text-tertiary' : 'text-light-text-tertiary'}`}>
          {'>'}
        </Text>
      </Pressable>
    </Link>
  ), [isDark]);

  // Pre-computed layout for FlatList virtualization
  const getItemLayout = useCallback((_: ArrayLike<Group> | null | undefined, index: number) => ({
    length: GROUP_ITEM_HEIGHT,
    offset: GROUP_ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Group) => item.id, []);

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}`}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: themeColors.bgElevated,
          },
          headerTintColor: themeColors.textPrimary,
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <Pressable className="px-3 py-1.5 active:opacity-70" onPress={handleJoinGroup}>
                <Text className="text-dutch-orange text-base font-medium">Join</Text>
              </Pressable>
              <Pressable
                className="w-8 h-8 rounded-full bg-dutch-orange items-center justify-center active:opacity-90"
                onPress={handleCreateGroup}
              >
                <Text className="text-white text-xl font-bold">+</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {groups.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-3xl items-center justify-center bg-dutch-orange/10 border border-dutch-orange/20 mb-4">
            <Text className="text-5xl">👥</Text>
          </View>
          <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
            No groups yet
          </Text>
          <Text className={`text-base text-center mb-6 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Create a group to start splitting expenses with friends
          </Text>
          <View className="w-full gap-3">
            <PrimaryButton onPress={handleCreateGroup}>
              Create Group
            </PrimaryButton>
            <GhostButton onPress={handleJoinGroup}>
              Join with Code
            </GhostButton>
          </View>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={keyExtractor}
          renderItem={renderGroup}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
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
