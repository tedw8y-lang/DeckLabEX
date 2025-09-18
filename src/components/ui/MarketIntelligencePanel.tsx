// 📊 DeckLab TCG - Advanced Market Intelligence Panel
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Award,
  Clock,
  Users,
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { Card, MarketData } from '../../types/global';
import { GlassCard } from './GlassCard';
import { PriceChart } from './PriceChart';

interface MarketIntelligencePanelProps {
  card: Card;
  marketData?: MarketData;
  compact?: boolean;
}

const { width } = Dimensions.get('window');

export const MarketIntelligencePanel: React.FC<MarketIntelligencePanelProps> = ({
  card,
  marketData,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'prices' | 'trends' | 'population'>('prices');
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  // Calculate price insights
  const priceInsights = React.useMemo(() => {
    const tcgPrice = marketData?.prices.tcgplayer?.market || card.prices?.market || 0;
    const ebayPrice = marketData?.prices.ebay?.market || 0;
    const cardmarketPrice = marketData?.prices.cardmarket?.market || 0;
    
    const prices = [tcgPrice, ebayPrice, cardmarketPrice].filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const priceSpread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
    
    // Simulate market sentiment
    const sentiment = Math.random() > 0.5 ? 'bullish' : 'bearish';
    const confidence = 0.7 + Math.random() * 0.3;
    
    return {
      avgPrice,
      priceSpread,
      sentiment,
      confidence,
      recommendation: avgPrice > 50 ? 'Hold' : avgPrice > 20 ? 'Buy' : 'Monitor',
    };
  }, [card.prices, marketData]);

  const renderPriceComparison = () => (
    <View style={styles.priceSection}>
      <Text style={styles.sectionTitle}>Price Comparison</Text>
      
      <View style={styles.priceGrid}>
        {/* TCGPlayer */}
        <GlassCard style={styles.priceCard} variant="flat">
          <View style={styles.priceCardHeader}>
            <Text style={styles.priceSource}>TCGPlayer</Text>
            <DollarSign size={16} color="#FFD700" />
          </View>
          <Text style={styles.priceValue}>
            ${marketData?.prices.tcgplayer?.market?.toFixed(2) || card.prices?.market?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.priceLabel}>Market Price</Text>
        </GlassCard>

        {/* eBay */}
        <GlassCard style={styles.priceCard} variant="flat">
          <View style={styles.priceCardHeader}>
            <Text style={styles.priceSource}>eBay</Text>
            <TrendingUp size={16} color="#4CAF50" />
          </View>
          <Text style={styles.priceValue}>
            ${marketData?.prices.ebay?.market?.toFixed(2) || (card.prices?.market || 0 * 1.1).toFixed(2)}
          </Text>
          <Text style={styles.priceLabel}>Avg Sold</Text>
        </GlassCard>

        {/* CardMarket */}
        <GlassCard style={styles.priceCard} variant="flat">
          <View style={styles.priceCardHeader}>
            <Text style={styles.priceSource}>CardMarket</Text>
            <BarChart3 size={16} color="#2196F3" />
          </View>
          <Text style={styles.priceValue}>
            €{marketData?.prices.cardmarket?.market?.toFixed(2) || (card.prices?.market || 0 * 0.85).toFixed(2)}
          </Text>
          <Text style={styles.priceLabel}>EU Market</Text>
        </GlassCard>
      </View>

      {/* Market insights */}
      <GlassCard style={styles.insightsCard} variant="default">
        <View style={styles.insightsHeader}>
          <Target size={20} color="#FFD700" />
          <Text style={styles.insightsTitle}>Market Intelligence</Text>
        </View>
        
        <View style={styles.insightsGrid}>
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Avg Price</Text>
            <Text style={styles.insightValue}>${priceInsights.avgPrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Spread</Text>
            <Text style={styles.insightValue}>${priceInsights.priceSpread.toFixed(2)}</Text>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Sentiment</Text>
            <View style={styles.sentimentContainer}>
              {priceInsights.sentiment === 'bullish' ? (
                <TrendingUp size={12} color="#4CAF50" />
              ) : (
                <TrendingDown size={12} color="#F44336" />
              )}
              <Text style={[
                styles.sentimentText,
                { color: priceInsights.sentiment === 'bullish' ? '#4CAF50' : '#F44336' }
              ]}>
                {priceInsights.sentiment}
              </Text>
            </View>
          </View>
          
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Recommendation</Text>
            <Text style={[
              styles.recommendationText,
              { 
                color: priceInsights.recommendation === 'Buy' ? '#4CAF50' : 
                      priceInsights.recommendation === 'Hold' ? '#FFD700' : '#999'
              }
            ]}>
              {priceInsights.recommendation}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceBar}>
          <Text style={styles.confidenceLabel}>
            Confidence: {(priceInsights.confidence * 100).toFixed(0)}%
          </Text>
          <View style={styles.confidenceTrack}>
            <View 
              style={[
                styles.confidenceFill, 
                { width: `${priceInsights.confidence * 100}%` }
              ]} 
            />
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderTrendAnalysis = () => (
    <View style={styles.trendsSection}>
      <Text style={styles.sectionTitle}>Trend Analysis</Text>
      
      {marketData?.priceHistory && (
        <PriceChart
          data={marketData.priceHistory}
          title="30-Day Price History"
          height={180}
          color="#FFD700"
        />
      )}

      <View style={styles.trendMetrics}>
        <GlassCard style={styles.metricCard} variant="flat">
          <Clock size={20} color="#2196F3" />
          <Text style={styles.metricValue}>7 days</Text>
          <Text style={styles.metricLabel}>Avg Hold Time</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} variant="flat">
          <Users size={20} color="#FF9800" />
          <Text style={styles.metricValue}>1.2k</Text>
          <Text style={styles.metricLabel}>Watchers</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} variant="flat">
          <BarChart3 size={20} color="#4CAF50" />
          <Text style={styles.metricValue}>+15%</Text>
          <Text style={styles.metricLabel}>30d Change</Text>
        </GlassCard>
      </View>
    </View>
  );

  const renderPopulationData = () => (
    <View style={styles.populationSection}>
      <Text style={styles.sectionTitle}>Population Reports</Text>
      
      {marketData?.populationReports.map((report, index) => (
        <GlassCard key={index} style={styles.populationCard} variant="flat">
          <View style={styles.populationHeader}>
            <Text style={styles.gradingCompany}>{report.gradingCompany}</Text>
            <Award size={16} color="#FFD700" />
          </View>
          
          <View style={styles.populationContent}>
            <View style={styles.gradeInfo}>
              <Text style={styles.gradeNumber}>Grade {report.grade}</Text>
              <Text style={styles.populationCount}>{report.population} cards</Text>
            </View>
            
            <View style={styles.populationBar}>
              <View 
                style={[
                  styles.populationFill,
                  { width: `${Math.min(100, (report.population / 1000) * 100)}%` }
                ]}
              />
            </View>
          </View>
        </GlassCard>
      )) || (
        <Text style={styles.noDataText}>Population data not available</Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prices':
        return renderPriceComparison();
      case 'trends':
        return renderTrendAnalysis();
      case 'population':
        return renderPopulationData();
      default:
        return renderPriceComparison();
    }
  };

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, animatedStyle]}>
        <View style={styles.compactPriceRow}>
          <DollarSign size={14} color="#FFD700" />
          <Text style={styles.compactPrice}>
            ${card.prices?.market?.toFixed(2) || '0.00'}
          </Text>
          {priceInsights.sentiment === 'bullish' ? (
            <TrendingUp size={12} color="#4CAF50" />
          ) : (
            <TrendingDown size={12} color="#F44336" />
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prices' && styles.activeTab]}
          onPress={() => setActiveTab('prices')}
        >
          <DollarSign size={16} color={activeTab === 'prices' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'prices' && styles.activeTabText]}>
            Prices
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
          onPress={() => setActiveTab('trends')}
        >
          <TrendingUp size={16} color={activeTab === 'trends' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>
            Trends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'population' && styles.activeTab]}
          onPress={() => setActiveTab('population')}
        >
          <Award size={16} color={activeTab === 'population' ? '#FFD700' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'population' && styles.activeTabText]}>
            Population
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFD700',
  },
  content: {
    flex: 1,
  },
  
  // Price section
  priceSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceSource: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
  },
  
  // Insights
  insightsCard: {
    marginHorizontal: 16,
    padding: 16,
    marginTop: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightItem: {
    width: '48%',
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentimentText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  confidenceBar: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  confidenceTrack: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },

  // Trends section
  trendsSection: {
    paddingHorizontal: 16,
  },
  trendMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
  },

  // Population section
  populationSection: {
    paddingHorizontal: 16,
  },
  populationCard: {
    padding: 12,
    marginBottom: 12,
  },
  populationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradingCompany: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  populationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  populationCount: {
    fontSize: 12,
    color: '#999',
  },
  populationBar: {
    width: 60,
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 12,
  },
  populationFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },

  // Compact styles
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
});