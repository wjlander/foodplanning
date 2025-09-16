import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { useIsFocused } from '@react-navigation/native';
import { IconButton, useTheme } from 'react-native-paper';
import { searchFoodByBarcode } from '../services/foodService';

const BarcodeScanner = ({ onFoodFound, onClose }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const theme = useTheme();

  // Request camera permissions
  useEffect(() => {
    const getPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'authorized');
    };
    getPermissions();
  }, []);

  // Set up barcode scanner
  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ]);

  // Get available camera devices
  const devices = useCameraDevices();
  const device = devices.back;

  // Process detected barcodes
  useEffect(() => {
    if (barcodes.length > 0 && isScanning && !isProcessing) {
      handleBarcode(barcodes[0]);
    }
  }, [barcodes, isScanning, isProcessing]);

  // Handle barcode detection
  const handleBarcode = async (barcode) => {
    if (!barcode.rawValue || barcode.rawValue.length < 8) return;

    setIsScanning(false);
    setIsProcessing(true);

    try {
      const foodItem = await searchFoodByBarcode(barcode.rawValue);
      
      if (foodItem) {
        onFoodFound(foodItem);
      } else {
        Alert.alert(
          'Food Not Found',
          `No food item found with barcode ${barcode.rawValue}. Would you like to add it manually?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setIsProcessing(false);
                setIsScanning(true);
              },
            },
            {
              text: 'Add Manually',
              onPress: () => {
                // Navigate to manual food entry screen with barcode
                onFoodFound({ barcode: barcode.rawValue, isNew: true });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error searching for food:', error);
      Alert.alert(
        'Error',
        'Failed to search for food item. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsProcessing(false);
              setIsScanning(true);
            },
          },
        ]
      );
    }
  };

  // Toggle torch
  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  // If no permission or no device, show appropriate message
  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Camera permission is required to scan barcodes
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.text, marginTop: 20 }]}>
          Loading camera...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isFocused && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !isProcessing}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
          torch={torchOn ? 'on' : 'off'}
        />
      )}

      {/* Scanning overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing barcode...</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <IconButton
          icon="close"
          size={30}
          iconColor="#FFFFFF"
          onPress={onClose}
        />
        <IconButton
          icon={torchOn ? 'flashlight-off' : 'flashlight'}
          size={30}
          iconColor="#FFFFFF"
          onPress={toggleTorch}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Point your camera at a barcode
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
  controls: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
});

export default BarcodeScanner;