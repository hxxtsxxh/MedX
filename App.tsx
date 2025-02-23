import {
  CameraType,
  CameraView,
  useCameraPermissions,
  BarCodeScanningResult,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { FontAwesome6 } from "@expo/vector-icons";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri);
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleBarCodeScanned = (result: BarCodeScanningResult) => {
    setScannedCode(result.data);
    // You can handle the scanned QR code data here
    console.log('Scanned QR code:', result.data);
  };

  const renderPicture = () => {
    return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Take another picture" />
      </View>
    );
  };

  const renderScannedResult = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.scanTitle}>
          Barcode Detected!
        </Text>
        <Text style={styles.scanContent}>
          {scannedCode}
        </Text>
        <Button onPress={() => setScannedCode(null)} title="Scan another barcode" />
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "code128", "code39"],
        }}
        onBarcodeScanned={scannedCode ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Position barcode in frame to scan</Text>
        </View>
        <View style={styles.shutterContainer}>
          <View style={{ width: 32 }} />
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {scannedCode ? renderScannedResult() : uri ? renderPicture() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 8,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanContent: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
