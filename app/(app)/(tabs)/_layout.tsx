import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, color: focused ? '#FFFFFF' : '#8C8680' }}>
        {symbol}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#3D3530',
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8C8680',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => undefined);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Drops',
          tabBarIcon: ({ focused }) => <TabIcon symbol="◈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: 'Closet',
          tabBarIcon: ({ focused }) => <TabIcon symbol="▣" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: 'Scans',
          tabBarIcon: ({ focused }) => <TabIcon symbol="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon symbol="◉" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
