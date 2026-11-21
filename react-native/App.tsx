import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { FreeModeProvider } from './src/context/FreeModeContext';
import FeedScreen from './src/screens/FeedScreen';
import ReelsScreen from './src/screens/ReelsScreen';
import LiveStreamScreen from './src/screens/LiveStreamScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <FreeModeProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1877F2',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
          }}
        >
          <Tab.Screen name="Feed" component={FeedScreen} />
          <Tab.Screen name="Reels" component={ReelsScreen} />
          <Tab.Screen name="Live" component={LiveStreamScreen} />
          <Tab.Screen name="Market" component={MarketplaceScreen} />
          <Tab.Screen name="Live Chat" component={MessagesScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </FreeModeProvider>
  );
}
