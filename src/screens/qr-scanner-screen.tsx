import React, { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProofs } from '../hooks/use-proofs';
import { GradientButton, CardContainer } from '../components';
import { RootStackParamList } from '../types/navigation';
import { decodeQRFromImageURI } from '../utils/qr-from-image';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const QRScannerScreen =  (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { decodeEnvelopeFromQr, addScanHistory } = useProofs();
  const scanFrameSize = Math.min(300, Math.max(220, width - 72));

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setProcessing(false);
    }, [])
  );

  const processQRData = (data: string): void => {
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
        { text: 'OK', onPress: () => { setScanned(false); setProcessing(false); } },
      ]);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }): void => {
    if (scanned) return;
    setScanned(true);
    processQRData(data);
  };

  const handlePickFromGallery = async (): Promise<void> => {
    try {
      setProcessing(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant gallery access to upload QR codes');
        setProcessing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
        base64: Platform.OS === 'web',
      });

      if (result.canceled) {
        setProcessing(false);
        return;
      }

      const imageURI = result.assets[0].uri;
      const base64 = result.assets[0].base64;

      // Try to decode QR from image
      const qrData = await decodeQRFromImageURI(imageURI, base64 ?? undefined);

      if (!qrData) {
        Alert.alert(
          'No QR Code Found',
          'Could not find a valid QR code in the selected image. Please try a different image or use the camera scanner.',
          [{ text: 'OK', onPress: () => setProcessing(false) }]
        );
        return;
      }

      // Process the detected QR code
      setScanned(true);
      setProcessing(false);
      processQRData(qrData);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process image');
      setProcessing(false);
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
      />

      <View style={styles.overlay}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>Position the QR code within the frame</Text>

        <View style={[styles.scanFrame, { width: scanFrameSize, height: scanFrameSize }] }>
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

      <View style={[styles.controls, { bottom: Math.max(24, insets.bottom + 16) }]}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => void handlePickFromGallery()}
          disabled={processing}
        >
          <Feather name="image" size={24} color="#ffffff" />
          <Text style={styles.galleryText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color="#ffffff" />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
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
    left: 0,
    right: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 132,
    backgroundColor: 'rgba(147, 51, 234, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  galleryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 132,
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
