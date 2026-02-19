import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { CreateProofScreen } from '../screens/create-proof-screen';
import { HomeScreen } from '../screens/home-screen';
import { ProofDetailsScreen } from '../screens/proof-details-screen';
import { ProofListScreen } from '../screens/proof-list-screen';
import { QRScannerScreen } from '../screens/qr-scanner-screen';
import { VerifyProofScreen } from '../screens/verify-proof-screen';
import { WalletConnectScreen } from '../screens/wallet-connect-screen';
import { RootStackParamList, TabParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const BottomTabs = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateProofScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, size }) => <Feather name="plus-square" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={QRScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => <Feather name="camera" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyQRsTab"
        component={ProofListScreen}
        options={{
          tabBarLabel: 'My QRs',
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={BottomTabs} />
        <Stack.Screen 
          name="ProofDetails" 
          component={ProofDetailsScreen} 
          options={{ 
            headerShown: true,
            title: 'Proof Details',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }} 
        />
        <Stack.Screen 
          name="WalletConnect" 
          component={WalletConnectScreen} 
          options={{ 
            headerShown: true,
            title: 'Connect Wallet',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }} 
        />
        <Stack.Screen 
          name="VerifyProof" 
          component={VerifyProofScreen} 
          options={{ 
            headerShown: true,
            title: 'Verify Proof',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
