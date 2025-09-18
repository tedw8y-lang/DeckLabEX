// 🎨 DeckLab TCG - Tamagui Configuration for High-Performance UI
import { createTamagui } from '@tamagui/core';
import { config } from '@tamagui/config/v3';
import { createInterFont } from '@tamagui/font-inter';
import { createMedia } from '@tamagui/react-native-media-driver';

const interFont = createInterFont();

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
    body: interFont,
    heading: interFont,
  },
  themes: {
    ...config.themes,
    // DeckLab custom themes
    decklab_dark: {
      background: '#0A0A0A',
      backgroundHover: '#1A1A1A',
      backgroundPress: '#2A2A2A',
      backgroundFocus: '#2A2A2A',
      color: '#FFFFFF',
      colorHover: '#E0E0E0',
      colorPress: '#B0B0B0',
      colorFocus: '#FFFFFF',
      borderColor: '#1A1A1A',
      borderColorHover: '#2A2A2A',
      borderColorPress: '#FFD700',
      borderColorFocus: '#FFD700',
      placeholderColor: '#666666',
    },
    decklab_light: {
      background: '#FFFFFF',
      backgroundHover: '#F8F9FA',
      backgroundPress: '#F1F3F4',
      backgroundFocus: '#F1F3F4',
      color: '#000000',
      colorHover: '#1F1F1F',
      colorPress: '#4F4F4F',
      colorFocus: '#000000',
      borderColor: '#E8EAED',
      borderColorHover: '#DADCE0',
      borderColorPress: '#FFD700',
      borderColorFocus: '#FFD700',
      placeholderColor: '#999999',
    },
  },
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      // DeckLab brand colors
      pokemonYellow: '#FFD700',
      pokemonYellowDark: '#FFA500',
      pokemonBlue: '#3B82F6',
      pokemonRed: '#EF4444',
      pokemonGreen: '#10B981',
      
      // Glass effect colors
      glassLight: 'rgba(255, 255, 255, 0.1)',
      glassMedium: 'rgba(255, 255, 255, 0.2)',
      glassHeavy: 'rgba(255, 255, 255, 0.3)',
      glassDark: 'rgba(0, 0, 0, 0.1)',
      glassDarkMedium: 'rgba(0, 0, 0, 0.2)',
      glassDarkHeavy: 'rgba(0, 0, 0, 0.3)',
    },
    space: {
      ...config.tokens.space,
      // DeckLab spacing system (8px base)
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    radius: {
      ...config.tokens.radius,
      // DeckLab border radius system
      card: 12,
      button: 8,
      modal: 16,
      fab: 28,
    },
  },
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
});

export type AppConfig = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;