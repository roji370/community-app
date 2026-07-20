import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      // @ts-expect-error — BlurView type mismatch with React 19
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(248,249,255,0.92)' }]} />;
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#737686',
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <TabBarBackground />,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <View style={styles.activeIconContainer}>
                <Ionicons name="home" size={22} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="home-outline" size={22} color={color as string} />
            ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={22}
              color={focused ? '#2563EB' : (color as string)}
            />
          ),
          tabBarActiveTintColor: '#2563EB',
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? 'credit-card' : 'credit-card-outline'}
              size={22}
              color={focused ? '#2563EB' : (color as string)}
            />
          ),
          tabBarActiveTintColor: '#2563EB',
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={focused ? '#2563EB' : (color as string)}
            />
          ),
          tabBarActiveTintColor: '#2563EB',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={focused ? '#2563EB' : (color as string)}
            />
          ),
          tabBarActiveTintColor: '#2563EB',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(195,198,215,0.2)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    overflow: 'hidden',
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginTop: -2,
  },
  tabItem: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  activeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
