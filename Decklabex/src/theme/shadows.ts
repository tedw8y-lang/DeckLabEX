// 🌟 DeckLab TCG - iOS-Inspired Liquid Glass Shadow System

import { ViewStyle } from 'react-native';

// Shadow presets for iOS-style depth
export const shadows = {
  // Subtle depth for cards and buttons
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,

  // Standard cards and components
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  // Prominent elements like modals
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,

  // Major UI elements like sheets
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  } as ViewStyle,

  // Floating elements
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  } as ViewStyle,
};

// Dynamic shadows with color theming
export const createColoredShadow = (color: string, intensity: 'sm' | 'md' | 'lg' | 'xl' = 'md'): ViewStyle => {
  const base = shadows[intensity];
  const baseOpacity = typeof base.shadowOpacity === 'number' ? base.shadowOpacity : 0.15;
  
  return {
    ...base,
    shadowColor: color,
    shadowOpacity: baseOpacity * 0.8, // Reduce opacity for colored shadows
  };
};

// Liquid glass effect shadows
export const glassEffects = {
  // Subtle inner glow
  innerGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
  } as ViewStyle,

  // Outer glass reflection
  outerGlow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,

  // Frosted glass effect
  frosted: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  } as ViewStyle,
};

// Animation-ready shadows for smooth transitions
export const animatedShadows = {
  pressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  } as ViewStyle,

  hover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  } as ViewStyle,

  focus: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
};