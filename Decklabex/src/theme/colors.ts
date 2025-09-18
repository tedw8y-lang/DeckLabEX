// 🎨 DeckLab TCG - Advanced Color System with AI Theming
import { Card } from '../types/global';

// Base theme colors with liquid glass effects
export const baseColors = {
  // Dark theme foundation
  background: {
    primary: '#000000',
    secondary: '#0A0A0A', 
    tertiary: '#1A1A1A',
    quaternary: '#2A2A2A',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassHeavy: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Light theme foundation
  backgroundLight: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F4',
    quaternary: '#E8EAED',
    glass: 'rgba(0, 0, 0, 0.05)',
    glassHeavy: 'rgba(0, 0, 0, 0.1)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    tertiary: '#B0B0B0',
    quaternary: '#808080',
    muted: '#666666',
  },

  textLight: {
    primary: '#000000',
    secondary: '#1F1F1F',
    tertiary: '#4F4F4F',
    quaternary: '#808080',
    muted: '#999999',
  },

  // Brand colors
  brand: {
    primary: '#FFD700',
    secondary: '#FFA500',
    tertiary: '#FF8C00',
    accent: '#32D74B',
  },

  // Status colors
  status: {
    success: '#32D74B',
    warning: '#FF9500',
    error: '#FF453A',
    info: '#007AFF',
  },

  // Pokémon type colors for theming
  pokemon: {
    normal: '#A8A878',
    fighting: '#C03028',
    flying: '#A890F0',
    poison: '#A040A0',
    ground: '#E0C068',
    rock: '#B8A038',
    bug: '#A8B820',
    ghost: '#705898',
    steel: '#B8B8D0',
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    psychic: '#F85888',
    ice: '#98D8D8',
    dragon: '#7038F8',
    dark: '#705848',
    fairy: '#EE99AC',
    colorless: '#68A090',
  },

  // Gradient definitions for liquid glass effects
  gradients: {
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
    glassLight: ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.01)'],
    brand: ['#FFD700', '#FFA500'],
    brandSoft: ['rgba(255, 215, 0, 0.8)', 'rgba(255, 165, 0, 0.3)'],
    overlay: ['transparent', 'rgba(0, 0, 0, 0.8)'],
  },
};

// AI-powered dynamic theme generation based on Pokémon
export interface DynamicTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glass: string[];
  textOverlay: string;
  shadow: string;
}

// Generate theme from Pokémon data
export const generatePokemonTheme = (pokemon: any): DynamicTheme => {
  if (!pokemon) {
    return {
      primary: baseColors.brand.primary,
      secondary: baseColors.brand.secondary,
      accent: baseColors.brand.accent,
      background: baseColors.background.secondary,
      glass: baseColors.gradients.glass,
      textOverlay: baseColors.text.primary,
      shadow: 'rgba(255, 215, 0, 0.3)',
    };
  }

  // Extract colors from Pokémon types
  const primaryType = pokemon.types?.[0]?.type?.name || 'normal';
  const secondaryType = pokemon.types?.[1]?.type?.name || primaryType;
  
  const primaryColor = baseColors.pokemon[primaryType as keyof typeof baseColors.pokemon] || baseColors.pokemon.normal;
  const secondaryColor = baseColors.pokemon[secondaryType as keyof typeof baseColors.pokemon] || primaryColor;
  
  // Generate complementary colors
  const accentColor = generateComplementaryColor(primaryColor);
  const glassColor = hexToRgba(primaryColor, 0.1);
  const shadowColor = hexToRgba(primaryColor, 0.3);

  return {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    background: baseColors.background.secondary,
    glass: [glassColor, hexToRgba(primaryColor, 0.02)],
    textOverlay: baseColors.text.primary,
    shadow: shadowColor,
  };
};

// Generate theme from TCG card data
export const generateCardTheme = (card: Card): DynamicTheme => {
  if (!card) {
    return generatePokemonTheme(null);
  }

  // Extract colors from card type/energy
  const cardTypes = card.type ? [card.type] : [];
  const primaryType = cardTypes[0] || 'colorless';
  
  const primaryColor = baseColors.pokemon[primaryType.toLowerCase() as keyof typeof baseColors.pokemon] || baseColors.pokemon.colorless;
  
  // Use rarity for secondary color intensity
  let secondaryColor = primaryColor;
  if (card.rarity) {
    if (card.rarity.toLowerCase().includes('rare') || card.rarity.toLowerCase().includes('ultra')) {
      secondaryColor = adjustBrightness(primaryColor, 20);
    } else if (card.rarity.toLowerCase().includes('common')) {
      secondaryColor = adjustBrightness(primaryColor, -20);
    }
  }

  const accentColor = generateComplementaryColor(primaryColor);
  const glassColor = hexToRgba(primaryColor, 0.15);
  const shadowColor = hexToRgba(primaryColor, 0.4);

  return {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    background: baseColors.background.secondary,
    glass: [glassColor, hexToRgba(primaryColor, 0.03)],
    textOverlay: baseColors.text.primary,
    shadow: shadowColor,
  };
};

// Utility functions
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const adjustBrightness = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * amount);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1);
};

export const generateComplementaryColor = (hex: string): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = 255 - (num >> 16);
  const g = 255 - (num >> 8 & 0x00FF);
  const b = 255 - (num & 0x0000FF);
  
  // Ensure the complementary color is not too dark
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 128) {
    return adjustBrightness('#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'), 50);
  }
  
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};