// 🎴 DeckLab TCG - Optimized Card Component with Market Intelligence
import React, { memo, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  Sparkles,
  Award
} from 'lucide-react-native';
import { Card } from '../../types/global';
import { GlassCard } from './GlassCard';

interface OptimizedCardItemProps {
  card: Card;
  onPress: (card: Card) => void;
  viewMode?: 'grid' | 'list' | 'compact';
  showPrice?: boolean;
  showSet?: boolean;
  showMarketData?: boolean;
  index?: number;
}

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2;
const CARD_ASPECT_RATIO = 0.7;

const OptimizedCardItemComponent: React.FC<OptimizedCardItemProps> = ({
  card,
  onPress,
  viewMode = 'grid',
  showPrice = true,
  showSet = true,
  showMarketData = true,
  index = 0,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Memoized calculations
  const cardData = useMemo(() => {
    const price = card.prices?.market || card.prices?.mid || card.prices?.low || 0;
    const isExpensive = price > 100;
    const isRare = card.rarity?.toLowerCase().includes('rare') || 
                   card.rarity?.toLowerCase().includes('ultra') ||
                   card.rarity?.toLowerCase().includes('secret');
    
    // Simulate price change for market intelligence
    const priceChange = (Math.random() - 0.5) * 20;
    const isPositiveTrend = priceChange > 0;

    return {
      price,
      isExpensive,
      isRare,
      priceChange,
      isPositiveTrend,
      formattedPrice: price > 0 ? `$${price.toFixed(2)}` : 'N/A',
    };
  }, [card.prices, card.rarity]);

  // Gesture handling with haptic feedback
  const gesture = Gesture.Tap()
    .onTouchesDown(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      if (Platform.OS === 'ios') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onTouchesUp(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      runOnJS(onPress)(card);
    });

  const hoverGesture = Gesture.Hover()
    .onBegin(() => {
      if (viewMode !== 'compact') {
        scale.value = withSpring(1.05, { damping: 15, stiffness: 300 });
        glowOpacity.value = withTiming(0.4, { duration: 200 });
      }
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    });

  const composedGesture = Gesture.Race(gesture, hoverGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Render compact list view
  if (viewMode === 'compact') {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.compactContainer, animatedStyle]}>
          <GlassCard style={styles.compactCard} variant="flat">
            <View style={styles.compactContent}>
              <Image
                source={{ uri: card.images.small }}
                style={styles.compactImage}
                resizeMode="cover"
              />
              
              <View style={styles.compactInfo}>
                <Text style={styles.compactName} numberOfLines={1}>
                  {card.name}
                </Text>
                <Text style={styles.compactSet} numberOfLines={1}>
                  {card.set.name}
                </Text>
                {showPrice && (
                  <Text style={styles.compactPrice}>
                    {cardData.formattedPrice}
                  </Text>
                )}
              </View>

              {cardData.isRare && (
                <View style={styles.compactRarityBadge}>
                  <Sparkles size={12} color="#FFD700" />
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    );
  }

  // Render list view
  if (viewMode === 'list') {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.listContainer, animatedStyle]}>
          <GlassCard style={styles.listCard} variant="default">
            <View style={styles.listContent}>
              <View style={styles.listImageContainer}>
                <Image
                  source={{ uri: card.images.small }}
                  style={styles.listImage}
                  resizeMode="cover"
                />
                {cardData.isRare && (
                  <View style={styles.rarityIndicator}>
                    <Sparkles size={10} color="#FFD700" />
                  </View>
                )}
              </View>

              <View style={styles.listInfo}>
                <Text style={styles.listName} numberOfLines={1}>
                  {card.name}
                </Text>
                
                {showSet && (
                  <Text style={styles.listSet} numberOfLines={1}>
                    {card.set.name} • #{card.setNumber}
                  </Text>
                )}

                <View style={styles.listMetaContainer}>
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>{card.type}</Text>
                  </View>

                  {showPrice && (
                    <View style={styles.listPriceContainer}>
                      <Text style={styles.listPrice}>
                        {cardData.formattedPrice}
                      </Text>
                      {cardData.isExpensive && (
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                      )}
                    </View>
                  )}
                </View>

                {showMarketData && (
                  <View style={styles.marketIndicator}>
                    {cardData.isPositiveTrend ? (
                      <TrendingUp size={12} color="#4CAF50" />
                    ) : (
                      <TrendingDown size={12} color="#F44336" />
                    )}
                    <Text style={[
                      styles.trendText,
                      { color: cardData.isPositiveTrend ? '#4CAF50' : '#F44336' }
                    ]}>
                      {Math.abs(cardData.priceChange).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    );
  }

  // Render grid view (default)
  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.gridContainer, animatedStyle]}>
        {/* Glow effect for expensive/rare cards */}
        {(cardData.isExpensive || cardData.isRare) && (
          <Animated.View style={[styles.cardGlow, glowStyle]}>
            <LinearGradient
              colors={[
                cardData.isRare ? 'rgba(255, 215, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)',
                'transparent'
              ]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        <GlassCard style={styles.gridCard} variant="default">
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: card.images.large }}
              style={styles.gridImage}
              resizeMode="contain"
            />
            
            {/* Market data overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.infoOverlay}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.gridName} numberOfLines={2}>
                  {card.name}
                </Text>
                
                {showSet && (
                  <Text style={styles.gridSet} numberOfLines={1}>
                    {card.set.name}
                  </Text>
                )}

                <View style={styles.gridMetaContainer}>
                  {/* Essential pricing display */}
                  {showPrice && cardData.price > 0 && (
                    <View style={styles.priceContainer}>
                      <DollarSign size={12} color="#FFD700" />
                      <Text style={styles.gridPrice}>
                        {cardData.formattedPrice}
                      </Text>
                      {cardData.isExpensive && (
                        <Star size={10} color="#FFD700" fill="#FFD700" />
                      )}
                    </View>
                  )}

                  {/* Market trend indicator */}
                  {showMarketData && (
                    <View style={styles.trendContainer}>
                      {cardData.isPositiveTrend ? (
                        <TrendingUp size={10} color="#4CAF50" />
                      ) : (
                        <TrendingDown size={10} color="#F44336" />
                      )}
                    </View>
                  )}
                </View>

                {/* Rarity and type badges */}
                <View style={styles.badgeContainer}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{card.type}</Text>
                  </View>
                  
                  {cardData.isRare && (
                    <View style={styles.rarityBadge}>
                      <Award size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>

            {/* Top-right indicators */}
            <View style={styles.topIndicators}>
              {cardData.isExpensive && (
                <View style={styles.expensiveBadge}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </GestureDetector>
  );
};

export const OptimizedCardItem = memo(OptimizedCardItemComponent);

const styles = StyleSheet.create({
  // Grid styles
  gridContainer: {
    width: GRID_ITEM_WIDTH,
    marginBottom: 16,
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
  },
  gridCard: {
    backgroundColor: 'transparent',
    height: GRID_ITEM_WIDTH / CARD_ASPECT_RATIO,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardInfo: {
    gap: 4,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  gridSet: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CCCCCC',
    opacity: 0.9,
  },
  gridMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  gridPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  trendContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  rarityBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    padding: 3,
    borderRadius: 6,
  },
  topIndicators: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  expensiveBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    padding: 4,
    borderRadius: 8,
  },

  // List styles
  listContainer: {
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: 'transparent',
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  listImage: {
    width: 56,
    height: 56 / CARD_ASPECT_RATIO,
  },
  rarityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 2,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  listSet: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  listMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  typeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  listPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD700',
  },
  marketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Compact styles
  compactContainer: {
    marginBottom: 8,
  },
  compactCard: {
    backgroundColor: 'transparent',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  compactImage: {
    width: 40,
    height: 40 / CARD_ASPECT_RATIO,
    borderRadius: 6,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactSet: {
    fontSize: 11,
    color: '#999',
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  compactRarityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 2,
  },
});