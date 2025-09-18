import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  ExternalLink,
  Plus,
  Heart,
  Share,
  Eye,
  Maximize
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState, AppDispatch } from '../../src/store/store';
import { fetchCardById } from '../../src/store/slices/cardsSlice';
import { fetchMarketData } from '../../src/store/slices/marketSlice';
import { addCardToCollection } from '../../src/store/slices/collectionsSlice';
import { Card, MarketData } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { PriceChart } from '../../src/components/ui/PriceChart';
import { LiveCardModel } from '../../src/components/ui/LiveCardModel';
import { ebayService } from '../../src/services/ebayService';

const { width } = Dimensions.get('window');

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { cards, loading } = useSelector((state: RootState) => state.cards);
  const { marketData } = useSelector((state: RootState) => state.market);
  const { collections } = useSelector((state: RootState) => state.collections);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [card, setCard] = useState<Card | null>(null);
  const [showLiveModel, setShowLiveModel] = useState(false);
  const [ebayListings, setEbayListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'grading'>('overview');
  const [showBackImage, setShowBackImage] = useState(false);

  useEffect(() => {
    if (id) {
      loadCardData();
    }
  }, [id]);

  const loadCardData = async () => {
    try {
      // Get card from store or fetch if not available
      let cardData = cards[id!];
      
      if (!cardData) {
        cardData = await dispatch(fetchCardById(id!)).unwrap();
      }
      
      setCard(cardData);
      
      // Load market data
      dispatch(fetchMarketData(id!));
      
      // Load eBay listings
      const listings = await ebayService.searchCardListings(cardData.name, false);
      setEbayListings(listings);
      
    } catch (error) {
      console.error('Failed to load card data:', error);
      Alert.alert('Error', 'Failed to load card information');
    }
  };

  const handleAddToCollection = () => {
    if (!card || !user) {
      Alert.alert('Error', 'Please log in to add cards to your collection');
      return;
    }

    const collectionsArray = Object.values(collections);
    
    if (collectionsArray.length === 0) {
      Alert.alert('No Collections', 'Please create a collection first');
      return;
    }

    // For now, add to first collection
    const firstCollection = collectionsArray[0];
    
    dispatch(addCardToCollection({
      collectionId: firstCollection.id,
      card: {
        cardId: card.id,
        card: card,
        quantity: 1,
        condition: 'Near Mint (NM)',
        language: 'English',
        isHolo: card.rarity?.includes('Holo') || false,
        isFirstEdition: false,
        isGraded: false,
        addedAt: new Date().toISOString(),
      }
    }));

    Alert.alert('Success', `Added ${card.name} to ${firstCollection.name}`);
  };

  const renderCardImage = () => (
    <View style={styles.imageContainer}>
      <TouchableOpacity
        style={styles.cardImageWrapper}
        onPress={() => setShowLiveModel(true)}
      >
        <Image
          source={{ uri: showBackImage ? card?.images.large : card?.images.large }}
          style={styles.cardImage}
          resizeMode="contain"
        />
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setShowBackImage(!showBackImage)}
          >
            <Text style={styles.flipText}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.expandButton}>
            <Maximize size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCardInfo = () => (
    <View style={styles.cardInfo}>
      <Text style={styles.cardName}>{card?.name}</Text>
      <Text style={styles.setName}>{card?.set.name} • {card?.setNumber}</Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rarity</Text>
          <Text style={styles.detailValue}>{card?.rarity}</Text>
        </View>
        
        {card?.type && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{card.type}</Text>
          </View>
        )}
        
        {card?.hp && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>HP</Text>
            <Text style={styles.detailValue}>{card.hp}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Artist</Text>
          <Text style={styles.detailValue}>{card?.artist}</Text>
        </View>
      </View>
    </View>
  );

  const renderMarketData = () => {
    const currentMarketData = marketData[id!];
    
    if (!currentMarketData) {
      return (
        <View style={styles.marketContainer}>
          <LoadingSpinner size="small" color="#FFD700" />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      );
    }

    return (
      <View style={styles.marketContainer}>
        <View style={styles.priceGrid}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Fair</Text>
            <Text style={styles.priceValue}>
              ${currentMarketData.prices.tcgplayer?.low?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Good</Text>
            <Text style={styles.priceValue}>
              ${currentMarketData.prices.tcgplayer?.mid?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Best</Text>
            <Text style={styles.priceValue}>
              ${currentMarketData.prices.tcgplayer?.high?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <PriceChart
          data={currentMarketData.priceHistory}
          title="Price History (30 Days)"
          height={200}
        />

        <View style={styles.populationContainer}>
          <Text style={styles.populationTitle}>Population Reports</Text>
          {currentMarketData.populationReports.map((report, index) => (
            <View key={index} style={styles.populationItem}>
              <Text style={styles.gradingCompany}>{report.gradingCompany}</Text>
              <Text style={styles.gradeText}>Grade {report.grade}</Text>
              <Text style={styles.populationCount}>{report.population} cards</Text>
            </View>
          ))}
        </View>

        <View style={styles.ebayContainer}>
          <Text style={styles.ebayTitle}>Recent eBay Sales</Text>
          {ebayListings.slice(0, 3).map((listing, index) => (
            <View key={index} style={styles.ebayItem}>
              <Text style={styles.ebayTitle}>{listing.title}</Text>
              <Text style={styles.ebayPrice}>${listing.price}</Text>
              <Text style={styles.ebayCondition}>{listing.condition}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderCardInfo();
      case 'market':
        return renderMarketData();
      case 'grading':
        return (
          <View style={styles.gradingContainer}>
            <Text style={styles.gradingTitle}>Grading Analysis</Text>
            <Text style={styles.gradingDescription}>
              Scan this card to get professional grading predictions
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading || !card) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading card details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCardImage()}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Eye size={16} color={activeTab === 'overview' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'market' && styles.activeTab]}
            onPress={() => setActiveTab('market')}
          >
            <TrendingUp size={16} color={activeTab === 'market' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'market' && styles.activeTabText]}>
              Market
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'grading' && styles.activeTab]}
            onPress={() => setActiveTab('grading')}
          >
            <Star size={16} color={activeTab === 'grading' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'grading' && styles.activeTabText]}>
              Grading
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCollection}
        >
          <Plus size={20} color="#0A0A0A" />
          <Text style={styles.addButtonText}>Add to Collection</Text>
        </TouchableOpacity>
      </View>

      {showLiveModel && (
        <LiveCardModel
          card={card}
          visible={showLiveModel}
          onClose={() => setShowLiveModel(false)}
        />
      )}
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
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardImageWrapper: {
    position: 'relative',
  },
  cardImage: {
    width: width * 0.7,
    aspectRatio: 0.7,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  flipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expandButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFD700',
  },
  cardInfo: {
    paddingHorizontal: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  setName: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardDetails: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  marketContainer: {
    paddingHorizontal: 16,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  populationContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  populationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  populationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  gradingCompany: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  gradeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  populationCount: {
    fontSize: 14,
    color: '#999',
  },
  ebayContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  ebayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ebayItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  ebayPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  ebayCondition: {
    fontSize: 12,
    color: '#999',
  },
  gradingContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 40,
  },
  gradingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  gradingDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
    marginLeft: 8,
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