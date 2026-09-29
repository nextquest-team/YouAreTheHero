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
        tabBarLabelStyle: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: fr.playerTabs.stories,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="book-open" color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saves"
        options={{
          title: fr.playerTabs.saves,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="bookmark" color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: fr.playerTabs.profile,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="user" color={color} size={size} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
