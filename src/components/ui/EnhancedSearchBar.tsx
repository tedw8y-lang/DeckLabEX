// 🔍 DeckLab TCG - Production-Ready Search Engine with Real-Time Intelligence
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { 
  Search as SearchIcon, 
  Filter, 
  X, 
  Clock, 
  Zap, 
  TrendingUp,
  Star,
  Sparkles
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { 
  setQuery, 
  performSearch, 
  getPredictiveResults,
  getSearchHistory 
} from '../../store/slices/searchSlice';
import { GlassCard } from './GlassCard';

interface EnhancedSearchBarProps {
  onFilterPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const { width } = Dimensions.get('window');
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onFilterPress,
  placeholder = "Search cards, sets, Pokémon...",
  autoFocus = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { query, history, loading } = useSelector((state: RootState) => state.search);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [localQuery, setLocalQuery] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [predictiveResults, setPredictiveResults] = useState<string[]>([]);
  
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Animation values
  const focusScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const suggestionsHeight = useSharedValue(0);
  const searchIconRotation = useSharedValue(0);

  useEffect(() => {
    if (user) {
      dispatch(getSearchHistory(user.id));
    }
  }, [user, dispatch]);

  useEffect(() => {
    // Debounced predictive search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (localQuery.length > 1) {
      searchTimeoutRef.current = setTimeout(() => {
        loadPredictiveResults();
      }, 300);
    } else {
      setPredictiveResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [localQuery]);

  const loadPredictiveResults = async () => {
    try {
      const results = await dispatch(getPredictiveResults(localQuery)).unwrap();
      const suggestions = results.map(card => card.name).slice(0, 5);
      setPredictiveResults(suggestions);
    } catch (error) {
      console.error('Error loading predictive results:', error);
    }
  };

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
    focusScale.value = withSpring(1.02, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.6, { duration: 200 });
    searchIconRotation.value = withSpring(360, { damping: 20 });
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
    
    focusScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 300 });
    searchIconRotation.value = withSpring(0, { damping: 20 });
  }, []);

  const handleSearchInput = useCallback((text: string) => {
    setLocalQuery(text);
    dispatch(setQuery(text));
    
    if (text.length > 1) {
      setShowSuggestions(true);
      suggestionsHeight.value = withSpring(Math.min(300, predictiveResults.length * 56 + history.slice(0, 3).length * 56));
    } else {
      suggestionsHeight.value = withSpring(0);
    }
  }, [predictiveResults.length, history.length]);

  const handleSearchSubmit = useCallback(() => {
    if (localQuery.trim()) {
      dispatch(performSearch({ query: localQuery.trim(), filters: {} }));
      setShowSuggestions(false);
      inputRef.current?.blur();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [localQuery, dispatch]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setLocalQuery(suggestion);
    dispatch(setQuery(suggestion));
    dispatch(performSearch({ query: suggestion, filters: {} }));
    setShowSuggestions(false);
    inputRef.current?.blur();
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [dispatch]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    dispatch(setQuery(''));
    setPredictiveResults([]);
    inputRef.current?.focus();
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [dispatch]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const searchIconStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${interpolate(searchIconRotation.value, [0, 360], [0, 360])}deg`,
    }],
  }));

  const suggestionsStyle = useAnimatedStyle(() => ({
    height: suggestionsHeight.value,
    opacity: interpolate(suggestionsHeight.value, [0, 50], [0, 1]),
  }));

  const renderSuggestionItem = ({ item, index }: { item: string; index: number }) => {
    const isRecent = index < history.slice(0, 3).length;
    const isPopular = predictiveResults.includes(item);
    
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          {isRecent ? (
            <Clock size={16} color="#666" />
          ) : isPopular ? (
            <TrendingUp size={16} color="#FFD700" />
          ) : (
            <SearchIcon size={16} color="#999" />
          )}
        </View>
        
        <Text style={styles.suggestionText} numberOfLines={1}>
          {item}
        </Text>
        
        {isPopular && (
          <View style={styles.popularBadge}>
            <Sparkles size={12} color="#FFD700" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const allSuggestions = [
    ...history.slice(0, 3).map(h => h.query),
    ...predictiveResults.filter(p => !history.slice(0, 3).some(h => h.query === p))
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[containerStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.3)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Main search container */}
        <GlassCard style={styles.searchCard} variant="default" blur={true}>
          <View style={styles.searchContainer}>
            {/* Animated search icon */}
            <Animated.View style={[styles.searchIconContainer, searchIconStyle]}>
              <SearchIcon 
                size={20} 
                color={isFocused ? '#FFD700' : '#666'} 
              />
            </Animated.View>

            {/* Text input */}
            <AnimatedTextInput
              ref={inputRef}
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#666"
              value={localQuery}
              onChangeText={handleSearchInput}
              onSubmitEditing={handleSearchSubmit}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoFocus={autoFocus}
              returnKeyType="search"
              selectionColor="#FFD700"
              autoCorrect={false}
              autoCapitalize="none"
            />

            {/* Loading indicator or clear button */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={[styles.loadingDot, { backgroundColor: '#FFD700' }]} />
              </View>
            ) : localQuery.length > 0 ? (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <View style={styles.clearButtonBackground}>
                  <X size={14} color="#999" />
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Filter button */}
            {onFilterPress && (
              <TouchableOpacity 
                style={styles.filterButton} 
                onPress={onFilterPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
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
      {showSuggestions && allSuggestions.length > 0 && (
        <Animated.View style={[styles.suggestionsContainer, suggestionsStyle]}>
          <GlassCard variant="elevated" blur={true}>
            <FlatList
              data={allSuggestions}
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
    marginHorizontal: 16,
    marginVertical: 8,
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
    minHeight: 48,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    height: 40,
  },
  clearButton: {
    marginLeft: 8,
    marginRight: 4,
  },
  clearButtonBackground: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
  },
  suggestionsList: {
    maxHeight: 300,
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
    width: 20,
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  popularBadge: {
    marginLeft: 8,
  },
});