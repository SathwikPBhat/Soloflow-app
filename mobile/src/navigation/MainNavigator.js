import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ClientProjects from '../screens/ClientProjects';
import Clients from '../screens/Clients';
import Dashboard from '../screens/Dashboard';
import InvoicePage from '../screens/InvoicePage';
import StatPage from '../screens/StatPage';
import UserProfile from '../screens/UserProfile';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const { darkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          borderTopColor: darkMode ? '#374151' : '#e5e7eb',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: darkMode ? '#9ca3af' : '#6b7280',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'grid',
            Clients: 'users',
            Statistics: 'bar-chart-2',
            Profile: 'user',
          };
          return (
            <Feather name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Clients" component={Clients} />
      <Tab.Screen name="Statistics" component={StatPage} />
      <Tab.Screen name="Profile" component={UserProfile} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="ClientProjects" component={ClientProjects} />
      <Stack.Screen name="InvoicePage" component={InvoicePage} />
    </Stack.Navigator>
  );
}