import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateProofScreen } from '../screens/create-proof-screen';
import { HomeScreen } from '../screens/home-screen';
import { ProofDetailsScreen } from '../screens/proof-details-screen';
import { ProofListScreen } from '../screens/proof-list-screen';
import { QRScannerScreen } from '../screens/qr-scanner-screen';
import { VerifyProofScreen } from '../screens/verify-proof-screen';
import { WalletConnectScreen } from '../screens/wallet-connect-screen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateProof" component={CreateProofScreen} options={{ title: 'Create Proof' }} />
        <Stack.Screen name="VerifyProof" component={VerifyProofScreen} options={{ title: 'Verify Proof' }} />
        <Stack.Screen name="ProofList" component={ProofListScreen} options={{ title: 'Proof List' }} />
        <Stack.Screen name="ProofDetails" component={ProofDetailsScreen} options={{ title: 'Proof Details' }} />
        <Stack.Screen name="WalletConnect" component={WalletConnectScreen} options={{ title: 'Wallet Connect' }} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'Scan QR Code' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
