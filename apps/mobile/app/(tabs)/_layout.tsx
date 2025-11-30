import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5EA',
        },
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

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: '#007AFF',
  },
  tabIconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabIconTextFocused: {
    color: '#fff',
  },
});
