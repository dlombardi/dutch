import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { colors, glassStyle } from '../../constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`w-7 h-7 rounded-full items-center justify-center ${
        focused
          ? 'bg-dutch-orange'
          : isDark
            ? 'bg-dark-card'
            : 'bg-light-border'
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          focused
            ? 'text-white'
            : isDark
              ? 'text-dark-text-secondary'
              : 'text-light-text-secondary'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const glass = isDark ? glassStyle.dark : glassStyle.light;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.bgElevated,
        },
        headerTintColor: themeColors.textPrimary,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.dark.orange,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarStyle: Platform.OS === 'ios'
          ? {
              position: 'absolute',
              backgroundColor: glass.backgroundColor,
              borderTopWidth: glass.borderWidth,
              borderTopColor: glass.borderColor,
            }
          : {
              backgroundColor: themeColors.bgElevated,
              borderTopWidth: 1,
              borderTopColor: themeColors.border,
            },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Groups',
          headerTitle: 'Groups',
          tabBarIcon: ({ focused }) => <TabIcon label="G" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerTitle: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon label="A" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="S" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
