@@ .. @@
 import React, { useState, useEffect, useCallback } from 'react';
 import {
   View,
   Text,
-  TextInput,
   StyleSheet,
   FlatList,
   TouchableOpacity,
   Image,
   Dimensions,
   SafeAreaView,
   RefreshControl,
   Modal,
 } from 'react-native';
 import { useRouter } from 'expo-router';
 import { useDispatch, useSelector } from 'react-redux';
 import { 
-  Search as SearchIcon, 
   Filter, 
-  Grid2x2 as Grid, 
+  Grid3x3 as Grid, 
   List, 
   TrendingUp, 
   Star,
   Clock,
   Zap,
-  X,
-  ExternalLink
+  ExternalLink,
+  Sparkles,
+  Bot
 } from 'lucide-react-native';
 import { LinearGradient } from 'expo-linear-gradient';
 
 import { RootState, AppDispatch } from '../../src/store/store';
-import { fetchCards, fetchSets } from '../../src/store/slices/cardsSlice';
+import { fetchSets } from '../../src/store/slices/cardsSlice';
 import { 
   performSearch, 
   getPopularCards, 
   getSearchHistory,
-  getPredictiveResults,
   setQuery 
 } from '../../src/store/slices/searchSlice';
 import { Card, CardSet } from '../../src/types/global';
 import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
+import { EnhancedSearchBar } from '../../src/components/ui/EnhancedSearchBar';
+import { OptimizedCardItem } from '../../src/components/ui/OptimizedCardItem';
 import { AdvancedFilterModal } from '../../src/components/ui/AdvancedFilterModal';
 import { NewsTab } from '../../src/components/ui/NewsTab';
 import { PokedexView } from '../../src/components/ui/PokedexView';
-import { CompetitiveTools } from '../../src/components/ui/CompetitiveTools';
+import { AIAssistantChat } from '../../src/components/ui/AIAssistantChat';
 
 const { width } = Dimensions.get('window');
 const ITEM_WIDTH = (width - 32) / 2;
@@ .. @@
   const { 
     query: searchQuery, 
     results: searchResults, 
-    history: searchHistory, 
     loading: searchLoading 
   } = useSelector((state: RootState) => state.search);
   
-  const [localQuery, setLocalQuery] = useState('');
   const [activeTab, setActiveTab] = useState<'popular' | 'sets' | 'pokedex' | 'news' | 'competitive'>('popular');
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [refreshing, setRefreshing] = useState(false);
-  const [showSearchHistory, setShowSearchHistory] = useState(false);
-  const [predictiveResults, setPredictiveResults] = useState<string[]>([]);
-  const [showPredictive, setShowPredictive] = useState(false);
   const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
-  const [showCompetitiveTools, setShowCompetitiveTools] = useState(false);
+  const [showAIAssistant, setShowAIAssistant] = useState(false);
   
   const [popularCards, setPopularCards] = useState<Card[]>([]);
   const setsArray = Object.values(sets);
@@ .. @@
   useEffect(() => {
     loadInitialData();
-    if (user) {
-      dispatch(getSearchHistory(user.id));
-    }
   }, []);
 
   useEffect(() => {
@@ .. @@
     setRefreshing(false);
   }, []);
 
-  const handleSearchInput = (query: string) => {
-    setLocalQuery(query);
-    dispatch(setQuery(query));
-    
-    // Show predictive results for queries longer than 1 character
-    if (query.length > 1) {
-      setShowPredictive(true);
-      dispatch(getPredictiveResults(query));
-    } else {
-      setShowPredictive(false);
-      setPredictiveResults([]);
-    }
-  };
-
-  const handleSearchSubmit = () => {
-    if (localQuery.trim()) {
-      dispatch(performSearch({ query: localQuery.trim(), filters: {} }));
-      setShowPredictive(false);
-    }
-  };
-
-  const handlePredictiveSelect = (suggestion: string) => {
-    setLocalQuery(suggestion);
-    dispatch(setQuery(suggestion));
-    dispatch(performSearch({ query: suggestion, filters: {} }));
-    setShowPredictive(false);
-  };
-
   const handleCardPress = (card: Card) => {
     router.push(`/card/${card.id}`);
   };
@@ .. @@
     router.push(`/set/${set.id}`);
   };
 
