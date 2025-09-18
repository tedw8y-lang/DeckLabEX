@@ .. @@
 import React, { useState, useEffect, useRef } from 'react';
 import {
   View,
   Text,
   StyleSheet,
-  TouchableOpacity,
   SafeAreaView,
-  Alert,
   Modal,
   FlatList,
   Image,
   Dimensions,
+  TouchableOpacity,
 } from 'react-native';
-import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
 import { useDispatch, useSelector } from 'react-redux';
 import { 
-  Camera, 
-  FlipHorizontal, 
-  Zap, 
-  ZapOff, 
-  Grid3x3 as Grid,
+  Camera,
   DollarSign,
   Plus,
   Check,
-  X
+  X,
+  TrendingUp,
+  Star,
+  Package
 } from 'lucide-react-native';
 import { LinearGradient } from 'expo-linear-gradient';
-import Animated, {
-  useAnimatedStyle,
-  useSharedValue,
-  withRepeat,
-  withTiming,
-  interpolate,
-} from 'react-native-reanimated';
 
 import { RootState, AppDispatch } from '../../src/store/store';
 import { 
-  startScanSession, 
-  scanCard, 
-  completeScanSession,
-  setActive,
   clearScannedCards 
 } from '../../src/store/slices/scannerSlice';
 import { ScannedCard } from '../../src/types/global';
+import { ProductionCardScanner } from '../../src/components/ui/ProductionCardScanner';
+import { GlassCard } from '../../src/components/ui/GlassCard';
 
 const { width, height } = Dimensions.get('window');
