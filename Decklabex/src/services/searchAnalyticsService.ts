import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  increment 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Card, SearchHistory, SearchFilters } from '../types/global';
import { authService } from './authService';
import { pokemonTcgService } from './pokemonTcgService';

export class SearchAnalyticsService {
  private getSearchHistoryRef() {
    return collection(firestore, 'searchHistory');
  }

  private getSearchAnalyticsRef() {
    return collection(firestore, 'searchAnalytics');
  }

  async trackSearch(query: string, filters: SearchFilters, resultCount: number): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      // Add to user's search history
      const searchHistoryEntry: Omit<SearchHistory, 'id'> = {
        query,
        filters,
        results: resultCount,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
      };

      await addDoc(this.getSearchHistoryRef(), searchHistoryEntry);

      // Update global search analytics
      if (query.trim()) {
        await this.updateSearchPopularity(query.trim());
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  async getUserSearchHistory(userId: string): Promise<SearchHistory[]> {
    try {
      const q = query(
        this.getSearchHistoryRef(),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const history: SearchHistory[] = [];

      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as SearchHistory);
      });

      return history;
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }

  async getPopularCards(): Promise<Card[]> {
    try {
      // Get most searched card names
      const q = query(
        this.getSearchAnalyticsRef(),
        orderBy('searchCount', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const popularQueries: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        popularQueries.push(data.query);
      });

      // Fetch actual card data for popular queries
      const popularCards: Card[] = [];
      
      for (const cardQuery of popularQueries) {
        try {
          const cards = await pokemonTcgService.searchCardsByName(cardQuery, 1);
          if (cards.length > 0) {
            popularCards.push(cards[0]);
          }
        } catch (error) {
          console.error(`Error fetching card for query "${cardQuery}":`, error);
        }
      }

      return popularCards;
    } catch (error) {
      console.error('Error fetching popular cards:', error);
      return [];
    }
  }

  async getRecentSearches(userId: string, limit: number = 7): Promise<SearchHistory[]> {
    try {
      const q = query(
        this.getSearchHistoryRef(),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const recentSearches: SearchHistory[] = [];

      querySnapshot.forEach((doc) => {
        recentSearches.push({ id: doc.id, ...doc.data() } as SearchHistory);
      });

      return recentSearches;
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      return [];
    }
  }

  async getPredictiveSearchResults(query: string): Promise<string[]> {
    try {
      if (query.length < 2) return [];

      // Get cards that match the query
      const cards = await pokemonTcgService.searchCardsByName(query, 10);
      
      // Extract unique card names
      const cardNames = cards.map(card => card.name);
      const uniqueNames = [...new Set(cardNames)];

      return uniqueNames.slice(0, 5);
    } catch (error) {
      console.error('Error getting predictive search results:', error);
      return [];
    }
  }

  private async updateSearchPopularity(query: string): Promise<void> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Check if analytics entry exists
      const q = query(
        this.getSearchAnalyticsRef(),
        where('query', '==', normalizedQuery)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new analytics entry
        await addDoc(this.getSearchAnalyticsRef(), {
          query: normalizedQuery,
          searchCount: 1,
          lastSearched: new Date().toISOString(),
        });
      } else {
        // Update existing entry
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          searchCount: increment(1),
          lastSearched: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating search popularity:', error);
    }
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      
      // Get predictive results
      const predictive = await this.getPredictiveSearchResults(query);
      suggestions.push(...predictive);

      // Get popular searches that match
      const q = query(
        this.getSearchAnalyticsRef(),
        orderBy('searchCount', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.query.includes(query.toLowerCase()) && !suggestions.includes(data.query)) {
          suggestions.push(data.query);
        }
      });

      return suggestions.slice(0, 8);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();