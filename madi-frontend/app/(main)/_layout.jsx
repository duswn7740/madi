import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

function TabIcon({ name, focused }) {
  return (
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={22}
      color={focused ? colors.sageDark : colors.textSub}
    />
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: colors.textSub,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '달력',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: '상점',
          tabBarIcon: ({ focused }) => <TabIcon name="storefront" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
