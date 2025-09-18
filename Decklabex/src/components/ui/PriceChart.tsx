import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { PriceHistoryPoint } from '../../types/global';

interface PriceChartProps {
  data: PriceHistoryPoint[];
  title?: string;
  height?: number;
  showArea?: boolean;
  color?: string;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  title = 'Price History',
  height = 200,
  showArea = true,
  color = '#FFD700',
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No price data available</Text>
        </View>
      </View>
    );
  }

  // Transform data for Victory charts
  const chartData = data.map((point, index) => ({
    x: index,
    y: point.price,
    date: point.date,
  }));

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  return (
    <View style={[styles.container, { height: height + 60 }]}>
      <View style={styles.header}>
        <TrendingUp size={24} color={color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.chartPlaceholder}>
        <Text style={styles.comingSoon}>Interactive Charts Coming Soon!</Text>
        <Text style={styles.placeholderText}>📊</Text>
        <Text style={styles.description}>
          Victory Native charts will be available once the Skia dependency is properly configured
        </Text>
      </View>

      <View style={styles.priceInfo}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Current</Text>
          <Text style={styles.priceValue}>
            ${data[data.length - 1]?.price.toFixed(2) || '0.00'}
          </Text>
        </View>
        
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>High</Text>
          <Text style={styles.priceValue}>${maxPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Low</Text>
          <Text style={styles.priceValue}>${minPrice.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    maxWidth: 250,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
});