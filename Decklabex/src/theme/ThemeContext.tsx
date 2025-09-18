// 🎨 DeckLab TCG - AI-Powered Theme Context with Liquid Glass Effects
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { generatePokemonTheme, generateCardTheme, baseColors, DynamicTheme } from './colors';
import { RootState } from '../types/global';

interface ThemeContextType {
  isDark: boolean;
  colors: typeof baseColors;
  dynamicTheme: DynamicTheme;
  activePokemon: any;
  activeCard: any;
  setActivePokemon: (pokemon: any) => void;
  setActiveCard: (card: any) => void;
  resetTheme: () => void;
  toggleTheme: () => void;
  hapticFeedback: (type?: 'light' | 'medium' | 'heavy') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const userPreferences = useSelector((state: RootState) => state.ui);
  const [isDark, setIsDark] = useState(true);
  const [activePokemon, setActivePokemon] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [dynamicTheme, setDynamicTheme] = useState<DynamicTheme>(generatePokemonTheme(null));

  // Handle system theme changes
  useEffect(() => {
    if (userPreferences.theme === 'system') {
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
      
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDark(colorScheme === 'dark');
      });
      
      return () => subscription?.remove();
    } else {
      setIsDark(userPreferences.theme === 'dark');
    }
  }, [userPreferences.theme]);

  // Update dynamic theme when Pokemon or Card changes
  useEffect(() => {
    if (activeCard) {
      setDynamicTheme(generateCardTheme(activeCard));
    } else if (activePokemon) {
      setDynamicTheme(generatePokemonTheme(activePokemon));
    } else {
      setDynamicTheme(generatePokemonTheme(null));
    }
  }, [activePokemon, activeCard]);

  const handleSetActivePokemon = (pokemon: any) => {
    setActivePokemon(pokemon);
    setActiveCard(null); // Clear card when setting Pokemon
    hapticFeedback('light');
  };

  const handleSetActiveCard = (card: any) => {
    setActiveCard(card);
    setActivePokemon(null); // Clear Pokemon when setting card
    hapticFeedback('light');
  };

  const resetTheme = () => {
    setActivePokemon(null);
    setActiveCard(null);
    hapticFeedback('medium');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    hapticFeedback('light');
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      // Silently fail on platforms that don't support haptics
    }
  };

  const contextValue: ThemeContextType = {
    isDark,
    colors: baseColors,
    dynamicTheme,
    activePokemon,
    activeCard,
    setActivePokemon: handleSetActivePokemon,
    setActiveCard: handleSetActiveCard,
    resetTheme,
    toggleTheme,
    hapticFeedback,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};