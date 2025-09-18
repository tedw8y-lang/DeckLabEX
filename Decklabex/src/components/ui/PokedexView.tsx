import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Eye, EyeOff, Star } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Card } from '../../types/global';
import { pokemonTcgService } from '../../services/pokemonTcgService';

interface PokemonEntry {
  nationalPokedexNumber: number;
  name: string;
  cards: Card[];
  ownedCount: number;
  totalCount: number;
  types: string[];
  evolutionStage: string;
}

interface PokedexViewProps {
  onCardPress: (card: Card) => void;
}

export const PokedexView: React.FC<PokedexViewProps> = ({ onCardPress }) => {
  const { collections } = useSelector((state: RootState) => state.collections);
  const { cards } = useSelector((state: RootState) => state.cards);
  
  const [pokemonEntries, setPokemonEntries] = useState<PokemonEntry[]>([]);
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPokedexData();
  }, []);

  const loadPokedexData = async () => {
    setLoading(true);
    try {
      // Get all Pokemon cards and group by National Pokedex number
      const allCards = Object.values(cards);
      const pokemonCards = allCards.filter(card => 
        card.nationalPokedexNumbers && card.nationalPokedexNumbers.length > 0
      );

      const pokemonMap = new Map<number, PokemonEntry>();

      pokemonCards.forEach(card => {
        card.nationalPokedexNumbers?.forEach(pokedexNumber => {
          if (!pokemonMap.has(pokedexNumber)) {
            pokemonMap.set(pokedexNumber, {
              nationalPokedexNumber: pokedexNumber,
              name: extractPokemonName(card.name),
              cards: [],
              ownedCount: 0,
              totalCount: 0,
              types: [],
              evolutionStage: card.evolutionStage || 'Basic',
            });
          }

          const entry = pokemonMap.get(pokedexNumber)!;
          entry.cards.push(card);
          entry.totalCount++;
          
          if (card.type && !entry.types.includes(card.type)) {
            entry.types.push(card.type);
          }

          // Check if user owns this card
          const isOwned = checkCardOwnership(card.id);
          if (isOwned) {
            entry.ownedCount++;
          }
        });
      });

      const entries = Array.from(pokemonMap.values()).sort(
        (a, b) => a.nationalPokedexNumber - b.nationalPokedexNumber
      );

      setPokemonEntries(entries);
    } catch (error) {
      console.error('Error loading Pokedex data:', error);
    }
    setLoading(false);
  };

  const extractPokemonName = (cardName: string): string => {
    // Extract base Pokemon name from card name
    // e.g., "Charizard ex" -> "Charizard"
    return cardName.split(' ')[0];
  };

  const checkCardOwnership = (cardId: string): boolean => {
    const collectionsArray = Object.values(collections);
    return collectionsArray.some(collection =>
      collection.cards.some(collectionCard => collectionCard.cardId === cardId)
    );
  };

  const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      'Fire': '#FF6B6B',
      'Water': '#4ECDC4',
      'Grass': '#95E1D3',
      'Lightning': '#FFE66D',
      'Psychic': '#DDA0DD',
      'Fighting': '#D2691E',
      'Darkness': '#2F2F2F',
      'Metal': '#B0C4DE',
      'Fairy': '#FFB6C1',
      'Dragon': '#9370DB',
      'Colorless': '#D3D3D3',
    };
    return typeColors[type] || '#999';
  };

  const renderPokemonEntry = ({ item }: { item: PokemonEntry }) => {
    const completionPercentage = (item.ownedCount / item.totalCount) * 100;
    const isComplete = item.ownedCount === item.totalCount;

    if (showOnlyOwned && item.ownedCount === 0) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.pokemonEntry}
        onPress={() => {
          // Show all cards for this Pokemon
          if (item.cards.length > 0) {
            onCardPress(item.cards[0]);
          }
        }}
      >
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A']}
          style={styles.entryGradient}
        >
          <View style={styles.entryHeader}>
            <View style={styles.pokedexNumber}>
              <Text style={styles.numberText}>#{item.nationalPokedexNumber.toString().padStart(3, '0')}</Text>
            </View>
            {isComplete && (
              <Star size={16} color="#FFD700" />
            )}
          </View>

          <Text style={styles.pokemonName}>{item.name}</Text>

          <View style={styles.typesContainer}>
            {item.types.map(type => (
              <View
                key={type}
                style={[styles.typeChip, { backgroundColor: getTypeColor(type) }]}
              >
                <Text style={styles.typeText}>{type}</Text>
              </View>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${completionPercentage}%`,
                    backgroundColor: isComplete ? '#4CAF50' : '#FFD700'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.ownedCount}/{item.totalCount} cards
            </Text>
          </View>

          <Text style={styles.evolutionStage}>{item.evolutionStage}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Zap size={24} color="#FFD700" />
        <Text style={styles.title}>Pokédex</Text>
      </View>
      
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Owned Only</Text>
        <Switch
          value={showOnlyOwned}
          onValueChange={setShowOnlyOwned}
          trackColor={{ false: '#2A2A2A', true: '#FFD700' }}
          thumbColor={showOnlyOwned ? '#FFFFFF' : '#666'}
        />
      </View>
    </View>
  );

  const filteredEntries = getFilteredArticles();

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={pokemonEntries}
        renderItem={renderPokemonEntry}
        keyExtractor={(item) => item.nationalPokedexNumber.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
            <Zap size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Pokémon Found</Text>
            <Text style={styles.emptyDescription}>
              Start collecting cards to see your Pokédex progress
            </Text>
          </View>
        }
      />
    </View>
  );
};

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  contentContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  pokemonEntry: {
    width: '48%',
    marginBottom: 16,
  },
  entryGradient: {
    borderRadius: 12,
    padding: 12,
    minHeight: 160,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pokedexNumber: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  typesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  evolutionStage: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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