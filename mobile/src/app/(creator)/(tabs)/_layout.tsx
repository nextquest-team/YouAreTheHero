import { Tabs } from 'expo-router';

import { TabIcon } from '@/components/common/TabIcon';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline } from '@/theme';

export default function CreatorTabsLayout() {
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
          title: fr.creatorTabs.stories,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="edit-3" color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: fr.creatorTabs.media,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="image" color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: fr.creatorTabs.profile,
          tabBarIcon: ({ color, size, focused }) => <TabIcon name="user" color={color} size={size} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
