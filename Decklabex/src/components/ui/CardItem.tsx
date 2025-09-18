import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, TrendingUp } from 'lucide-react-native';
import { Card } from '../../types/global';

interface CardItemProps {
  card: Card;
  onPress: (card: Card) => void;
  viewMode?: 'grid' | 'list';
  showPrice?: boolean;
  showSet?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  onPress,
  viewMode = 'grid',
  showPrice = true,
  showSet = true,
}) => {
  const price = card.prices?.market || card.prices?.mid || card.prices?.low || 0;
  const isExpensive = price > 100;

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={styles.listContainer}
        onPress={() => onPress(card)}
      >
        <Image
          source={{ uri: card.images.small }}
          style={styles.listImage}
          resizeMode="contain"
        />
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>
            {card.name}
          </Text>
          {showSet && (
            <Text style={styles.listSet} numberOfLines={1}>
              {card.set.name} • {card.rarity}
            </Text>
          )}
          {showPrice && (
            <View style={styles.listPriceContainer}>
              <Text style={styles.listPrice}>
                ${price.toFixed(2)}
              </Text>
              {isExpensive && (
                <Star size={12} color="#FFD700" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={() => onPress(card)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: card.images.large }}
          style={styles.gridImage}
          resizeMode="contain"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <Text style={styles.gridName} numberOfLines={2}>
            {card.name}
          </Text>
          {showSet && (
            <Text style={styles.gridSet} numberOfLines={1}>
              {card.set.name}
            </Text>
          )}
          {showPrice && (
            <View style={styles.gridPriceContainer}>
              <Text style={styles.gridPrice}>
                ${price.toFixed(2)}
              </Text>
              {isExpensive && (
                <Star size={12} color="#FFD700" />
              )}
            </View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 0.7,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  gridName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridSet: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 4,
  },
  gridPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridPrice: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  listContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  listImage: {
    width: 60,
    aspectRatio: 0.7,
    borderRadius: 6,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listSet: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 4,
  },
  listPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listPrice: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 4,
  },
});