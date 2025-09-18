// 💎 DeckLab TCG - Liquid Glass Card Component with iOS-Inspired Effects
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../theme/ThemeContext';
import { shadows, glassEffects } from '../../theme/shadows';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'floating';
  blur?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  animated?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  blur = true,
  interactive = false,
  onPress,
  animated = true,
  glowColor,
}) => {
  const { isDark, colors, dynamicTheme, hapticFeedback } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Gesture handling
  const gesture = Gesture.Tap()
    .enabled(interactive)
    .onTouchesDown(() => {
      if (animated) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        elevation.value = withTiming(2, { duration: 100 });
      }
      hapticFeedback('light');
    })
    .onTouchesUp(() => {
      if (animated) {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        elevation.value = withTiming(0, { duration: 200 });
      }
    })
    .onEnd(() => {
      onPress?.();
    });

  // Hover effect (for web)
  const hoverGesture = Gesture.Hover()
    .onBegin(() => {
      if (interactive && animated) {
        glowOpacity.value = withTiming(0.3, { duration: 200 });
        elevation.value = withTiming(4, { duration: 200 });
      }
    })
    .onFinalize(() => {
      if (interactive && animated) {
        glowOpacity.value = withTiming(0, { duration: 300 });
        elevation.value = withTiming(0, { duration: 300 });
      }
    });

  const composedGesture = Gesture.Race(gesture, hoverGesture);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      shadowOffset: {
        width: 0,
        height: interpolate(elevation.value, [0, 4], [2, 8]),
      },
      shadowOpacity: interpolate(elevation.value, [0, 4], [0.1, 0.25]),
      shadowRadius: interpolate(elevation.value, [0, 4], [4, 12]),
      elevation: elevation.value,
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  }, []);

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return { ...shadows.lg, borderRadius: 20 };
      case 'flat':
        return { ...shadows.sm, borderRadius: 12 };
      case 'floating':
        return { ...shadows.float, borderRadius: 24 };
      default:
        return { ...shadows.md, borderRadius: 16 };
    }
  };

  const variantStyles = getVariantStyles();
  const backgroundColors = isDark ? colors.background : colors.backgroundLight;
  const glassColors = isDark ? colors.gradients.glass : colors.gradients.glassLight;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, variantStyles, animatedStyle, style]}>
        {/* Background with blur effect */}
        <LinearGradient
          colors={[backgroundColors.glass, backgroundColors.glassHeavy] as const}
          style={[StyleSheet.absoluteFill, { borderRadius: variantStyles.borderRadius }]}
        />
        
        {/* Glass overlay */}
        {blur && (
          <LinearGradient
            colors={[glassColors[0], glassColors[1]] as const}
            style={[styles.glassOverlay, { borderRadius: variantStyles.borderRadius }]}
          />
        )}

        {/* Glow effect */}
        {(interactive || glowColor) && (
          <Animated.View style={[styles.glowContainer, glowStyle]}>
            <LinearGradient
              colors={[
                glowColor || dynamicTheme.primary + '20',
                'transparent',
              ] as const}
              style={[StyleSheet.absoluteFill, { borderRadius: variantStyles.borderRadius }]}
            />
          </Animated.View>
        )}

        {/* Border highlight */}
        <View style={[styles.border, { borderRadius: variantStyles.borderRadius }]} />
        
        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  glowContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: 16,
  },
});