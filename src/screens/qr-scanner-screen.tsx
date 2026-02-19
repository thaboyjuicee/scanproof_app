import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { RootStackParamList } from '../types/navigation';
import { useProofs } from '../hooks/use-proofs';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

export const QRScannerScreen = ({ navigation }: Props): React.JSX.Element => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { proofs, verifyProof } = useProofs();

  const handleBarCodeScanned = ({ data }: { data: string }): void => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      const proofId = parsed.proofId;

      if (!proofId) {
        Alert.alert('Error', 'Invalid QR code', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        return;
      }

      const proof = proofs.find((p) => p.id === proofId);
      if (!proof) {
        Alert.alert('Not Found', 'Proof not found in your wallet', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        return;
      }

      const result = verifyProof(proof);
      Alert.alert(
        result.isValid ? 'Verified ✅' : 'Invalid ❌',
        `Proof "${proof.title}" is ${result.isValid ? 'valid' : 'invalid'}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              if (result.isValid) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to parse QR code', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes for proof verification
        </Text>
        <Button title="Grant Permission" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.hint}>Align QR code within the frame</Text>
          {scanned && (
            <View style={styles.scanningIndicator}>
              <Text style={styles.scanningText}>Processing...</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <Button title="Cancel" onPress={() => navigation.goBack()} color="#666" />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    backgroundColor: '#f9f9f9',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#5865f2',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 20,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scanningIndicator: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#5865f2',
    borderRadius: 8,
  },
  scanningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
