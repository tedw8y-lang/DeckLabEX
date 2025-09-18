+@@ .. @@
+ import { RootState, AppDispatch } from '../../src/store/store';
+ import { fetchCardById } from '../../src/store/slices/cardsSlice';
+ import { fetchMarketData } from '../../src/store/slices/marketSlice';
+ import { addCardToCollection } from '../../src/store/slices/collectionsSlice';
+ import { Card, MarketData } from '../../src/types/global';
+ import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
+-import { PriceChart } from '../../src/components/ui/PriceChart';
++import { MarketIntelligencePanel } from '../../src/components/ui/MarketIntelligencePanel';
+ import { LiveCardModel } from '../../src/components/ui/LiveCardModel';
+-import { ebayService } from '../../src/services/ebayService';
+@@ .. @@
+   const [card, setCard] = useState<Card | null>(null);
+   const [showLiveModel, setShowLiveModel] = useState(false);
+-  const [ebayListings, setEbayListings] = useState<any[]>([]);
+   const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'grading'>('overview');
+   const [showBackImage, setShowBackImage] = useState(false);
+@@ .. @@
+       
+       // Load market data
+       dispatch(fetchMarketData(id!));
+-      
+-      // Load eBay listings
+-      const listings = await ebayService.searchCardListings(cardData.name, false);
+-      setEbayListings(listings);
+@@ .. @@
+   const renderMarketData = () => {
+     const currentMarketData = marketData[id!];
+-    
+-    if (!currentMarketData) {
+-      return (
+-        <View style={styles.marketContainer}>
+-          <LoadingSpinner size="small" color="#FFD700" />
+-          <Text style={styles.loadingText}>Loading market data...</Text>
+-        </View>
+-      );
+-    }
+ 
+     return (
+-      <View style={styles.marketContainer}>
+-        <View style={styles.priceGrid}>
+-          <View style={styles.priceCard}>
+-            <Text style={styles.priceLabel}>Fair</Text>
+-            <Text style={styles.priceValue}>
+-              ${currentMarketData.prices.tcgplayer?.low?.toFixed(2) || '0.00'}
+-            </Text>
+-          </View>
+-          
+-          <View style={styles.priceCard}>
+-            <Text style={styles.priceLabel}>Good</Text>
+-            <Text style={styles.priceValue}>
+-              ${currentMarketData.prices.tcgplayer?.mid?.toFixed(2) || '0.00'}
+-            </Text>
+-          </View>
+-          
+-          <View style={styles.priceCard}>
+-            <Text style={styles.priceLabel}>Best</Text>
+-            <Text style={styles.priceValue}>
+-              ${currentMarketData.prices.tcgplayer?.high?.toFixed(2) || '0.00'}
+-            </Text>
+-          </View>
+-        </View>
+-
+-        <PriceChart
+-          data={currentMarketData.priceHistory}
+-          title="Price History (30 Days)"
+-          height={200}
+-        />
+-
+-        <View style={styles.populationContainer}>
+-          <Text style={styles.populationTitle}>Population Reports</Text>
+-          {currentMarketData.populationReports.map((report, index) => (
+-            <View key={index} style={styles.populationItem}>
+-              <Text style={styles.gradingCompany}>{report.gradingCompany}</Text>
+-              <Text style={styles.gradeText}>Grade {report.grade}</Text>
+-              <Text style={styles.populationCount}>{report.population} cards</Text>
+-            </View>
+-          ))}
+-        </View>
+-
+-        <View style={styles.ebayContainer}>
+-          <Text style={styles.ebayTitle}>Recent eBay Sales</Text>
+-          {ebayListings.slice(0, 3).map((listing, index) => (
+-            <View key={index} style={styles.ebayItem}>
+-              <Text style={styles.ebayTitle}>{listing.title}</Text>
+-              <Text style={styles.ebayPrice}>${listing.price}</Text>
+-              <Text style={styles.ebayCondition}>{listing.condition}</Text>
+-            </View>
+-          ))}
+-        </View>
+-      </View>
++      <MarketIntelligencePanel
++        card={card!}
++        marketData={currentMarketData}
++      />
+     );
+   };
+@@ .. @@
+   marketContainer: {
+     paddingHorizontal: 16,
+   },
+-  priceGrid: {
+-    flexDirection: 'row',
+-    justifyContent: 'space-between',
+-    marginBottom: 20,
+-  },
+-  priceCard: {
+-    flex: 1,
+-    backgroundColor: '#1A1A1A',
+-    borderRadius: 12,
+-    padding: 16,
+-    alignItems: 'center',
+-    marginHorizontal: 4,
+-  },
+-  priceLabel: {
+-    fontSize: 12,
+-    color: '#999',
+-    marginBottom: 4,
+-  },
+-  priceValue: {
+-    fontSize: 18,
+-    fontWeight: '700',
+-    color: '#FFD700',
+-  },
+-  populationContainer: {
+-    backgroundColor: '#1A1A1A',
+-    borderRadius: 12,
+-    padding: 16,
+-    marginVertical: 16,
+-  },
+-  populationTitle: {
+-    fontSize: 16,
+-    fontWeight: '600',
+-    color: '#FFFFFF',
+-    marginBottom: 12,
+-  },
+-  populationItem: {
+-    flexDirection: 'row',
+-    justifyContent: 'space-between',
+-    alignItems: 'center',
+-    paddingVertical: 8,
+-  },
+-  gradingCompany: {
+-    fontSize: 14,
+-    fontWeight: '600',
+-    color: '#FFD700',
+-  },
+-  gradeText: {
+-    fontSize: 14,
+-    color: '#FFFFFF',
+-  },
+-  populationCount: {
+-    fontSize: 14,
+-    color: '#999',
+-  },
+-  ebayContainer: {
+-    backgroundColor: '#1A1A1A',
+-    borderRadius: 12,
+-    padding: 16,
+-    marginVertical: 16,
+-  },
+-  ebayTitle: {
+-    fontSize: 16,
+-    fontWeight: '600',
+-    color: '#FFFFFF',
+-    marginBottom: 12,
+-  },
+-  ebayItem: {
+-    paddingVertical: 8,
+-    borderBottomWidth: 1,
+-    borderBottomColor: '#2A2A2A',
+-  },
+-  ebayPrice: {
+-    fontSize: 16,
+-    fontWeight: '700',
+-    color: '#4CAF50',
+-  },
+-  ebayCondition: {
+-    fontSize: 12,
+-    color: '#999',
+-  },
+   gradingContainer: {
+     paddingHorizontal: 16,
+     alignItems: 'center',
+@@ .. @@
+   loadingText: {
+     fontSize: 16,
+     color: '#666',
+     marginTop: 16,
+   },
+ });
+