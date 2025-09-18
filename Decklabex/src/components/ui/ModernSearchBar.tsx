// 🔍 DeckLab TCG - Modern iOS-Inspired Search Bar with Liquid Glass Effects
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Note: BlurView removed - using glass effects instead
import { Search as SearchIcon, Filter, X, Clock, Zap } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from './GlassCard';

interface ModernSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFilterPress?: () => void;
  suggestions?: string[];
  recentSearches?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  loading?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const ModernSearchBar: React.FC<ModernSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  suggestions = [],
  recentSearches = [],
  onSuggestionPress,
  placeholder = "Search cards, sets, Pokémon...",
  autoFocus = false,
  loading = false,
}) => {
  const { isDark, colors, dynamicTheme, hapticFeedback } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const focusScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const suggestionsHeight = useSharedValue(0);
  const searchIconRotation = useSharedValue(0);

  const showSuggestions = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  useEffect(() => {
    if (showSuggestions) {
      suggestionsHeight.value = withSpring(Math.min(250, (suggestions.length + recentSearches.length) * 56));
    } else {
      suggestionsHeight.value = withSpring(0);
    }
  }, [showSuggestions, suggestions.length, recentSearches.length]);

  // Handle focus/blur animations
  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.6, { duration: 200 });
    searchIconRotation.value = withSpring(360, { damping: 20 });
    hapticFeedback('light');
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
    focusScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 300 });
    searchIconRotation.value = withSpring(0, { damping: 20 });
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
    hapticFeedback('medium');
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText(suggestion);
    onSuggestionPress?.(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
    hapticFeedback('light');
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: focusScale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const searchIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            searchIconRotation.value,
            [0, 360],
            [0, 360]
          )}deg`,
        },
      ],
    };
  });

  const suggestionsStyle = useAnimatedStyle(() => {
    return {
      height: suggestionsHeight.value,
      opacity: interpolate(suggestionsHeight.value, [0, 50], [0, 1]),
    };
  });

  const backgroundColors = isDark ? colors.background : colors.backgroundLight;
  const textColors = isDark ? colors.text : colors.textLight;

  const renderSuggestionItem = ({ item, index }: { item: string; index: number }) => {
    const isRecent = index < recentSearches.length;
    
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          {isRecent ? (
            <Clock size={16} color={textColors.tertiary} />
          ) : (
            <Zap size={16} color={dynamicTheme.accent} />
          )}
        </View>
        <Text style={[styles.suggestionText, { color: textColors.primary }]} numberOfLines={1}>
          {item}
        </Text>
        {!isRecent && (
          <View style={[styles.suggestionBadge, { backgroundColor: dynamicTheme.primary + '20' }]}>
            <Text style={[styles.suggestionBadgeText, { color: dynamicTheme.primary }]}>
              Popular
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[containerStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={[dynamicTheme.primary + '30', 'transparent'] as const}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Main search container */}
        <GlassCard 
          style={styles.searchCard}
          variant="default"
          blur={true}
          interactive={false}
        >
          <View style={styles.searchContainer}>
            {/* Search icon with animation */}
            <Animated.View style={[styles.searchIconContainer, searchIconStyle]}>
              <SearchIcon size={20} color={isFocused ? dynamicTheme.primary : textColors.tertiary} />
            </Animated.View>

            {/* Text input */}
            <AnimatedTextInput
              ref={inputRef}
              style={[styles.input, { color: textColors.primary }]}
              placeholder={placeholder}
              placeholderTextColor={textColors.quaternary}
              value={value}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoFocus={autoFocus}
              returnKeyType="search"
              selectionColor={dynamicTheme.primary}
            />

            {/* Loading indicator or clear button */}
            {loading ? (
              <Animated.View style={styles.loadingContainer}>
                {/* Add loading spinner here */}
                <View style={[styles.loadingDot, { backgroundColor: dynamicTheme.primary }]} />
              </Animated.View>
            ) : value.length > 0 ? (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <View style={[styles.clearButtonBackground, { backgroundColor: backgroundColors.tertiary }]}>
                  <X size={14} color={textColors.secondary} />
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Filter button */}
            {onFilterPress && (
              <TouchableOpacity 
                style={styles.filterButton} 
                onPress={() => {
                  onFilterPress();
                  hapticFeedback('medium');
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[dynamicTheme.primary, dynamicTheme.secondary] as const}
                  style={styles.filterButtonBackground}
                >
                  <Filter size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <Animated.View style={[styles.suggestionsContainer, suggestionsStyle]}>
          <GlassCard variant="elevated" blur={true}>
            <FlatList
              data={[...recentSearches.slice(0, 3), ...suggestions.slice(0, 5)]}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) => `${item}_${index}`}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
          </GlassCard>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  glowContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
  },
  searchCard: {
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: 36,
  },
  clearButton: {
    marginLeft: 8,
    marginRight: 4,
  },
  clearButtonBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    marginLeft: 8,
  },
  filterButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginLeft: 8,
    marginRight: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1001,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});