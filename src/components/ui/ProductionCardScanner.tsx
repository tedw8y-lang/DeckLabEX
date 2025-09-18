// 📷 DeckLab TCG - Production-Ready Card Scanner with AI Recognition
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  FlipHorizontal,
  Zap,
  ZapOff,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Grid3x3,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { 
  startScanSession, 
  scanCard, 
  completeScanSession,
  setActive 
} from '../../store/slices/scannerSlice';
import { GlassCard } from './GlassCard';

const { width, height } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 0.7;
const OVERLAY_WIDTH = width * 0.75;
const OVERLAY_HEIGHT = OVERLAY_WIDTH / CARD_ASPECT_RATIO;

interface ProductionCardScannerProps {
  onCardScanned?: (card: any) => void;
  mode?: 'collection' | 'grading' | 'identification';
}

export const ProductionCardScanner: React.FC<ProductionCardScannerProps> = ({
  onCardScanned,
  mode = 'collection',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentSession, scannedCards, isActive, isProcessing } = useSelector((state: RootState) => state.scanner);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [autoScan, setAutoScan] = useState(true);
  const [scanMode, setScanMode] = useState<'normal' | 'grading' | 'batch'>(mode === 'grading' ? 'grading' : 'normal');
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const autoScanTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Animation values
  const scanAnimation = useSharedValue(0);
  const overlayOpacity = useSharedValue(0.8);
  const targetScale = useSharedValue(1);

  useEffect(() => {
    if (isActive && autoScan) {
      scanAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
      overlayOpacity.value = withTiming(0.9, { duration: 300 });
    } else {
      scanAnimation.value = 0;
      overlayOpacity.value = withTiming(0.6, { duration: 300 });
    }
  }, [isActive, autoScan]);

  useEffect(() => {
    return () => {
      if (autoScanTimeoutRef.current) {
        clearTimeout(autoScanTimeoutRef.current);
      }
    };
  }, []);

  const startScanning = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to start scanning cards');
      return;
    }

    try {
      await dispatch(startScanSession(user.id)).unwrap();
      dispatch(setActive(true));
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start scan session');
    }
  };

  const stopScanning = async () => {
    if (currentSession) {
      try {
        await dispatch(completeScanSession(currentSession.id)).unwrap();
        dispatch(setActive(false));
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to complete scan session');
      }
    }
  };

  const captureCard = async () => {
    if (!cameraRef.current || !currentSession || isProcessing) return;

    const now = Date.now();
    if (now - lastScanTime < 1000) return; // Prevent rapid scanning
    setLastScanTime(now);

    try {
      targetScale.value = withSpring(1.1, { damping: 15 }, () => {
        targetScale.value = withSpring(1, { damping: 15 });
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.uri) {
        await dispatch(scanCard({
          imageUri: photo.uri,
          sessionId: currentSession.id,
        })).unwrap();

        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        onCardScanned?.(photo);
      }
    } catch (error) {
      console.error('Error capturing card:', error);
      Alert.alert('Scan Error', 'Failed to capture card. Please try again.');
    }

    // Reset auto-scan timer
    if (autoScan && isActive) {
      autoScanTimeoutRef.current = setTimeout(() => {
        captureCard();
      }, 2500);
    }
  };

  const handleCameraReady = () => {
    if (autoScan && isActive) {
      autoScanTimeoutRef.current = setTimeout(() => {
        captureCard();
      }, 2000);
    }
  };

  const handleManualCapture = () => {
    if (isActive) {
      if (autoScanTimeoutRef.current) {
        clearTimeout(autoScanTimeoutRef.current);
      }
      captureCard();
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleAutoScan = () => {
    setAutoScan(!autoScan);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleScanMode = () => {
    const modes: typeof scanMode[] = ['normal', 'grading', 'batch'];
    const currentIndex = modes.indexOf(scanMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setScanMode(nextMode);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Animated styles
  const scanFrameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanAnimation.value, [0, 1], [0.6, 1]),
    transform: [{ scale: targetScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const renderScanOverlay = () => (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddle}>
        <View style={styles.overlaySide} />
        <Animated.View style={[styles.scanFrame, scanFrameStyle]}>
          {/* Scanning corners */}
          <View style={styles.scanCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          {/* Scan mode indicator */}
          <View style={styles.scanModeIndicator}>
            <Text style={styles.scanModeText}>
              {scanMode === 'grading' ? 'Grading Mode' : 
               scanMode === 'batch' ? 'Batch Scan' : 'Card Recognition'}
            </Text>
          </View>

          {/* Auto-scan status */}
          {autoScan && isActive && (
            <View style={styles.autoScanIndicator}>
              <Sparkles size={12} color="#FFD700" />
              <Text style={styles.autoScanText}>Auto-scanning in 2s...</Text>
            </View>
          )}

          {/* Manual scan prompt */}
          {!autoScan && isActive && (
            <TouchableOpacity 
              style={styles.manualScanButton}
              onPress={handleManualCapture}
              activeOpacity={0.8}
            >
              <Target size={16} color="#FFFFFF" />
              <Text style={styles.manualScanText}>Tap to Scan</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom} />
    </Animated.View>
  );

  const renderTopControls = () => (
    <View style={styles.topControls}>
      {/* Auto-scan toggle */}
      <TouchableOpacity
        style={[styles.controlButton, autoScan && styles.activeControl]}
        onPress={toggleAutoScan}
        activeOpacity={0.8}
      >
        {autoScan ? (
          <Zap size={20} color="#FFD700" />
        ) : (
          <ZapOff size={20} color="#666" />
        )}
      </TouchableOpacity>

      {/* Scan mode toggle */}
      <TouchableOpacity
        style={[styles.controlButton, scanMode !== 'normal' && styles.activeControl]}
        onPress={toggleScanMode}
        activeOpacity={0.8}
      >
        {scanMode === 'grading' ? (
          <Grid3x3 size={20} color="#FFD700" />
        ) : scanMode === 'batch' ? (
          <Target size={20} color="#FFD700" />
        ) : (
          <Camera size={20} color="#666" />
        )}
      </TouchableOpacity>

      {/* Camera flip */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={toggleCameraFacing}
        activeOpacity={0.8}
      >
        <FlipHorizontal size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderBottomControls = () => (
    <View style={styles.bottomControls}>
      {/* Session stats */}
      {currentSession && (
        <GlassCard style={styles.sessionStats} variant="flat">
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scannedCards.length}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <DollarSign size={14} color="#FFD700" />
              <Text style={styles.statValue}>${currentSession.totalValue.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Session Value</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {!isActive ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startScanning}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.buttonGradient}
            >
              <Camera size={24} color="#0A0A0A" />
              <Text style={styles.startButtonText}>Start Scanning</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopScanning}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF453A', '#FF6B6B']}
              style={styles.buttonGradient}
            >
              <CheckCircle size={24} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Complete Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.permissionText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color="#333" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDescription}>
          DeckLab needs camera access to scan and identify your Pokemon cards with AI-powered recognition
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.permissionGradient}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
      >
        {renderScanOverlay()}
        {renderTopControls()}
        {renderBottomControls()}
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
  
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayTop: {
    flex: 1,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: OVERLAY_HEIGHT,
  },
  overlaySide: {
    flex: 1,
  },
  overlayBottom: {
    flex: 1,
  },
  scanFrame: {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 16,
    position: 'relative',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  scanCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  scanModeIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scanModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  autoScanIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoScanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A0A0A',
    marginLeft: 6,
  },
  manualScanButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualScanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
    marginLeft: 8,
  },

  // Controls
  topControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeControl: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderColor: '#FFD700',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  sessionStats: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  actionButtons: {
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
  },
  stopButton: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Permission styles
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
});