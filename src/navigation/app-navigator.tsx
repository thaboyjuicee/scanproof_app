import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateTemplatePickerScreen } from '../screens/create-template-picker-screen';
import { CreateProofScreen } from '../screens/create-proof-screen';
import { HomeScreen } from '../screens/home-screen';
import { NotarizeVerifyScreen } from '../screens/notarize-verify-screen';
import { ProofDetailsScreen } from '../screens/proof-details-screen';
import { ProofListScreen } from '../screens/proof-list-screen';
import { QRScannerScreen } from '../screens/qr-scanner-screen';
import { QuestClaimVerifyScreen } from '../screens/quest-claim-verify-screen';
import { QuestCreateScreen } from '../screens/quest-create-screen';
import { TicketCreateScreen } from '../screens/ticket-create-screen';
import { TicketVerifyRedeemScreen } from '../screens/ticket-verify-redeem-screen';
import { WalletConnectScreen } from '../screens/wallet-connect-screen';
import { RootStackParamList, TabParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const BottomTabs = (): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
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
        component={CreateTemplatePickerScreen}
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
        name="ProofbookTab"
        component={ProofListScreen}
        options={{
          tabBarLabel: 'Proofs',
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
          name="NotarizeCreate"
          component={CreateProofScreen}
          options={{
            headerShown: true,
            title: 'Notarize File',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }}
        />
        <Stack.Screen 
          name="QuestCreate"
          component={QuestCreateScreen}
          options={{
            headerShown: true,
            title: 'Quest Check-in',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }}
        />
        <Stack.Screen 
          name="TicketCreate"
          component={TicketCreateScreen}
          options={{
            headerShown: true,
            title: 'Gate Pass',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }}
        />
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
          name="QuestClaimVerify"
          component={QuestClaimVerifyScreen}
          options={{
            headerShown: true,
            title: 'Quest Claim / Verify',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }}
        />
        <Stack.Screen 
          name="NotarizeVerify"
          component={NotarizeVerifyScreen}
          options={{
            headerShown: true,
            title: 'Notarize Verify',
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
          }}
        />
        <Stack.Screen 
          name="TicketVerifyRedeem"
          component={TicketVerifyRedeemScreen}
          options={{
            headerShown: true,
            title: 'Gate Pass Verify',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
