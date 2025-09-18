import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { TrendingUp, TrendingDown, DollarSign, Bell, ChartBar as BarChart3, Eye, Star, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VictoryChart, VictoryLine, VictoryArea, VictoryTheme } from 'victory-native';

import { RootState, AppDispatch } from '../../src/store/store';
import { fetchTrendingCards, fetchUserPriceAlerts } from '../../src/store/slices/marketSlice';
import { Card, PriceAlert } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;

export default function MarketScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { trending, priceAlerts, loading } = useSelector((state: RootState) => state.market);
  
  const [activeTab, setActiveTab] = useState<'trending' | 'alerts' | 'portfolio'>('trending');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      await dispatch(fetchTrendingCards()).unwrap();
      if (user) {
        await dispatch(fetchUserPriceAlerts(user.id)).unwrap();
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  }, []);

  const renderTrendingCard = ({ item, index }: { item: Card; index: number }) => {
    const currentPrice = item.prices?.market || item.prices?.mid || 0;
    const priceChange = (Math.random() - 0.5) * 20; // Simulate price change
    const isPositive = priceChange > 0;

    return (
      <TouchableOpacity
        style={styles.trendingCard}
        onPress={() => router.push(`/card/${item.id}`)}
      >
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A']}
          style={styles.cardGradient}
        >
          <View style={styles.trendingRank}>
            <Text style={styles.rankNumber}>#{index + 1}</Text>
          </View>

          <Image
            source={{ uri: item.images.small }}
            style={styles.trendingCardImage}
            resizeMode="contain"
          />

          <View style={styles.trendingCardInfo}>
            <Text style={styles.trendingCardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.trendingCardSet} numberOfLines={1}>
              {item.set.name}
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>
                ${currentPrice.toFixed(2)}
              </Text>
              <View style={[
                styles.priceChange,
                { backgroundColor: isPositive ? '#4CAF50' : '#F44336' }
              ]}>
                {isPositive ? (
                  <TrendingUp size={12} color="#FFFFFF" />
                ) : (
                  <TrendingDown size={12} color="#FFFFFF" />
                )}
                <Text style={styles.priceChangeText}>
                  {Math.abs(priceChange).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPriceAlert = ({ item }: { item: PriceAlert }) => (
    <View style={styles.alertItem}>
      <View style={styles.alertIcon}>
        <Bell size={20} color="#FFD700" />
      </View>
      <View style={styles.alertInfo}>
        <Text style={styles.alertTitle}>Price Alert</Text>
        <Text style={styles.alertDescription}>
          {item.type === 'above' ? 'Above' : 'Below'} ${item.threshold}
        </Text>
      </View>
      <View style={styles.alertStatus}>
        <View style={[
          styles.statusDot,
          { backgroundColor: item.isActive ? '#4CAF50' : '#666' }
        ]} />
      </View>
    </View>
  );

  const renderMarketChart = () => {
    // Generate sample market data
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      x: i,
      y: 100 + Math.sin(i * 0.2) * 20 + Math.random() * 10,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Market Overview</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          width={CHART_WIDTH}
          height={200}
          padding={{ left: 50, top: 20, right: 20, bottom: 50 }}
        >
          <VictoryArea
            data={chartData}
            style={{
              data: { fill: 'rgba(255, 215, 0, 0.3)', stroke: '#FFD700', strokeWidth: 2 }
            }}
          />
        </VictoryChart>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trending':
        return (
          <FlatList
            data={trending}
            renderItem={renderTrendingCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.trendingRow}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
              />
            }
            ListHeaderComponent={renderMarketChart}
          />
        );
      
      case 'alerts':
        return (
          <FlatList
            data={priceAlerts}
            renderItem={renderPriceAlert}
            keyExtractor={(item) => item.id}
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
                <Bell size={64} color="#333" />
                <Text style={styles.emptyTitle}>No Price Alerts</Text>
                <Text style={styles.emptyDescription}>
                  Set up alerts to track price changes on your favorite cards
                </Text>
              </View>
            }
          />
        );
      
      case 'portfolio':
        return (
          <View style={styles.portfolioContainer}>
            <Text style={styles.portfolioTitle}>Portfolio Analysis</Text>
            <Text style={styles.portfolioSubtitle}>Coming in next update</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Market</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <TrendingUp size={16} color={activeTab === 'trending' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            Trending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Bell size={16} color={activeTab === 'alerts' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
          onPress={() => setActiveTab('portfolio')}
        >
          <BarChart3 size={16} color={activeTab === 'portfolio' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>
            Portfolio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && trending.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabContent()}
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
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
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
  contentContainer: {
    padding: 16,
  },
  trendingRow: {
    justifyContent: 'space-between',
  },
  trendingCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  cardGradient: {
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  trendingRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  trendingCardImage: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 8,
    marginBottom: 8,
  },
  trendingCardInfo: {
    alignItems: 'center',
  },
  trendingCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  trendingCardSet: {
    fontSize: 11,
    color: '#CCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceChangeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
  },
  chartContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#CCC',
  },
  alertStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  portfolioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  portfolioTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  portfolioSubtitle: {
    fontSize: 16,
    color: '#666',
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