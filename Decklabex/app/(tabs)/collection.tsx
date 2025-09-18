import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Grid3x3 as Grid, List, Filter, TrendingUp, Star, MoveVertical as MoreVertical, CreditCard as Edit3, Trash2, Share, Copy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState, AppDispatch } from '../../src/store/store';
import { 
  fetchUserCollections, 
  createCollection, 
  deleteCollection,
  setActiveCollection 
} from '../../src/store/slices/collectionsSlice';
import { Collection } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function CollectionScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { collections, loading, error } = useSelector((state: RootState) => state.collections);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const collectionsArray = Object.values(collections);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserCollections(user.id));
    }
  }, [user, dispatch]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchUserCollections(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to refresh collections:', error);
    }
    setRefreshing(false);
  }, [user, dispatch]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      await dispatch(createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        isPublic,
      })).unwrap();

      setShowCreateModal(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPublic(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  const handleCollectionPress = (collection: Collection) => {
    dispatch(setActiveCollection(collection.id));
    router.push(`/collection/${collection.id}`);
  };

  const handleDeleteCollection = (collectionId: string) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => dispatch(deleteCollection(collectionId))
        },
      ]
    );
  };

  const renderCollectionItem = ({ item }: { item: Collection }) => {
    const cardCount = item.stats.totalCards;
    const uniqueCount = item.stats.uniqueCards;
    const totalValue = item.stats.totalValue;

    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.collectionGridItem}
          onPress={() => handleCollectionPress(item)}
        >
          <LinearGradient
            colors={['#1A1A1A', '#2A2A2A']}
            style={styles.collectionCard}
          >
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionName} numberOfLines={2}>
                {item.name}
              </Text>
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={16} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.collectionStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cardCount}</Text>
                <Text style={styles.statLabel}>Cards</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{uniqueCount}</Text>
                <Text style={styles.statLabel}>Unique</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Value</Text>
              </View>
            </View>

            {item.description && (
              <Text style={styles.collectionDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.collectionFooter}>
              <Text style={styles.lastUpdated}>
                Updated {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
              {item.isPublic && (
                <View style={styles.publicBadge}>
                  <Text style={styles.publicText}>Public</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.collectionListItem}
        onPress={() => handleCollectionPress(item)}
      >
        <View style={styles.collectionListContent}>
          <View style={styles.collectionListHeader}>
            <Text style={styles.collectionListName} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.collectionListDescription} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
          
          <View style={styles.collectionListStats}>
            <Text style={styles.collectionListStat}>
              {cardCount} cards • {uniqueCount} unique • ${totalValue.toFixed(0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Collections</Text>
        <Text style={styles.subtitle}>
          {collectionsArray.length} collection{collectionsArray.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
          onPress={() => setViewMode('grid')}
        >
          <Grid size={18} color={viewMode === 'grid' ? '#FFD700' : '#666'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
          onPress={() => setViewMode('list')}
        >
          <List size={18} color={viewMode === 'list' ? '#FFD700' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#0A0A0A" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Collection</Text>
          <TouchableOpacity onPress={handleCreateCollection}>
            <Text style={styles.modalCreate}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Collection Name</Text>
            <TextInput
              style={styles.textInput}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Enter collection name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newCollectionDescription}
              onChangeText={setNewCollectionDescription}
              placeholder="Describe your collection"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Text style={styles.toggleLabel}>Make Public</Text>
            <View style={[styles.toggle, isPublic && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && collectionsArray.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading collections...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {collectionsArray.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Grid size={64} color="#333" />
          <Text style={styles.emptyTitle}>No Collections Yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first collection to start organizing your cards
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#0A0A0A" />
            <Text style={styles.emptyCreateText}>Create Collection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={collectionsArray}
          renderItem={renderCollectionItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
            />
          }
        />
      )}

      {renderCreateModal()}
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeViewMode: {
    backgroundColor: '#2A2A2A',
  },
  createButton: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contentContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  collectionGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  collectionCard: {
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  collectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  collectionDescription: {
    fontSize: 13,
    color: '#CCC',
    marginBottom: 12,
    lineHeight: 18,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#666',
  },
  publicBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  collectionListItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  collectionListContent: {
    flex: 1,
  },
  collectionListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionListName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  collectionListDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  collectionListStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionListStat: {
    fontSize: 13,
    color: '#666',
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
    marginBottom: 32,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyCreateText: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCreate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FFD700',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});