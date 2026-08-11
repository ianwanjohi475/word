/** Document scanner using expo-camera: frame the page, capture, then convert. */
import React, { useRef, useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useConversionStore } from '@/store/useConversionStore';
import { assetFromCapture } from '@/services/picker';
import { useToast } from '@/components/Toast';

export default function Scan() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const setAssets = useConversionStore((s) => s.setAssets);
  const setCurrentDoc = useConversionStore((s) => s.setCurrentDoc);

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!photo?.uri) throw new Error('capture failed');
      const asset = await assetFromCapture(photo.uri);
      setAssets([asset]);
      setCurrentDoc(null);
      router.replace('/convert');
    } catch {
      toast.show('Could not capture the photo. Try again.', 'error');
    } finally {
      setCapturing(false);
    }
  };

  // Permission gate
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={[styles.topClose, { top: insets.top + 8 }]}>
          <Ionicons name="close" size={26} color={theme.colors.text} />
        </Pressable>
        <View style={{ paddingHorizontal: 32, alignItems: 'center' }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              backgroundColor: theme.colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Ionicons name="camera-outline" size={34} color={theme.colors.accent} />
          </View>
          <Text variant="h2" center>
            Camera access needed
          </Text>
          <Text variant="body" color="muted" center style={{ marginTop: 8, marginBottom: 24 }}>
            Allow camera access to scan documents and convert them into editable files.
          </Text>
          <Button label="Grant access" onPress={requestPermission} fullWidth={false} style={{ minWidth: 200 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text variant="bodyStrong" style={{ color: '#fff' }}>
          Scan Document
        </Text>
        <Pressable onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))} style={styles.circleBtn}>
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Frame guide */}
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <View key={c} style={[styles.corner, styles[c]]} />
          ))}
        </View>
        <View style={styles.hint}>
          <Text variant="caption" style={{ color: '#fff' }}>
            Position the document within the frame
          </Text>
        </View>
      </View>

      {/* Shutter */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={capture} disabled={capturing} style={styles.shutterOuter}>
          <View style={styles.shutterInner}>
            {capturing && <ActivityIndicator color={theme.colors.accent} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topClose: { position: 'absolute', right: 20, zIndex: 10 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 5,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '78%', aspectRatio: 0.72 },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  hint: {
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  bottomBar: { alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
