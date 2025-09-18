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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, BookOpen, Grid3x3 as Grid, MoveVertical as MoreVertical, Share, CreditCard as Edit3, Trash2, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState, AppDispatch } from '../../src/store/store';
import { 
  fetchUserBinders, 
  createBinder, 
  setActiveBinder,
  fetchBinderTemplates 
} from '../../src/store/slices/binderSlice';
import { Binder, BinderTemplate } from '../../src/types/global';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function BinderScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { binders, templates, loading, error } = useSelector((state: RootState) => state.binder);
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBinderName, setNewBinderName] = useState('');
  const [newBinderDescription, setNewBinderDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BinderTemplate | null>(null);

  const bindersArray = Object.values(binders);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserBinders(user.id));
      dispatch(fetchBinderTemplates());
    }
  }, [user, dispatch]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchUserBinders(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to refresh binders:', error);
    }
    setRefreshing(false);
  }, [user, dispatch]);

  const handleCreateBinder = async () => {
    if (!newBinderName.trim()) {
      Alert.alert('Error', 'Please enter a binder name');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a binder template');
      return;
    }

    try {
      await dispatch(createBinder({
        name: newBinderName.trim(),
        description: newBinderDescription.trim(),
        templateId: selectedTemplate.id,
      })).unwrap();

      setShowCreateModal(false);
      setNewBinderName('');
      setNewBinderDescription('');
      setSelectedTemplate(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to create binder');
    }
  };

  const handleBinderPress = (binder: Binder) => {
    dispatch(setActiveBinder(binder.id));
    router.push(`/binder/${binder.id}`);
  };

  const renderBinderItem = ({ item }: { item: Binder }) => {
    const filledSlots = item.pages.reduce((total, page) => {
      return total + page.cards.filter(card => card !== null).length;
    }, 0);
    
    const totalSlots = item.pages.length * item.template.slotsPerPage;
    const completionPercentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.binderItem}
        onPress={() => handleBinderPress(item)}
      >
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A']}
          style={styles.binderCard}
        >
          <View style={styles.binderHeader}>
            <BookOpen size={24} color="#FFD700" />
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.binderName} numberOfLines={2}>
            {item.name}
          </Text>

          {item.description && (
            <Text style={styles.binderDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.binderStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Pages</Text>
              <Text style={styles.statValue}>{item.pages.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cards</Text>
              <Text style={styles.statValue}>{filledSlots}/{totalSlots}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Complete</Text>
              <Text style={styles.statValue}>{completionPercentage.toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.binderFooter}>
            <Text style={styles.templateName}>
              {item.template.name}
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
  };

  const renderTemplateItem = ({ item }: { item: BinderTemplate }) => (
    <TouchableOpacity
      style={[
        styles.templateItem,
        selectedTemplate?.id === item.id && styles.selectedTemplate
      ]}
      onPress={() => setSelectedTemplate(item)}
    >
      <Grid size={20} color={selectedTemplate?.id === item.id ? '#FFD700' : '#666'} />
      <Text style={[
        styles.templateName,
        selectedTemplate?.id === item.id && styles.selectedTemplateName
      ]}>
        {item.name}
      </Text>
      <Text style={styles.templateDetails}>
        {item.slotsPerPage} cards per page
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Binders</Text>
        <Text style={styles.subtitle}>
          {bindersArray.length} binder{bindersArray.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={20} color="#0A0A0A" />
      </TouchableOpacity>
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
          <Text style={styles.modalTitle}>New Binder</Text>
          <TouchableOpacity onPress={handleCreateBinder}>
            <Text style={styles.modalCreate}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Binder Name</Text>
            <TextInput
              style={styles.textInput}
              value={newBinderName}
              onChangeText={setNewBinderName}
              placeholder="Enter binder name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newBinderDescription}
              onChangeText={setNewBinderDescription}
              placeholder="Describe your binder"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Choose Template</Text>
            <FlatList
              data={templates}
              renderItem={renderTemplateItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.templatesContainer}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && bindersArray.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading binders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {bindersArray.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#333" />
          <Text style={styles.emptyTitle}>No Binders Yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first binder to organize and showcase your favorite cards
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#0A0A0A" />
            <Text style={styles.emptyCreateText}>Create Binder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bindersArray}
          renderItem={renderBinderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
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
  createButton: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  binderItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  binderCard: {
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  binderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moreButton: {
    padding: 4,
  },
  binderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  binderDescription: {
    fontSize: 13,
    color: '#CCC',
    marginBottom: 16,
    lineHeight: 18,
  },
  binderStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  binderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: {
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
  templatesContainer: {
    paddingVertical: 8,
  },
  templateItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplate: {
    borderColor: '#FFD700',
    backgroundColor: '#2A2A2A',
  },
  selectedTemplateName: {
    color: '#FFD700',
  },
  templateDetails: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});