-  const renderSearchBar = () => (
-    <View style={styles.searchBarContainer}>
-      <View style={styles.searchInputContainer}>
-        <SearchIcon size={20} color="#666" style={styles.searchIcon} />
-        <TextInput
-          style={styles.searchInput}
-          placeholder="Search cards, sets, or Pokemon..."
-          placeholderTextColor="#666"
-          value={localQuery}
-          onChangeText={handleSearchInput}
-          onSubmitEditing={handleSearchSubmit}
-          onFocus={() => setShowSearchHistory(true)}
-        />
-        {localQuery.length > 0 && (
-          <TouchableOpacity
-            style={styles.clearButton}
-            onPress={() => {
-              setLocalQuery('');
-              dispatch(setQuery(''));
-              setShowPredictive(false);
-            }}
-          >
-            <X size={16} color="#666" />
-          </TouchableOpacity>
-        )}
-      </View>
-      
-      <TouchableOpacity style={styles.filterButton}>
-        <Filter size={20} color="#FFD700" onPress={() => setShowAdvancedFilter(true)} />
-      </TouchableOpacity>
-    </View>
-  );
-
-  const renderPredictiveResults = () => {
-    if (!showPredictive || predictiveResults.length === 0) return null;
-
-    return (
-      <View style={styles.predictiveContainer}>
-        {predictiveResults.map((suggestion, index) => (
-          <TouchableOpacity
-            key={index}
-            style={styles.predictiveItem}
-            onPress={() => handlePredictiveSelect(suggestion)}
-          >
-            <SearchIcon size={16} color="#666" />
-            <Text style={styles.predictiveText}>{suggestion}</Text>
-          </TouchableOpacity>
-        ))}
-      </View>
-    );
-  };
-
-  const renderSearchHistory = () => {
-    if (!showSearchHistory || searchHistory.length === 0) return null;
-
-    const recentSearches = searchHistory.slice(0, 7);
-
-    return (
-      <View style={styles.historyContainer}>
-        <View style={styles.historyHeader}>
-          <Clock size={16} color="#666" />
-          <Text style={styles.historyTitle}>Recent Searches</Text>
-        </View>
-        {recentSearches.map((search, index) => (
-          <TouchableOpacity
-            key={search.id}
-            style={styles.historyItem}
-            onPress={() => handlePredictiveSelect(search.query)}
-          >
-            <Text style={styles.historyText}>{search.query}</Text>
-            <Text style={styles.historyResults}>{search.results} results</Text>
-          </TouchableOpacity>
-        ))}
-      </View>
-    );
-  };
-
   const renderSearchHeader = () => (
     <View style={styles.header}>
-      {renderSearchBar()}
-      {renderPredictiveResults()}
-      {renderSearchHistory()}
+      <EnhancedSearchBar 
+        onFilterPress={() => setShowAdvancedFilter(true)}
+        placeholder="Search cards, sets, Pokémon..."
+      />
 
       <View style={styles.tabContainer}>
         <TouchableOpacity
@@ -139,6 +67,16 @@
           </Text>
         </TouchableOpacity>
       </View>
+
+      {/* AI Assistant FAB */}
+      <TouchableOpacity
+        style={styles.aiFab}
+        onPress={() => setShowAIAssistant(true)}
+        activeOpacity={0.8}
+      >
+        <Sparkles size={20} color="#0A0A0A" />
+        <Bot size={16} color="#0A0A0A" style={styles.aiFabIcon} />
+      </TouchableOpacity>
     </View>
   );
 
