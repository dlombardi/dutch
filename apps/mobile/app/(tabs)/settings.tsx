import { Alert, ScrollView } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useGroupsStore } from "@/modules/groups";
import { useOfflineQueueStore } from "@/store/offline-queue-store";
import { useAuthStore } from "@/modules/auth";
import { type ThemePreference, useThemeStore } from "@/store/theme-store";
import { View, Text, Pressable } from "@/components/ui/primitives";
import { DangerButton } from "@/components/ui";

const themeLabels: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const clearGroups = useGroupsStore((state) => state.clearGroups);
  const pendingExpenses = useOfflineQueueStore(
    (state) => state.pendingExpenses,
  );
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);

  const handleClearLocalData = () => {
    const hasPending = pendingExpenses.length > 0;
    const warningMessage = hasPending
      ? `This will remove all locally cached data including ${pendingExpenses.length} pending expense(s) that haven't synced yet. You will need to rejoin groups.`
      : "This will remove all locally cached groups and expenses. You will need to rejoin groups.";

    Alert.alert("Clear Local Data", warningMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearGroups();
          queryClient.clear();
          Alert.alert("Done", "Local data cleared");
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          clearGroups();
          queryClient.clear();
          logout();
        },
      },
    ]);
  };

  const handleChangeAppearance = () => {
    Alert.alert("Appearance", "Choose your preferred theme", [
      {
        text: "System",
        onPress: () => setThemePreference("system"),
      },
      {
        text: "Light",
        onPress: () => setThemePreference("light"),
      },
      {
        text: "Dark",
        onPress: () => setThemePreference("dark"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddEmail = () => {
    if (user?.type === "guest") {
      router.push("/claim-account");
    }
  };

  const isGuest = user?.type === "guest";

  const SettingItem = ({
    label,
    value,
    hint,
    onPress,
  }: {
    label: string;
    value?: string;
    hint?: string;
    onPress?: () => void;
  }) => (
    <Pressable
      className={`flex-row justify-between items-center py-3.5 px-4 border-b active:opacity-70 ${
        isDark
          ? "bg-dark-card border-dark-border"
          : "bg-light-card border-light-border"
      }`}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text className={`text-base ${isDark ? "text-white" : "text-black"}`}>
        {label}
      </Text>
      {value && (
        <Text
          className={`text-base ${isDark ? "text-dark-text-secondary" : "text-light-text-secondary"}`}
        >
          {value}
        </Text>
      )}
      {hint && <Text className="text-sm text-dutch-orange">{hint}</Text>}
    </Pressable>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <Text
      className={`text-xs font-semibold uppercase tracking-wider px-4 mb-2 mt-6 ${
        isDark ? "text-dark-text-secondary" : "text-light-text-secondary"
      }`}
    >
      {children}
    </Text>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <SectionTitle>Account</SectionTitle>
        <View
          className={`rounded-xl mx-4 overflow-hidden ${isDark ? "bg-dark-card" : "bg-light-card"}`}
        >
          <SettingItem label="Profile" value={user?.name || "Guest User"} />
          {isGuest ? (
            <SettingItem
              label="Add Email"
              hint="Claim your account"
              onPress={handleAddEmail}
            />
          ) : (
            <SettingItem label="Email" value={user?.email || ""} />
          )}
        </View>

        <SectionTitle>Preferences</SectionTitle>
        <View
          className={`rounded-xl mx-4 overflow-hidden ${isDark ? "bg-dark-card" : "bg-light-card"}`}
        >
          <SettingItem label="Default Currency" value="USD ($)" />
          <SettingItem label="Notifications" value="On" />
          <SettingItem
            label="Appearance"
            value={themeLabels[themePreference]}
            onPress={handleChangeAppearance}
          />
        </View>

        <SectionTitle>About</SectionTitle>
        <View
          className={`rounded-xl mx-4 overflow-hidden ${isDark ? "bg-dark-card" : "bg-light-card"}`}
        >
          <SettingItem label="Version" value="1.0.0" />
          <SettingItem label="Privacy Policy" />
          <SettingItem label="Terms of Service" />
        </View>

        <SectionTitle>Developer</SectionTitle>
        <View
          className={`rounded-xl mx-4 overflow-hidden ${isDark ? "bg-dark-card" : "bg-light-card"}`}
        >
          <SettingItem
            label="Clear Local Data"
            hint="Remove cached groups"
            onPress={handleClearLocalData}
          />
        </View>

        <View className="mx-4 mt-8">
          <DangerButton onPress={handleLogout}>Sign Out</DangerButton>
        </View>
      </ScrollView>
    </View>
  );
}
