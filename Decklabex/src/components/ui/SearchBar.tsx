import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFilterPress?: () => void;
  suggestions?: string[];
  recentSearches?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  suggestions = [],
  recentSearches = [],
  onSuggestionPress,
  placeholder = "Search...",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const showSuggestions = isFocused && (suggestions.length > 0 || recentSearches.length > 0);

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleSuggestionPress = (suggestion: string) => {
    onChangeText(suggestion);
    onSuggestionPress?.(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const renderSuggestionItem = ({ item, index }: { item: string; index: number }) => {
    const isRecent = index < recentSearches.length;
    
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        {isRecent ? (
          <MaterialCommunityIcons name="clock" size={16} color="#666" />
        ) : (
          <MaterialCommunityIcons name="magnify" size={16} color="#666" />
        )}
        <Text style={styles.suggestionText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#666"
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          />
          {value.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <MaterialCommunityIcons name="close" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {onFilterPress && (
          <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
            <MaterialCommunityIcons name="filter" size={20} color="#FFD700" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={[...recentSearches.slice(0, 5), ...suggestions.slice(0, 5)]}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => `${item}_${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#FFD700',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 44,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
});