@@ .. @@
     return (
       <FlatList
-        data={currentData}
-        renderItem={renderCardItem}
+        data={currentData as Card[]}
+        renderItem={({ item, index }) => (
+          <OptimizedCardItem
+            card={item}
+            onPress={handleCardPress}
+            viewMode={viewMode}
+            index={index}
+            showMarketData={true}
+          />
+        )}
         keyExtractor={(item) => item.id}
         numColumns={viewMode === 'grid' ? 2 : 1}
         columnWrapperStyle={viewMode === 'grid' ? styles.cardRow : undefined}
@@ .. @@
         }
         ListEmptyComponent={
           <View style={styles.emptyContainer}>
-            <SearchIcon size={64} color="#333" />
+            <Zap size={64} color="#333" />
             <Text style={styles.emptyTitle}>No Results Found</Text>
             <Text style={styles.emptyDescription}>
               Try adjusting your search terms or filters
@@ .. @@
       <AdvancedFilterModal
         visible={showAdvancedFilter}
         onClose={() => setShowAdvancedFilter(false)}
         onApplyFilters={(filters) => {
-          dispatch(performSearch({ query: localQuery, filters }));
+          dispatch(performSearch({ query: searchQuery, filters }));
           setShowAdvancedFilter(false);
         }}
       />
       
-      <CompetitiveTools
-        visible={showCompetitiveTools}
-        onClose={() => setShowCompetitiveTools(false)}
+      <Modal
+        visible={showAIAssistant}
+        animationType="slide"
+        presentationStyle="pageSheet"
+        onRequestClose={() => setShowAIAssistant(false)}
+      >
+        <AIAssistantChat
+          visible={showAIAssistant}
+          onClose={() => setShowAIAssistant(false)}
+        />
+      </Modal>
+    </SafeAreaView>
+  );
+}
+
+const styles = StyleSheet.create({
+  container: {
+    flex: 1,
+    backgroundColor: '#0A0A0A',
+  },
+  header: {
+    paddingTop: 10,
+    paddingBottom: 15,
+    position: 'relative',
+  },
+  tabContainer: {
+    flexDirection: 'row',
+    paddingHorizontal: 16,
+    marginBottom: 15,
+  },
+  tab: {
+    flex: 1,
+    flexDirection: 'row',
+    alignItems: 'center',
+    justifyContent: 'center',
+    paddingVertical: 10,
+    marginHorizontal: 4,
+    borderRadius: 8,
+    backgroundColor: '#1A1A1A',
+  },
+  activeTab: {
+    backgroundColor: '#2A2A2A',
+  },
+  tabText: {
+    color: '#666',
+    fontSize: 12,
+    fontWeight: '600',
+    marginLeft: 6,
+  },
+  activeTabText: {
+    color: '#FFD700',
+  },
+  aiFab: {
+    position: 'absolute',
+    bottom: 20,
+    right: 20,
+    width: 56,
+    height: 56,
+    borderRadius: 28,
+    backgroundColor: '#FFD700',
+    alignItems: 'center',
+    justifyContent: 'center',
+    shadowColor: '#000',
+    shadowOffset: { width: 0, height: 4 },
+    shadowOpacity: 0.3,
+    shadowRadius: 8,
+    elevation: 8,
+    zIndex: 1000,
+  },
+  aiFabIcon: {
+    position: 'absolute',
+    top: 4,
+    right: 4,
+  },
+  viewModeContainer: {
+    flexDirection: 'row',
+    justifyContent: 'flex-end',
+    paddingHorizontal: 16,
+    marginBottom: 10,
+  },
+  viewModeButton: {
+    width: 40,
+    height: 32,
+    borderRadius: 6,
+    backgroundColor: '#1A1A1A',
+    alignItems: 'center',
+    justifyContent: 'center',
+    marginLeft: 8,
+  },
+  activeViewMode: {
+    backgroundColor: '#2A2A2A',
+  },
+  contentContainer: {
+    padding: 16,
+    paddingTop: 0,
+  },
+  loadingContainer: {
+    flex: 1,
+    alignItems: 'center',
+    justifyContent: 'center',
+  },
+  loadingText: {
+    fontSize: 16,
+    color: '#666',
+    marginTop: 16,
+  },
+  emptyContainer: {
+    alignItems: 'center',
+    justifyContent: 'center',
+    paddingVertical: 64,
+  },
+  emptyTitle: {
+    fontSize: 20,
+    fontWeight: '600',
+    color: '#FFFFFF',
+    marginTop: 16,
+    marginBottom: 8,
+  },
+  emptyDescription: {
+    fontSize: 14,
+    color: '#666',
+    textAlign: 'center',
+  },
+  cardRow: {
+    justifyContent: 'space-between',
+  },
+  setRow: {
+    justifyContent: 'space-between',
+  },
+  setItem: {
+    width: ITEM_WIDTH,
+    backgroundColor: '#1A1A1A',
+    borderRadius: 12,
+    padding: 12,
+    marginBottom: 16,
+    alignItems: 'center',
+  },
+  setImageContainer: {
+    width: '100%',
+    height: 80,
+    marginBottom: 12,
+    alignItems: 'center',
+    justifyContent: 'center',
+  },
+  setImage: {
+    width: '80%',
+    height: '100%',
+  },
+  setInfo: {
+    width: '100%',
+    alignItems: 'center',
+  },
+  setName: {
+    color: '#FFFFFF',
+    fontSize: 14,
+    fontWeight: '600',
+    marginBottom: 4,
+    textAlign: 'center',
+  },
+  setDetails: {
+    color: '#CCCCCC',
+    fontSize: 11,
+    marginBottom: 2,
+  },
+  setSeries: {
+    color: '#FFD700',
+    fontSize: 10,
+    fontWeight: '500',
+  },
+});
+