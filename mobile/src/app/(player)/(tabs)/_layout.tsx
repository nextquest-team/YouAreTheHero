import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts } from '@/theme';

export default function PlayerTabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.surfaceAlt },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: fr.playerTabs.stories,
          tabBarIcon: ({ color, size }) => <Feather name="book-open" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saves"
        options={{
          title: fr.playerTabs.saves,
          tabBarIcon: ({ color, size }) => <Feather name="bookmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: fr.playerTabs.profile,
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