-const CARD_ASPECT_RATIO = 0.7;
-const OVERLAY_WIDTH = width * 0.7;
-const OVERLAY_HEIGHT = OVERLAY_WIDTH / CARD_ASPECT_RATIO;
 
 export default function ScannerScreen() {
   const dispatch = useDispatch<AppDispatch>();
   
   const { user } = useSelector((state: RootState) => state.auth);
-  const { currentSession, scannedCards, isActive, isProcessing } = useSelector((state: RootState) => state.scanner);
+  const { currentSession, scannedCards } = useSelector((state: RootState) => state.scanner);
   
-  const [permission, requestPermission] = useCameraPermissions();
-  const [facing, setFacing] = useState<CameraType>('back');
-  const [autoScan, setAutoScan] = useState(true);
   const [showResults, setShowResults] = useState(false);
-  const [scanMode, setScanMode] = useState<'normal' | 'grading'>('normal');
-  
-  const cameraRef = useRef<CameraView>(null);
-  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
-  
-  // Animation for scanning overlay
-  const scanAnimation = useSharedValue(0);
-
-  useEffect(() => {
-    if (isActive) {
-      scanAnimation.value = withRepeat(
-        withTiming(1, { duration: 2000 }),
-        -1,
-        true
-      );
-    } else {
-      scanAnimation.value = 0;
-    }
-  }, [isActive]);
-
-  const animatedScanStyle = useAnimatedStyle(() => {
-    return {
-      opacity: interpolate(scanAnimation.value, [0, 1], [0.3, 1]),
-    };
-  });
-
-  useEffect(() => {
-    return () => {
-      if (scanTimeoutRef.current) {
-        clearTimeout(scanTimeoutRef.current);
-      }
-    };
-  }, []);
-
-  const startScanning = async () => {
-    if (!user) {
-      Alert.alert('Error', 'Please log in to start scanning');
-      return;
-    }
-
-    try {
-      await dispatch(startScanSession(user.id)).unwrap();
-      dispatch(setActive(true));
-    } catch (error) {
-      Alert.alert('Error', 'Failed to start scan session');
-    }
-  };
-
-  const stopScanning = async () => {
-    if (currentSession) {
-      try {
-        await dispatch(completeScanSession(currentSession.id)).unwrap();
-        dispatch(setActive(false));
-        setShowResults(true);
-      } catch (error) {
-        Alert.alert('Error', 'Failed to complete scan session');
-      }
-    }
-  };
-
-  const handleCameraReady = () => {
-    if (autoScan && isActive) {
-      // Start auto-scan timer
-      scanTimeoutRef.current = setTimeout(() => {
-        captureCard();
-      }, 2000);
-    }
-  };
-
-  const handleCameraTouch = () => {
-    if (!autoScan && isActive) {
-      captureCard();
-    }
-  };
-
-  const captureCard = async () => {
-    if (!cameraRef.current || !currentSession || isProcessing) return;
-
-    try {
-      const photo = await cameraRef.current.takePictureAsync({
-        quality: 0.8,
-        base64: false,
-      });
-
-      if (photo?.uri) {
-        await dispatch(scanCard({
-          imageUri: photo.uri,
-          sessionId: currentSession.id,
-        })).unwrap();
-      }
-    } catch (error) {
-      console.error('Error capturing card:', error);
-      Alert.alert('Error', 'Failed to capture card');
-    }
-
-    // Reset auto-scan timer
-    if (autoScan && scanTimeoutRef.current) {
-      clearTimeout(scanTimeoutRef.current);
-      scanTimeoutRef.current = setTimeout(() => {
-        captureCard();
-      }, 2000);
-    }
-  };
-
-  const toggleCameraFacing = () => {
-    setFacing(current => (current === 'back' ? 'front' : 'back'));
-  };
+  const [scanMode, setScanMode] = useState<'collection' | 'grading' | 'identification'>('collection');
 
-  const renderScanOverlay = () => (
-    <View style={styles.overlay}>
-      <View style={styles.overlayTop} />
-      <View style={styles.overlayMiddle}>
-        <View style={styles.overlaySide} />
-        <Animated.View style={[styles.scanFrame, animatedScanStyle]}>
-          <View style={styles.scanCorners}>
-            <View style={[styles.corner, styles.topLeft]} />
-            <View style={[styles.corner, styles.topRight]} />
-            <View style={[styles.corner, styles.bottomLeft]} />
-            <View style={[styles.corner, styles.bottomRight]} />
-          </View>
-          {autoScan && isActive && (
-            <View style={styles.autoScanIndicator}>
-              <Text style={styles.autoScanText}>Auto-scanning...</Text>
-            </View>
-          )}
-        </Animated.View>
-        <View style={styles.overlaySide} />
-      </View>
-      <View style={styles.overlayBottom} />
-    </View>
-  );
-
-  const renderScanControls = () => (
-    <View style={styles.controlsContainer}>
-      <View style={styles.topControls}>
-        <TouchableOpacity
-          style={[styles.controlButton, autoScan && styles.activeControl]}
-          onPress={() => setAutoScan(!autoScan)}
-        >
-          {autoScan ? <Zap size={20} color="#FFD700" /> : <ZapOff size={20} color="#666" />}
-        </TouchableOpacity>
-
-        <TouchableOpacity
-          style={[styles.controlButton, scanMode === 'grading' && styles.activeControl]}
-          onPress={() => setScanMode(scanMode === 'normal' ? 'grading' : 'normal')}
-        >
-          <Grid size={20} color={scanMode === 'grading' ? '#FFD700' : '#666'} />
-        </TouchableOpacity>
-
-        <TouchableOpacity
-          style={styles.controlButton}
-          onPress={toggleCameraFacing}
-        >
-          <FlipHorizontal size={20} color="#666" />
-        </TouchableOpacity>
-      </View>
-
-      <View style={styles.bottomControls}>
-        {currentSession && (
-          <View style={styles.sessionInfo}>
-            <View style={styles.sessionStat}>
-              <Text style={styles.sessionValue}>{scannedCards.length}</Text>
-              <Text style={styles.sessionLabel}>Cards</Text>
-            </View>
-            <View style={styles.sessionStat}>
-              <DollarSign size={16} color="#FFD700" />
-              <Text style={styles.sessionValue}>${currentSession.totalValue.toFixed(2)}</Text>
-            </View>
-          </View>
-        )}
-
-        <View style={styles.actionButtons}>
-          {!isActive ? (
-            <TouchableOpacity
-              style={styles.startButton}
-              onPress={startScanning}
-            >
-              <Camera size={24} color="#0A0A0A" />
-              <Text style={styles.startButtonText}>Start Scanning</Text>
-            </TouchableOpacity>
-          ) : (
-            <TouchableOpacity
-              style={styles.stopButton}
-              onPress={stopScanning}
-            >
-              <Check size={24} color="#FFFFFF" />
-              <Text style={styles.stopButtonText}>Complete Session</Text>
-            </TouchableOpacity>
-          )}
-        </View>
-      </View>
-    </View>
+  const handleCardScanned = (cardData: any) => {
+    // Handle successful card scan
+    console.log('Card scanned:', cardData);
+  };
+
+  const renderModeSelector = () => (
+    <View style={styles.modeSelector}>
+      <TouchableOpacity
+        style={[styles.modeButton, scanMode === 'collection' && styles.activeModeButton]}
+        onPress={() => setScanMode('collection')}
+      >
+        <Package size={16} color={scanMode === 'collection' ? '#FFD700' : '#666'} />
+        <Text style={[styles.modeText, scanMode === 'collection' && styles.activeModeText]}>
+          Collection
+        </Text>
+      </TouchableOpacity>
+
+      <TouchableOpacity
+        style={[styles.modeButton, scanMode === 'grading' && styles.activeModeButton]}
+        onPress={() => setScanMode('grading')}
+      >
+        <Star size={16} color={scanMode === 'grading' ? '#FFD700' : '#666'} />
+        <Text style={[styles.modeText, scanMode === 'grading' && styles.activeModeText]}>
+          Grading
+        </Text>
+      </TouchableOpacity>
+
+      <TouchableOpacity
+        style={[styles.modeButton, scanMode === 'identification' && styles.activeModeButton]}
+        onPress={() => setScanMode('identification')}
+      >
+        <Camera size={16} color={scanMode === 'identification' ? '#FFD700' : '#666'} />
+        <Text style={[styles.modeText, scanMode === 'identification' && styles.activeModeText]}>
+          ID Only
+        </Text>
+      </TouchableOpacity>
+    </View>
   );
 
   const renderScannedCardItem = ({ item }: { item: ScannedCard }) => (
-    <View style={styles.scannedCardItem}>
-      <Image source={{ uri: item.image }} style={styles.scannedCardImage} />
-      <View style={styles.scannedCardInfo}>
-        <Text style={styles.scannedCardName} numberOfLines={1}>
-          {item.card.name}
-        </Text>
-        <Text style={styles.scannedCardSet}>
-          {item.card.set.name}
-        </Text>
-        <Text style={styles.scannedCardValue}>
-          ${item.estimatedValue.toFixed(2)}
-        </Text>
-        <Text style={styles.scannedCardCondition}>
-          {item.estimatedCondition}
-        </Text>
-      </View>
-      <View style={styles.scannedCardActions}>
-        <TouchableOpacity style={styles.addButton}>
-          <Plus size={16} color="#FFD700" />
-        </TouchableOpacity>
-      </View>
-    </View>
+    <GlassCard style={styles.scannedCardItem} variant="flat">
+      <View style={styles.scannedCardContent}>
+        <Image source={{ uri: item.image }} style={styles.scannedCardImage} />
+        <View style={styles.scannedCardInfo}>
+          <Text style={styles.scannedCardName} numberOfLines={1}>
+            {item.card.name}
+          </Text>
+          <Text style={styles.scannedCardSet}>
+            {item.card.set.name}
+          </Text>
+          
+          <View style={styles.cardValueRow}>
+            <View style={styles.valueContainer}>
+              <DollarSign size={12} color="#FFD700" />
+              <Text style={styles.scannedCardValue}>
+                ${item.estimatedValue.toFixed(2)}
+              </Text>
+            </View>
+            
+            <View style={styles.confidenceContainer}>
+              <Text style={styles.confidenceText}>
+                {(item.confidence * 100).toFixed(0)}% match
+              </Text>
+            </View>
+          </View>
+          
+          <Text style={styles.scannedCardCondition}>
+            {item.estimatedCondition}
+          </Text>
+        </View>
+        
+        <View style={styles.scannedCardActions}>
+          <TouchableOpacity style={styles.addButton}>
+            <Plus size={16} color="#FFD700" />
+          </TouchableOpacity>
+        </View>
+      </View>
+    </GlassCard>
   );
 
   const renderResultsModal = () => (
@@ .. @@
         <View style={styles.resultsContainer}>
-          <View style={styles.resultsSummary}>
-            <Text style={styles.resultsSummaryTitle}>Session Summary</Text>
-            <View style={styles.summaryStats}>
-              <View style={styles.summaryStat}>
-                <Text style={styles.summaryValue}>{scannedCards.length}</Text>
-                <Text style={styles.summaryLabel}>Cards Scanned</Text>
-              </View>
-              <View style={styles.summaryStat}>
-                <Text style={styles.summaryValue}>
-                  ${currentSession?.totalValue.toFixed(2) || '0.00'}
-                </Text>
-                <Text style={styles.summaryLabel}>Total Value</Text>
-              </View>
+          <GlassCard style={styles.resultsSummary} variant="elevated">
+            <View style={styles.summaryHeader}>
+              <TrendingUp size={24} color="#FFD700" />
+              <Text style={styles.resultsSummaryTitle}>Session Complete</Text>
             </View>
-          </View>
+            
+            <View style={styles.summaryStats}>
+              <View style={styles.summaryStat}>
+                <Text style={styles.summaryValue}>{scannedCards.length}</Text>
+                <Text style={styles.summaryLabel}>Cards Scanned</Text>
+              </View>
+              <View style={styles.summaryStat}>
+                <Text style={styles.summaryValue}>
+                  ${currentSession?.totalValue.toFixed(2) || '0.00'}
+                </Text>
+                <Text style={styles.summaryLabel}>Total Value</Text>
+              </View>
+              <View style={styles.summaryStat}>
+                <Text style={styles.summaryValue}>
+                  {scannedCards.filter(c => c.confidence > 0.8).length}
+                </Text>
+                <Text style={styles.summaryLabel}>High Confidence</Text>
+              </View>
+            </View>
+          </GlassCard>
 
           <FlatList
             data={scannedCards}
@@ .. @@
   );
 
-  if (!permission) {
-    return (
-      <View style={styles.permissionContainer}>
-        <LoadingSpinner size="large" color="#FFD700" />
-      </View>
-    );
-  }
-
-  if (!permission.granted) {
-    return (
-      <View style={styles.permissionContainer}>
-        <Camera size={64} color="#333" />
-        <Text style={styles.permissionTitle}>Camera Access Required</Text>
-        <Text style={styles.permissionDescription}>
-          DeckLab needs camera access to scan and identify your trading cards
-        </Text>
-        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
-          <Text style={styles.permissionButtonText}>Grant Permission</Text>
-        </TouchableOpacity>
-      </View>
-    );
-  }
-
   return (
     <SafeAreaView style={styles.container}>
-      <CameraView
-        ref={cameraRef}
-        style={styles.camera}
-        facing={facing}
-        onCameraReady={handleCameraReady}
-      >
-        <TouchableOpacity 
-          style={styles.cameraTouch}
-          onPress={handleCameraTouch}
-          activeOpacity={1}
-        >
-          {renderScanOverlay()}
-        </TouchableOpacity>
-      </CameraView>
+      {renderModeSelector()}
       
-      {renderScanControls()}
+      <ProductionCardScanner
+        onCardScanned={handleCardScanned}
+        mode={scanMode}
+      />
+      
       {renderResultsModal()}
     </SafeAreaView>
   );
@@ .. @@
   container: {
     flex: 1,
     backgroundColor: '#0A0A0A',
   },
-  camera: {
-    flex: 1,
-  },
-  cameraTouch: {
-    flex: 1,
-  },
-  overlay: {
-    ...StyleSheet.absoluteFillObject,
-    backgroundColor: 'rgba(0, 0, 0, 0.6)',
-  },
-  overlayTop: {
-    flex: 1,
-  },
-  overlayMiddle: {
+  modeSelector: {
     flexDirection: 'row',
-    height: OVERLAY_HEIGHT,
-  },
-  overlaySide: {
-    flex: 1,
-  },
-  overlayBottom: {
-    flex: 1,
-  },
-  scanFrame: {
-    width: OVERLAY_WIDTH,
-    height: OVERLAY_HEIGHT,
-    borderWidth: 2,
-    borderColor: '#FFD700',
-    borderRadius: 12,
-    position: 'relative',
-  },
-  scanCorners: {
-    ...StyleSheet.absoluteFillObject,
-  },
-  corner: {
-    position: 'absolute',
-    width: 20,
-    height: 20,
-    borderColor: '#FFD700',
-    borderWidth: 3,
-  },
-  topLeft: {
-    top: -2,
-    left: -2,
-    borderRightWidth: 0,
-    borderBottomWidth: 0,
-    borderTopLeftRadius: 12,
-  },
-  topRight: {
-    top: -2,
-    right: -2,
-    borderLeftWidth: 0,
-    borderBottomWidth: 0,
-    borderTopRightRadius: 12,
-  },
-  bottomLeft: {
-    bottom: -2,
-    left: -2,
-    borderRightWidth: 0,
-    borderTopWidth: 0,
-    borderBottomLeftRadius: 12,
-  },
-  bottomRight: {
-    bottom: -2,
-    right: -2,
-    borderLeftWidth: 0,
-    borderTopWidth: 0,
-    borderBottomRightRadius: 12,
-  },
-  autoScanIndicator: {
-    position: 'absolute',
-    bottom: 12,
-    left: 12,
-    right: 12,
-    backgroundColor: 'rgba(255, 215, 0, 0.9)',
-    borderRadius: 6,
-    paddingVertical: 6,
-    paddingHorizontal: 12,
-  },
-  autoScanText: {
-    fontSize: 12,
-    fontWeight: '600',
-    color: '#0A0A0A',
-    textAlign: 'center',
-  },
-  controlsContainer: {
-    position: 'absolute',
-    top: 0,
-    left: 0,
-    right: 0,
-    bottom: 0,
-    pointerEvents: 'box-none',
-  },
-  topControls: {
-    flexDirection: 'row',
-    justifyContent: 'space-between',
-    paddingHorizontal: 20,
-    paddingTop: 60,
-  },
-  controlButton: {
-    width: 44,
-    height: 44,
-    borderRadius: 22,
-    backgroundColor: 'rgba(26, 26, 26, 0.8)',
-    alignItems: 'center',
-    justifyContent: 'center',
-  },
-  activeControl: {
-    backgroundColor: 'rgba(255, 215, 0, 0.9)',
-  },
-  bottomControls: {
-    position: 'absolute',
-    bottom: 40,
-    left: 0,
-    right: 0,
-    paddingHorizontal: 20,
-  },
-  sessionInfo: {
-    flexDirection: 'row',
-    justifyContent: 'center',
-    alignItems: 'center',
-    backgroundColor: 'rgba(26, 26, 26, 0.9)',
-    borderRadius: 12,
-    paddingVertical: 12,
-    paddingHorizontal: 20,
-    marginBottom: 16,
-  },
-  sessionStat: {
-    flexDirection: 'row',
-    alignItems: 'center',
-    marginHorizontal: 16,
-  },
-  sessionValue: {
-    fontSize: 18,
-    fontWeight: '700',
-    color: '#FFD700',
-    marginLeft: 4,
-  },
-  sessionLabel: {
-    fontSize: 12,
-    color: '#999',
-    marginLeft: 4,
-  },
-  actionButtons: {
-    alignItems: 'center',
-  },
-  startButton: {
-    flexDirection: 'row',
-    alignItems: 'center',
-    backgroundColor: '#FFD700',
-    paddingHorizontal: 32,
-    paddingVertical: 16,
-    borderRadius: 12,
-  },
-  startButtonText: {
-    fontSize: 18,
-    fontWeight: '600',
-    color: '#0A0A0A',
-    marginLeft: 8,
-  },
-  stopButton: {
-    flexDirection: 'row',
-    alignItems: 'center',
-    backgroundColor: '#FF4444',
-    paddingHorizontal: 32,
-    paddingVertical: 16,
-    borderRadius: 12,
-  },
-  stopButtonText: {
-    fontSize: 18,
-    fontWeight: '600',
-    color: '#FFFFFF',
-    marginLeft: 8,
-  },
-  permissionContainer: {
-    flex: 1,
-    alignItems: 'center',
     justifyContent: 'center',
-    backgroundColor: '#0A0A0A',
-    paddingHorizontal: 32,
-  },
-  permissionTitle: {
-    fontSize: 24,
-    fontWeight: '600',
-    color: '#FFFFFF',
-    marginTop: 16,
-    marginBottom: 8,
-  },
-  permissionDescription: {
-    fontSize: 16,
-    color: '#666',
-    textAlign: 'center',
-    lineHeight: 24,
-    marginBottom: 32,
-  },
-  permissionButton: {
-    backgroundColor: '#FFD700',
-    paddingHorizontal: 24,
-    paddingVertical: 12,
-    borderRadius: 8,
-  },
-  permissionButtonText: {
-    fontSize: 16,
-    fontWeight: '600',
-    color: '#0A0A0A',
+    paddingHorizontal: 16,
+    paddingVertical: 12,
+    borderBottomWidth: 1,
+    borderBottomColor: '#1A1A1A',
+  },
+  modeButton: {
+    flex: 1,
+    flexDirection: 'row',
+    alignItems: 'center',
+    justifyContent: 'center',
+    paddingVertical: 10,
+    marginHorizontal: 4,
+    borderRadius: 8,
+    backgroundColor: '#1A1A1A',
+  },
+  activeModeButton: {
+    backgroundColor: '#2A2A2A',
+  },
+  modeText: {
+    color: '#666',
+    fontSize: 12,
+    fontWeight: '600',
+    marginLeft: 6,
+  },
+  activeModeText: {
+    color: '#FFD700',
   },
   modalContainer: {
     flex: 1,
@@ .. @@
   resultsContainer: {
     flex: 1,
   },
   resultsSummary: {
-    backgroundColor: '#1A1A1A',
-    padding: 16,
     margin: 16,
-    borderRadius: 12,
+    padding: 16,
+  },
+  summaryHeader: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    marginBottom: 16,
   },
   resultsSummaryTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: '#FFFFFF',
-    marginBottom: 12,
+    marginLeft: 8,
   },
   summaryStats: {
     flexDirection: 'row',
@@ .. @@
   scannedCardsList: {
     padding: 16,
   },
   scannedCardItem: {
+    marginBottom: 12,
+  },
+  scannedCardContent: {
     flexDirection: 'row',
-    backgroundColor: '#1A1A1A',
-    borderRadius: 12,
-    padding: 12,
-    marginBottom: 12,
     alignItems: 'center',
+    gap: 12,
   },
   scannedCardImage: {
-    width: 60,
-    height: 84,
+    width: 56,
+    height: 78,
     borderRadius: 6,
-    marginRight: 12,
   },
   scannedCardInfo: {
     flex: 1,
@@ .. @@
   scannedCardName: {
     fontSize: 16,
     fontWeight: '600',
     color: '#FFFFFF',
     marginBottom: 4,
   },
   scannedCardSet: {
     fontSize: 13,
     color: '#CCC',
     marginBottom: 4,
   },
+  cardValueRow: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    justifyContent: 'space-between',
+    marginBottom: 4,
+  },
+  valueContainer: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    gap: 4,
+  },
   scannedCardValue: {
     fontSize: 15,
     fontWeight: '700',
     color: '#FFD700',
-    marginBottom: 2,
+  },
+  confidenceContainer: {
+    backgroundColor: 'rgba(255, 255, 255, 0.1)',
+    paddingHorizontal: 6,
+    paddingVertical: 2,
+    borderRadius: 8,
+  },
+  confidenceText: {
+    fontSize: 10,
+    fontWeight: '600',
+    color: '#999',
   },
   scannedCardCondition: {
     fontSize: 12,
@@ .. @@
   addButton: {
     width: 32,
     height: 32,
     borderRadius: 16,
-    backgroundColor: '#2A2A2A',
+    backgroundColor: '#FFD700',
     alignItems: 'center',
     justifyContent: 'center',
   },
 });