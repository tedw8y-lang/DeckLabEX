import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search as SearchIcon, 
  Filter, 
  Grid2x2 as Grid, 
  List, 
  TrendingUp, 
  Star,
  Clock,
  Zap,
  X,
  ExternalLink
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState, AppDispatch } from '../../src/store/store';
import { fetchCards, fetchSets } from '../../src/store/slices/cardsSlice';
import { 
  performSearch, 
  getPopularCards, 
  getSearchHistory,
  getPredictiveResults,
  setQuery 
} from '../../src/store/slices/searchSlice';
import { Card, CardSet } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { AdvancedFilterModal } from '../../src/components/ui/AdvancedFilterModal';
import { NewsTab } from '../../src/components/ui/NewsTab';
import { PokedexView } from '../../src/components/ui/PokedexView';
import { CompetitiveTools } from '../../src/components/ui/CompetitiveTools';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 32) / 2;

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { cards, sets, loading } = useSelector((state: RootState) => state.cards);
  const { 
    query: searchQuery, 
    results: searchResults, 
    history: searchHistory, 
    loading: searchLoading 
  } = useSelector((state: RootState) => state.search);
  
  const [localQuery, setLocalQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'sets' | 'pokedex' | 'news' | 'competitive'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [predictiveResults, setPredictiveResults] = useState<string[]>([]);
  const [showPredictive, setShowPredictive] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showCompetitiveTools, setShowCompetitiveTools] = useState(false);
  
  const [popularCards, setPopularCards] = useState<Card[]>([]);
  const setsArray = Object.values(sets);

  useEffect(() => {
    loadInitialData();
    if (user) {
      dispatch(getSearchHistory(user.id));
    }
  }, []);

  useEffect(() => {
    loadPopularCards();
  }, []);

  const loadInitialData = async () => {
    try {
      await dispatch(fetchSets()).unwrap();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadPopularCards = async () => {
    try {
      const popular = await dispatch(getPopularCards()).unwrap();
      setPopularCards(popular);
    } catch (error) {
      console.error('Failed to load popular cards:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    await loadPopularCards();
    setRefreshing(false);
  }, []);

  const handleSearchInput = (query: string) => {
    setLocalQuery(query);
    dispatch(setQuery(query));
    
    // Show predictive results for queries longer than 1 character
    if (query.length > 1) {
      setShowPredictive(true);
      dispatch(getPredictiveResults(query));
    } else {
      setShowPredictive(false);
      setPredictiveResults([]);
    }
  };

  const handleSearchSubmit = () => {
    if (localQuery.trim()) {
      dispatch(performSearch({ query: localQuery.trim(), filters: {} }));
      setShowPredictive(false);
    }
  };

  const handlePredictiveSelect = (suggestion: string) => {
    setLocalQuery(suggestion);
    dispatch(setQuery(suggestion));
    dispatch(performSearch({ query: suggestion, filters: {} }));
    setShowPredictive(false);
  };

  const handleCardPress = (card: Card) => {
    router.push(`/card/${card.id}`);
  };

  const handleSetPress = (set: CardSet) => {
    router.push(`/set/${set.id}`);
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchInputContainer}>
        <SearchIcon size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards, sets, or Pokemon..."
          placeholderTextColor="#666"
          value={localQuery}
          onChangeText={handleSearchInput}
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => setShowSearchHistory(true)}
        />
        {localQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setLocalQuery('');
              dispatch(setQuery(''));
              setShowPredictive(false);
            }}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity style={styles.filterButton}>
        <Filter size={20} color="#FFD700" onPress={() => setShowAdvancedFilter(true)} />
      </TouchableOpacity>
    </View>
  );

  const renderPredictiveResults = () => {
    if (!showPredictive || predictiveResults.length === 0) return null;

    return (
      <View style={styles.predictiveContainer}>
        {predictiveResults.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.predictiveItem}
            onPress={() => handlePredictiveSelect(suggestion)}
          >
            <SearchIcon size={16} color="#666" />
            <Text style={styles.predictiveText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSearchHistory = () => {
    if (!showSearchHistory || searchHistory.length === 0) return null;

    const recentSearches = searchHistory.slice(0, 7);

    return (
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Clock size={16} color="#666" />
          <Text style={styles.historyTitle}>Recent Searches</Text>
        </View>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={search.id}
            style={styles.historyItem}
            onPress={() => handlePredictiveSelect(search.query)}
          >
            <Text style={styles.historyText}>{search.query}</Text>
            <Text style={styles.historyResults}>{search.results} results</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSearchHeader = () => (
    <View style={styles.header}>
      {renderSearchBar()}
      {renderPredictiveResults()}
      {renderSearchHistory()}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <TrendingUp size={16} color={activeTab === 'popular' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
            Popular
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sets' && styles.activeTab]}
          onPress={() => setActiveTab('sets')}
        >
          <Grid size={16} color={activeTab === 'sets' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'sets' && styles.activeTabText]}>
            Sets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pokedex' && styles.activeTab]}
          onPress={() => setActiveTab('pokedex')}
        >
          <Zap size={16} color={activeTab === 'pokedex' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'pokedex' && styles.activeTabText]}>
            Pokédex
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => setActiveTab('news')}
        >
          <ExternalLink size={16} color={activeTab === 'news' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
            News
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
          onPress={() => setViewMode('grid')}
        >
          <Grid size={18} color={viewMode === 'grid' ? '#FFD700' : '#666'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
          onPress={() => setViewMode('list')}
        >
          <List size={18} color={viewMode === 'list' ? '#FFD700' : '#666'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCardItem = ({ item }: { item: Card }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.cardGridItem}
          onPress={() => handleCardPress(item)}
        >
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: item.images.large }}
              style={styles.cardImage}
              resizeMode="contain"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.cardOverlay}
            >
              <Text style={styles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.cardSet} numberOfLines={1}>
                {item.set.name}
              </Text>
              <Text style={styles.cardPrice}>
                ${item.prices?.market || item.prices?.mid || '0.00'}
              </Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.cardListItem}
        onPress={() => handleCardPress(item)}
      >
        <Image
          source={{ uri: item.images.small }}
          style={styles.cardListImage}
          resizeMode="contain"
        />
        <View style={styles.cardListInfo}>
          <Text style={styles.cardListName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardListSet} numberOfLines={1}>
            {item.set.name} • {item.rarity}
          </Text>
          <Text style={styles.cardListPrice}>
            ${item.prices?.market || item.prices?.mid || '0.00'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSetItem = ({ item }: { item: CardSet }) => (
    <TouchableOpacity
      style={styles.setItem}
      onPress={() => handleSetPress(item)}
    >
      <View style={styles.setImageContainer}>
        <Image
          source={{ uri: item.images.logo }}
          style={styles.setImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.setInfo}>
        <Text style={styles.setName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.setDetails}>
          {item.total} cards • {item.releaseDate}
        </Text>
        <Text style={styles.setSeries} numberOfLines={1}>
          {item.series}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'popular':
        return searchResults.length > 0 ? searchResults : popularCards;
      case 'sets':
        return setsArray;
      case 'pokedex':
        return searchResults.length > 0 ? searchResults : popularCards;
      case 'news':
        return [];
      case 'competitive':
        return [];
      default:
        return popularCards;
    }
  };

  const renderContent = () => {
    if (searchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }
    
    if (activeTab === 'news') {
      return <NewsTab />;
    }
    
    if (activeTab === 'pokedex') {
      return <PokedexView onCardPress={handleCardPress} />;
    }
    
    const currentData = getCurrentData();
    
    if (activeTab === 'sets') {
      return (
        <FlatList
          data={currentData}
          renderItem={renderSetItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.setRow}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={currentData}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.cardRow : undefined}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SearchIcon size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search terms or filters
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchHeader()}
      {renderContent()}
      
      <AdvancedFilterModal
        visible={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApplyFilters={(filters) => {
          dispatch(performSearch({ query: localQuery, filters }));
          setShowAdvancedFilter(false);
        }}
      />
      
      <CompetitiveTools
        visible={showCompetitiveTools}
        onClose={() => setShowCompetitiveTools(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
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
  predictiveContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 15,
    maxHeight: 200,
  },
  predictiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  predictiveText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 15,
    maxHeight: 250,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  historyText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  historyResults: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFD700',
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  viewModeButton: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeViewMode: {
    backgroundColor: '#2A2A2A',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cardRow: {
    justifyContent: 'space-between',
  },
  cardGridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  cardImageContainer: {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.7,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSet: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 4,
  },
  cardPrice: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  cardListItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardListImage: {
    width: 60,
    aspectRatio: 0.7,
    borderRadius: 6,
    marginRight: 12,
  },
  cardListInfo: {
    flex: 1,
  },
  cardListName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardListSet: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 4,
  },
  cardListPrice: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
  },
  setRow: {
    justifyContent: 'space-between',
  },
  setItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  setImageContainer: {
    width: '100%',
    height: 80,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setImage: {
    width: '80%',
    height: '100%',
  },
  setInfo: {
    width: '100%',
    alignItems: 'center',
  },
  setName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  setDetails: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 2,
  },
  setSeries: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '500',
  },
});