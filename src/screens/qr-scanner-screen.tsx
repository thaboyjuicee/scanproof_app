import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useProofs } from '../hooks/use-proofs';
import { GradientButton, CardContainer } from '../components';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const QRScannerScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { decodeEnvelopeFromQr, addScanHistory } = useProofs();

  const handleBarCodeScanned = ({ data }: { data: string }): void => {
    if (scanned) return;
    setScanned(true);

    try {
      const envelope = decodeEnvelopeFromQr(data);

      void addScanHistory({
        envelopeId: envelope.id,
        envelopeType: envelope.type,
        status: 'ok',
        message: 'Envelope decoded successfully',
      });

      if (envelope.type === 'quest') {
        navigation.navigate('QuestClaimVerify', { envelope });
      } else if (envelope.type === 'notarize') {
        navigation.navigate('NotarizeVerify', { envelope });
      } else {
        navigation.navigate('TicketVerifyRedeem', { envelope });
      }
    } catch (err) {
      void addScanHistory({
        envelopeId: 'unknown',
        envelopeType: 'notarize',
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to parse QR code',
      });

      Alert.alert('Error', 'Failed to parse QR code', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return (
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.permissionContainer}>
        <Feather name="camera" size={48} color="#9333ea" />
        <Text style={styles.permissionTitle}>Loading Camera...</Text>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#faf5ff', '#ffffff', '#eff6ff']} style={styles.permissionContainer}>
        <CardContainer>
          <View style={styles.permissionContent}>
            <View style={styles.iconCircle}>
              <Feather name="camera-off" size={40} color="#9333ea" />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan QR codes for proof verification
            </Text>
            <GradientButton 
              title="Grant Permission" 
              onPress={() => void requestPermission()} 
              icon="camera"
            />
          </View>
        </CardContainer>
      </LinearGradient>
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
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>Position the QR code within the frame</Text>
          
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {scanned && (
            <View style={styles.processingContainer}>
              <LinearGradient
                colors={['#9333ea', '#2563eb']}
                style={styles.processingBox}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="loader" size={24} color="#ffffff" />
                <Text style={styles.processingText}>Verifying proof...</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="#ffffff" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  },
  permissionContent: {
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9333ea',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 40,
    textAlign: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#9333ea',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  processingContainer: {
    position: 'absolute',
    bottom: -80,
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 100,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
