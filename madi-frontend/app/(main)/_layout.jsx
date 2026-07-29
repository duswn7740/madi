import { Tabs } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import BannerAdView from '@/src/components/BannerAdView';

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
  const insets = useSafeAreaInsets();
  // 일부 기기(3버튼 내비게이션 + edge-to-edge)는 insets.bottom을 0으로 잘못 보고해서
  // 시스템 내비게이션 바가 탭바와 겹치는 문제가 있다. 정상적으로 작게(제스처 내비 등)
  // 잡히는 경우까지 부풀리지 않도록, 0으로 보고될 때만 대체값을 쓴다.
  const bottomInset = insets.bottom || 20;
  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <BannerAdView />
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: colors.textSub,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
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
