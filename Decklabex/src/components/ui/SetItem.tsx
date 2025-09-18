import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Package } from 'lucide-react-native';
import { CardSet } from '../../types/global';

interface SetItemProps {
  set: CardSet;
  onPress: (set: CardSet) => void;
  showProgress?: boolean;
  ownedCards?: number;
}

export const SetItem: React.FC<SetItemProps> = ({
  set,
  onPress,
  showProgress = false,
  ownedCards = 0,
}) => {
  const completionPercentage = showProgress ? (ownedCards / set.total) * 100 : 0;
  const releaseDate = new Date(set.releaseDate).toLocaleDateString();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(set)}
    >
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A']}
        style={styles.gradient}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: set.images.logo }}
            style={styles.setImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.info}>
          <Text style={styles.setName} numberOfLines={2}>
            {set.name}
          </Text>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Package size={12} color="#666" />
              <Text style={styles.detailText}>{set.total} cards</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Calendar size={12} color="#666" />
              <Text style={styles.detailText}>{releaseDate}</Text>
            </View>
          </View>

          <Text style={styles.series} numberOfLines={1}>
            {set.series}
          </Text>

          {showProgress && (
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
                {ownedCards}/{set.total} ({completionPercentage.toFixed(0)}%)
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  gradient: {
    borderRadius: 12,
    padding: 12,
    minHeight: 180,
  },
  imageContainer: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  setImage: {
    width: '80%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  setName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  details: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#999',
    fontSize: 11,
    marginLeft: 4,
  },
  series: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 'auto',
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
    backgroundColor: '#FFD700',
  },
  progressText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});