import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Filter, 
  Grid3x3 as Grid, 
  List, 
  TrendingUp,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState, AppDispatch } from '../../src/store/store';
import { fetchSetById, fetchCardsInSet } from '../../src/store/slices/cardsSlice';
import { Card, CardSet } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { CardItem } from '../../src/components/ui/CardItem';

export default function SetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { sets, cards, loading } = useSelector((state: RootState) => state.cards);
  const { collections } = useSelector((state: RootState) => state.collections);
  
  const [set, setSet] = useState<CardSet | null>(null);
  const [setCards, setSetCards] = useState<Card[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'rarity' | 'type'>('number');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadSetData();
    }
  }, [id]);

  const loadSetData = async () => {
    try {
      // Get set from store or fetch if not available
      let setData = sets[id!];
      
      if (!setData) {
        setData = await dispatch(fetchSetById(id!)).unwrap();
      }
      
      setSet(setData);
      
      // Load cards in set
      const cardsResponse = await dispatch(fetchCardsInSet(id!)).unwrap();
      setSetCards(cardsResponse);
      
    } catch (error) {
      console.error('Failed to load set data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSetData();
    setRefreshing(false);
  };

  const getOwnedCardsCount = () => {
    const collectionsArray = Object.values(collections);
    const ownedCardIds = new Set<string>();
    
    collectionsArray.forEach(collection => {
      collection.cards.forEach(collectionCard => {
        if (setCards.some(setCard => setCard.id === collectionCard.cardId)) {
          ownedCardIds.add(collectionCard.cardId);
        }
      });
    });
    
    return ownedCardIds.size;
  };

  const getTotalSetValue = () => {
    return setCards.reduce((total, card) => {
      const price = card.prices?.market || card.prices?.mid || 0;
      return total + price;
    }, 0);
  };

  const getSortedCards = () => {
    const sorted = [...setCards];
    
    switch (sortBy) {
      case 'number':
        return sorted.sort((a, b) => {
          const aNum = parseInt(a.setNumber) || 0;
          const bNum = parseInt(b.setNumber) || 0;
          return aNum - bNum;
        });
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'rarity':
        return sorted.sort((a, b) => a.rarity.localeCompare(b.rarity));
      case 'type':
        return sorted.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      default:
        return sorted;
    }
  };

  const renderSetHeader = () => {
    const ownedCount = getOwnedCardsCount();
    const totalValue = getTotalSetValue();
    const completionPercentage = set ? (ownedCount / set.total) * 100 : 0;

    return (
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A']}
        style={styles.setHeader}
      >
        <Image
          source={{ uri: set?.images.logo }}
          style={styles.setLogo}
          resizeMode="contain"
        />
        
        <Text style={styles.setName}>{set?.name}</Text>
        <Text style={styles.setSeries}>{set?.series}</Text>
        
        <View style={styles.setStats}>
          <View style={styles.statItem}>
            <Package size={20} color="#FFD700" />
            <Text style={styles.statValue}>{set?.total}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          
          <View style={styles.statItem}>
            <TrendingUp size={20} color="#4CAF50" />
            <Text style={styles.statValue}>{ownedCount}</Text>
            <Text style={styles.statLabel}>Owned</Text>
          </View>
          
          <View style={styles.statItem}>
            <DollarSign size={20} color="#FF9800" />
            <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Set Value</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${completionPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completionPercentage.toFixed(1)}% Complete
          </Text>
        </View>

        <Text style={styles.releaseDate}>
          Released {new Date(set?.releaseDate || '').toLocaleDateString()}
        </Text>
      </LinearGradient>
    );
  };

  const renderControls = () => (
    <View style={styles.controls}>
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'number' && styles.activeSortButton]}
          onPress={() => setSortBy('number')}
        >
          <Text style={[styles.sortText, sortBy === 'number' && styles.activeSortText]}>
            Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortText, sortBy === 'name' && styles.activeSortText]}>
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rarity' && styles.activeSortButton]}
          onPress={() => setSortBy('rarity')}
        >
          <Text style={[styles.sortText, sortBy === 'rarity' && styles.activeSortText]}>
            Rarity
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

  if (loading || !set) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading set details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{set.name}</Text>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getSortedCards()}
        renderItem={({ item }) => (
          <CardItem
            card={item}
            onPress={(card) => router.push(`/card/${card.id}`)}
            viewMode={viewMode}
          />
        )}
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
        ListHeaderComponent={
          <View>
            {renderSetHeader()}
            {renderControls()}
          </View>
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setHeader: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  setLogo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  setName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  setSeries: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 20,
  },
  setStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  progressText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  releaseDate: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    marginRight: 6,
  },
  activeSortButton: {
    backgroundColor: '#2A2A2A',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
  },
  activeSortText: {
    color: '#FFD700',
  },
  viewModeContainer: {
    flexDirection: 'row',
  },
  viewModeButton: {
    width: 36,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  activeViewMode: {
    backgroundColor: '#2A2A2A',
  },
  contentContainer: {
    padding: 16,
  },
  cardRow: {
    justifyContent: 'space-between',
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
});