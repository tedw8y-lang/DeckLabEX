// 🎴 DeckLab TCG - Enhanced Card Component with Liquid Glass Effects & AI Theming
import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Star, TrendingUp, Sparkles, Eye } from 'lucide-react-native';
import { Card } from '../../types/global';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from './GlassCard';
import { shadows } from '../../theme/shadows';

interface EnhancedCardItemProps {
  card: Card;
  onPress: (card: Card) => void;
  viewMode?: 'grid' | 'list' | 'showcase';
  showPrice?: boolean;
  showSet?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 0.7;

export const EnhancedCardItem: React.FC<EnhancedCardItemProps> = ({
  card,
  onPress,
  viewMode = 'grid',
  showPrice = true,
  showSet = true,
  showStats = true,
  compact = false,
}) => {
  const { isDark, colors, dynamicTheme, setActiveCard, hapticFeedback } = useTheme();

  // Animation values
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Card data calculations
  const price = useMemo(() => {
    return card.prices?.market || card.prices?.mid || card.prices?.low || 0;
  }, [card.prices]);

  const isExpensive = price > 100;
  const isRare = card.rarity?.toLowerCase().includes('rare') || 
                 card.rarity?.toLowerCase().includes('ultra') ||
                 card.rarity?.toLowerCase().includes('secret');

  const cardTheme = useMemo(() => {
    // Generate theme based on card type
    const type = card.type?.toLowerCase() || 'colorless';
    return colors.pokemon[type as keyof typeof colors.pokemon] || colors.pokemon.colorless;
  }, [card.type, colors.pokemon]);

  // Gesture handling
  const gesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      hapticFeedback('light');
    })
    .onUpdate((event) => {
      if (viewMode === 'showcase') {
        rotateY.value = interpolate(
          event.translationX,
          [-100, 0, 100],
          [-15, 0, 15]
        );
      }
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      rotateY.value = withSpring(0, { damping: 20 });
      setActiveCard(card);
      onPress(card);
    });

  const hoverGesture = Gesture.Hover()
    .onBegin(() => {
      glowOpacity.value = withTiming(0.4, { duration: 200 });
      if (viewMode !== 'list') {
        scale.value = withSpring(1.05, { damping: 15, stiffness: 300 });
      }
    })
    .onFinalize(() => {
      glowOpacity.value = withTiming(0, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });

  const composedGesture = Gesture.Race(gesture, hoverGesture);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const perspective = viewMode === 'showcase' ? 1000 : 0;
    
    return {
      transform: [
        { perspective },
        { scale: scale.value },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const backgroundColors = isDark ? colors.background : colors.backgroundLight;
  const textColors = isDark ? colors.text : colors.textLight;

  // Render list view
  if (viewMode === 'list') {
    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[animatedStyle]}>
          <GlassCard 
            style={[styles.listContainer, compact ? styles.listCompact : {}]}
            interactive={true}
            glowColor={cardTheme}
            variant="flat"
          >
            <View style={styles.listContent}>
              {/* Card Image */}
              <View style={[styles.listImageContainer, { borderColor: cardTheme + '40' }]}>
                <Image
                  source={{ uri: card.images.small }}
                  style={styles.listImage}
                  resizeMode="cover"
                />
                {isRare && (
                  <View style={[styles.rarityBadge, { backgroundColor: cardTheme }]}>
                    <Sparkles size={10} color="white" />
                  </View>
                )}
              </View>

              {/* Card Info */}
              <View style={styles.listInfo}>
                <Text style={[styles.listName, { color: textColors.primary }]} numberOfLines={1}>
                  {card.name}
                </Text>
                
                {showSet && (
                  <Text style={[styles.listSet, { color: textColors.tertiary }]} numberOfLines={1}>
                    {card.set.name} • #{card.setNumber}
                  </Text>
                )}

                <View style={styles.listMetaContainer}>
                  {/* Type chip */}
                  <View style={[styles.typeChip, { backgroundColor: cardTheme + '20' }]}>
                    <Text style={[styles.typeChipText, { color: cardTheme }]}>
                      {card.type}
                    </Text>
                  </View>

                  {/* Price */}
                  {showPrice && (
                    <View style={styles.listPriceContainer}>
                      <Text style={[styles.listPrice, { color: dynamicTheme.primary }]}>
                        ${price.toFixed(2)}
                      </Text>
                      {isExpensive && (
                        <Star size={12} color={dynamicTheme.primary} fill={dynamicTheme.primary} />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </GestureDetector>
    );
  }

  // Render grid/showcase view
  const cardWidth = viewMode === 'showcase' ? screenWidth * 0.6 : (screenWidth - 48) / 2 - 8;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.gridContainer, animatedStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.cardGlow, glowStyle, { width: cardWidth + 8, height: cardHeight + 8 }]}>
          <LinearGradient
            colors={[cardTheme + '40', 'transparent'] as const}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <GlassCard
          style={[styles.gridCard, { width: cardWidth, height: cardHeight }] as any}
          variant={viewMode === 'showcase' ? 'floating' : 'default'}
          interactive={true}
          glowColor={cardTheme}
        >
          {/* Card Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: card.images.large }}
              style={[styles.gridImage, { width: cardWidth - 32, height: cardHeight - 32 }]}
              resizeMode="contain"
            />
            
            {/* Holographic overlay for special cards */}
            {isRare && (
              <LinearGradient
                colors={[
                  'transparent',
                  cardTheme + '10',
                  'transparent',
                  cardTheme + '15',
                  'transparent'
                ] as const}
                style={[StyleSheet.absoluteFill, styles.holoOverlay]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}

            {/* Card Info Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)'] as const}
              style={styles.infoOverlay}
            >
              <View style={styles.cardInfo}>
                <Text style={[styles.gridName, { color: textColors.primary }]} numberOfLines={2}>
                  {card.name}
                </Text>
                
                {showSet && (
                  <Text style={[styles.gridSet, { color: textColors.secondary }]} numberOfLines={1}>
                    {card.set.name}
                  </Text>
                )}

                <View style={styles.gridMetaContainer}>
                  {/* Type badge */}
                  <View style={[styles.typeBadge, { backgroundColor: cardTheme }]}>
                    <Text style={styles.typeBadgeText}>{card.type}</Text>
                  </View>

                  {/* Price */}
                  {showPrice && (
                    <View style={styles.gridPriceContainer}>
                      <Text style={[styles.gridPrice, { color: dynamicTheme.primary }]}>
                        ${price.toFixed(2)}
                      </Text>
                      {isExpensive && (
                        <Star size={10} color={dynamicTheme.primary} fill={dynamicTheme.primary} />
                      )}
                    </View>
                  )}
                </View>

                {/* Stats row */}
                {showStats && (card.hp || card.attacks?.length) && (
                  <View style={styles.statsContainer}>
                    {card.hp && (
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: textColors.quaternary }]}>HP</Text>
                        <Text style={[styles.statValue, { color: textColors.secondary }]}>{card.hp}</Text>
                      </View>
                    )}
                    {card.attacks?.length && (
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: textColors.quaternary }]}>ATK</Text>
                        <Text style={[styles.statValue, { color: textColors.secondary }]}>{card.attacks.length}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Rarity indicator */}
            {isRare && (
              <View style={[styles.rarityIndicator, { backgroundColor: cardTheme }]}>
                <Sparkles size={14} color="white" />
              </View>
            )}
          </View>
        </GlassCard>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    marginHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardGlow: {
    position: 'absolute',
    borderRadius: 24,
    top: -4,
    left: -4,
  },
  gridCard: {
    backgroundColor: 'transparent',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridImage: {
    borderRadius: 12,
  },
  holoOverlay: {
    borderRadius: 12,
    opacity: 0.3,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  cardInfo: {
    gap: 4,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  gridSet: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  gridMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  gridPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  rarityIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  rarityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // List styles
  listContainer: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  listCompact: {
    marginBottom: 8,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listImageContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  listImage: {
    width: 48,
    height: 48 / CARD_ASPECT_RATIO,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  listSet: {
    fontSize: 13,
    fontWeight: '500',
  },
  listMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
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
  },
});