import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Canvas, useSharedValueEffect, useDerivedValue } from '@shopify/react-native-skia';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';
import { X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react-native';
import { Card } from '../../types/global';

interface LiveCardModelProps {
  card: Card;
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 0.7;
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

export const LiveCardModel: React.FC<LiveCardModelProps> = ({
  card,
  visible,
  onClose,
}) => {
  const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      startGyroscope();
    } else {
      stopGyroscope();
    }

    return () => stopGyroscope();
  }, [visible]);

  const startGyroscope = async () => {
    try {
      await Gyroscope.setUpdateInterval(16); // 60fps
      const sub = Gyroscope.addListener(({ x, y, z }) => {
        setGyroscopeData({ x, y, z });
        
        // Apply gyroscope data to card rotation
        rotationX.value = withSpring(-y * 30, { damping: 15 });
        rotationY.value = withSpring(x * 30, { damping: 15 });
      });
      setSubscription(sub);
    } catch (error) {
      console.error('Gyroscope not available:', error);
    }
  };

  const stopGyroscope = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Stop gyroscope when user touches
      stopGyroscope();
    },
    onPanResponderMove: (evt, gestureState) => {
      // Manual rotation based on touch
      const { dx, dy } = gestureState;
      rotationY.value = withSpring(dx * 0.5, { damping: 15 });
      rotationX.value = withSpring(-dy * 0.5, { damping: 15 });
    },
    onPanResponderRelease: () => {
      // Resume gyroscope
      if (visible) {
        startGyroscope();
      }
    },
  });

  const handleZoomIn = () => {
    scale.value = withSpring(Math.min(scale.value + 0.2, 3));
  };

  const handleZoomOut = () => {
    scale.value = withSpring(Math.max(scale.value - 0.2, 0.5));
  };

  const handleReset = () => {
    rotationX.value = withSpring(0);
    rotationY.value = withSpring(0);
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const renderHolographicCard = () => {
    // This would use Skia to render the holographic effect
    // For now, we'll use a placeholder that shows the concept
    return (
      <View 
        style={[
          styles.cardContainer,
          {
            transform: [
              { perspective: 1000 },
              { rotateX: `${rotationX.value}deg` },
              { rotateY: `${rotationY.value}deg` },
              { scale: scale.value },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.card}>
          <View style={styles.holographicOverlay} />
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardSet}>{card.set.name}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Live Card Model</Text>
          
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <RotateCcw size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardArea}>
          {renderHolographicCard()}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
            <ZoomOut size={24} color="#FFD700" />
          </TouchableOpacity>
          
          <View style={styles.gyroscopeIndicator}>
            <Text style={styles.gyroscopeText}>
              Tilt your device to rotate the card
            </Text>
            <Text style={styles.gyroscopeData}>
              X: {gyroscopeData.x.toFixed(2)} Y: {gyroscopeData.y.toFixed(2)}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
            <ZoomIn size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  holographicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderRadius: 16,
    // This would contain the Skia holographic shader
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSet: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gyroscopeIndicator: {
    alignItems: 'center',
  },
  gyroscopeText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  gyroscopeData: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});