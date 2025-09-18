import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Clock, TrendingUp, Users, Trophy, Zap } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchNews } from '../../store/slices/newsSlice';
import { NewsItem, NewsCategory } from '../../types/global';
import { LoadingSpinner } from './LoadingSpinner';

export const NewsTab: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { articles, loading } = useSelector((state: RootState) => state.news);
  
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      await dispatch(fetchNews()).unwrap();
    } catch (error) {
      console.error('Failed to load news:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const handleArticlePress = async (article: NewsItem) => {
    try {
      await Linking.openURL(article.url);
    } catch (error) {
      console.error('Failed to open article:', error);
    }
  };

  const getCategoryIcon = (category: NewsCategory) => {
    switch (category) {
      case 'releases': return <Zap size={16} color="#FFD700" />;
      case 'tournaments': return <Trophy size={16} color="#FFD700" />;
      case 'market': return <TrendingUp size={16} color="#FFD700" />;
      case 'community': return <Users size={16} color="#FFD700" />;
      case 'rules': return <ExternalLink size={16} color="#FFD700" />;
      case 'spoilers': return <Clock size={16} color="#FFD700" />;
      default: return <ExternalLink size={16} color="#FFD700" />;
    }
  };

  const getFilteredArticles = () => {
    if (activeCategory === 'all') return articles;
    return articles.filter(article => article.category === activeCategory);
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={[styles.categoryButton, activeCategory === 'all' && styles.activeCategoryButton]}
        onPress={() => setActiveCategory('all')}
      >
        <Text style={[styles.categoryText, activeCategory === 'all' && styles.activeCategoryText]}>
          All
        </Text>
      </TouchableOpacity>
      
      {(['releases', 'tournaments', 'market', 'community', 'rules', 'spoilers'] as NewsCategory[]).map(category => (
        <TouchableOpacity
          key={category}
          style={[styles.categoryButton, activeCategory === category && styles.activeCategoryButton]}
          onPress={() => setActiveCategory(category)}
        >
          {getCategoryIcon(category)}
          <Text style={[styles.categoryText, activeCategory === category && styles.activeCategoryText]}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => handleArticlePress(item)}
    >
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A']}
        style={styles.newsGradient}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.newsContent}>
          <View style={styles.newsHeader}>
            <View style={styles.sourceContainer}>
              {getCategoryIcon(item.category)}
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
            <Text style={styles.publishDate}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.newsTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.newsSummary} numberOfLines={3}>
            {item.summary}
          </Text>
          
          <View style={styles.newsFooter}>
            <Text style={styles.authorText}>By {item.author}</Text>
            <ExternalLink size={14} color="#666" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading latest news...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCategoryFilter()}
      
      <FlatList
        data={getFilteredArticles()}
        renderItem={renderNewsItem}
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
            <ExternalLink size={64} color="#333" />
            <Text style={styles.emptyTitle}>No News Available</Text>
            <Text style={styles.emptyDescription}>
              Check back later for the latest TCG news and updates
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
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#2A2A2A',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  activeCategoryText: {
    color: '#FFD700',
  },
  contentContainer: {
    padding: 16,
  },
  newsItem: {
    marginBottom: 16,
  },
  newsGradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 120,
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  publishDate: {
    fontSize: 11,
    color: '#999',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  newsSummary: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#999',
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
});