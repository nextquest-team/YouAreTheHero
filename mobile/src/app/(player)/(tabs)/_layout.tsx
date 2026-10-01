import { Tabs } from 'expo-router';

import { TabIcon } from '@/components/common/TabIcon';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline } from '@/theme';

export default function PlayerTabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.borderStrong, borderTopWidth: hairline },
        tabBarLabelStyle: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: fr.playerTabs.stories,
          tabBarIcon: ({ color, focused }) => <TabIcon name="book" color={color} size={22} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: fr.playerTabs.favorites,
          tabBarIcon: ({ color, focused }) => <TabIcon name="heart" color={color} size={22} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saves"
        options={{
          title: fr.playerTabs.saves,
          tabBarIcon: ({ color, focused }) => <TabIcon name="file-text" color={color} size={22} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: fr.playerTabs.profile,
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} size={22} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
