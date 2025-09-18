import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Collection, CollectionCard } from '../types/global';
import { authService } from './authService';

export class CollectionService {
  private getCollectionsRef() {
    return collection(firestore, 'collections');
  }

  private getCollectionRef(collectionId: string) {
    return doc(firestore, 'collections', collectionId);
  }

  async getUserCollections(userId?: string): Promise<Collection[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const q = query(
        this.getCollectionsRef(),
        where('ownerId', '==', targetUserId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const collections: Collection[] = [];

      querySnapshot.forEach((doc) => {
        collections.push({ id: doc.id, ...doc.data() } as Collection);
      });

      return collections;
    } catch (error) {
      console.error('Error fetching user collections:', error);
      throw error;
    }
  }

  async getCollectionById(collectionId: string): Promise<Collection | null> {
    try {
      const collectionRef = this.getCollectionRef(collectionId);
      const docSnap = await getDoc(collectionRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Collection;
      }

      return null;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw error;
    }
  }

  async createCollection(data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }): Promise<Collection> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const newCollection: Omit<Collection, 'id'> = {
        name: data.name,
        description: data.description || '',
        ownerId: currentUser.id,
        isPublic: data.isPublic,
        tags: [],
        cards: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalCards: 0,
          uniqueCards: 0,
          totalValue: 0,
          averageValue: 0,
          completionPercentage: 0,
          recentlyAdded: [],
        },
      };

      const docRef = await addDoc(this.getCollectionsRef(), newCollection);
      
      return {
        id: docRef.id,
        ...newCollection,
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async updateCollection(collectionId: string, updates: Partial<Collection>): Promise<Collection> {
    try {
      const collectionRef = this.getCollectionRef(collectionId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(collectionRef, updateData);

      const updatedCollection = await this.getCollectionById(collectionId);
      if (!updatedCollection) {
        throw new Error('Collection not found after update');
      }

      return updatedCollection;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      const collectionRef = this.getCollectionRef(collectionId);
      await deleteDoc(collectionRef);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  async addCardToCollection(
    collectionId: string, 
    card: Omit<CollectionCard, 'addedAt'>
  ): Promise<Collection> {
    try {
      const collection = await this.getCollectionById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Check if card already exists
      const existingCardIndex = collection.cards.findIndex(c => c.cardId === card.cardId);
      
      if (existingCardIndex >= 0) {
        // Update existing card quantity
        collection.cards[existingCardIndex].quantity += card.quantity;
      } else {
        // Add new card
        const newCard: CollectionCard = {
          ...card,
          addedAt: new Date().toISOString(),
        };
        collection.cards.push(newCard);
      }

      // Update collection stats
      const updatedStats = this.calculateCollectionStats(collection.cards);
      
      await this.updateCollection(collectionId, {
        cards: collection.cards,
        stats: updatedStats,
      });

      return {
        ...collection,
        cards: collection.cards,
        stats: updatedStats,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error adding card to collection:', error);
      throw error;
    }
  }

  async removeCardFromCollection(collectionId: string, cardId: string): Promise<Collection> {
    try {
      const collection = await this.getCollectionById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      collection.cards = collection.cards.filter(card => card.cardId !== cardId);
      
      // Update collection stats
      const updatedStats = this.calculateCollectionStats(collection.cards);
      
      await this.updateCollection(collectionId, {
        cards: collection.cards,
        stats: updatedStats,
      });

      return {
        ...collection,
        cards: collection.cards,
        stats: updatedStats,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error removing card from collection:', error);
      throw error;
    }
  }

  async updateCardInCollection(
    collectionId: string,
    cardId: string,
    updates: Partial<CollectionCard>
  ): Promise<Collection> {
    try {
      const collection = await this.getCollectionById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      const cardIndex = collection.cards.findIndex(card => card.cardId === cardId);
      if (cardIndex === -1) {
        throw new Error('Card not found in collection');
      }

      collection.cards[cardIndex] = {
        ...collection.cards[cardIndex],
        ...updates,
      };

      // Update collection stats
      const updatedStats = this.calculateCollectionStats(collection.cards);
      
      await this.updateCollection(collectionId, {
        cards: collection.cards,
        stats: updatedStats,
      });

      return {
        ...collection,
        cards: collection.cards,
        stats: updatedStats,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating card in collection:', error);
      throw error;
    }
  }

  async bulkAddCardsToCollection(
    collectionId: string,
    cards: Omit<CollectionCard, 'addedAt'>[]
  ): Promise<Collection> {
    try {
      const collection = await this.getCollectionById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      const addedAt = new Date().toISOString();
      
      cards.forEach(card => {
        const existingCardIndex = collection.cards.findIndex(c => c.cardId === card.cardId);
        
        if (existingCardIndex >= 0) {
          collection.cards[existingCardIndex].quantity += card.quantity;
        } else {
          collection.cards.push({
            ...card,
            addedAt,
          });
        }
      });

      // Update collection stats
      const updatedStats = this.calculateCollectionStats(collection.cards);
      
      await this.updateCollection(collectionId, {
        cards: collection.cards,
        stats: updatedStats,
      });

      return {
        ...collection,
        cards: collection.cards,
        stats: updatedStats,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error bulk adding cards to collection:', error);
      throw error;
    }
  }

  async duplicateCollection(collectionId: string, newName: string): Promise<Collection> {
    try {
      const originalCollection = await this.getCollectionById(collectionId);
      if (!originalCollection) {
        throw new Error('Original collection not found');
      }

      const duplicatedCollection = await this.createCollection({
        name: newName,
        description: `Copy of ${originalCollection.name}`,
        isPublic: false,
      });

      // Add all cards from original collection
      if (originalCollection.cards.length > 0) {
        return await this.bulkAddCardsToCollection(
          duplicatedCollection.id,
          originalCollection.cards.map(card => ({
            ...card,
            cardId: card.cardId,
          }))
        );
      }

      return duplicatedCollection;
    } catch (error) {
      console.error('Error duplicating collection:', error);
      throw error;
    }
  }

  private calculateCollectionStats(cards: CollectionCard[]): Collection['stats'] {
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = cards.length;
    
    let totalValue = 0;
    let topValueCard: CollectionCard | undefined;
    let topValue = 0;

    cards.forEach(card => {
      const cardValue = this.getCardValue(card);
      const totalCardValue = cardValue * card.quantity;
      totalValue += totalCardValue;

      if (cardValue > topValue) {
        topValue = cardValue;
        topValueCard = card;
      }
    });

    const averageValue = uniqueCards > 0 ? totalValue / uniqueCards : 0;
    
    // Get recently added cards (last 10)
    const recentlyAdded = [...cards]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 10);

    return {
      totalCards,
      uniqueCards,
      totalValue: Math.round(totalValue * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      completionPercentage: 0, // This would need set completion tracking
      topValueCard,
      recentlyAdded,
    };
  }

  private getCardValue(collectionCard: CollectionCard): number {
    // Get the market price based on card condition and grading
    const card = collectionCard.card;
    
    if (!card.prices) {
      return 0;
    }

    let basePrice = card.prices.market || card.prices.mid || card.prices.low || 0;

    // Adjust price based on condition
    const conditionMultipliers = {
      'Mint (M)': 1.0,
      'Near Mint (NM)': 0.9,
      'Lightly Played (LP)': 0.7,
      'Moderately Played (MP)': 0.5,
      'Heavily Played (HP)': 0.3,
      'Damaged (D)': 0.1,
    };

    const conditionMultiplier = conditionMultipliers[collectionCard.condition] || 0.9;
    let adjustedPrice = basePrice * conditionMultiplier;

    // Adjust for graded cards (typically worth more)
    if (collectionCard.isGraded && collectionCard.grade) {
      const gradeMultiplier = Math.max(1.2, collectionCard.grade / 5); // Minimum 20% bonus
      adjustedPrice *= gradeMultiplier;
    }

    // Adjust for first edition
    if (collectionCard.isFirstEdition) {
      adjustedPrice *= 1.5;
    }

    return Math.round(adjustedPrice * 100) / 100;
  }

  async getPublicCollections(limit: number = 20): Promise<Collection[]> {
    try {
      const q = query(
        this.getCollectionsRef(),
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const collections: Collection[] = [];

      querySnapshot.forEach((doc) => {
        collections.push({ id: doc.id, ...doc.data() } as Collection);
      });

      return collections.slice(0, limit);
    } catch (error) {
      console.error('Error fetching public collections:', error);
      throw error;
    }
  }

  async searchCollections(searchTerm: string, isPublicOnly: boolean = false): Promise<Collection[]> {
    try {
      let q = query(this.getCollectionsRef());

      if (isPublicOnly) {
        q = query(q, where('isPublic', '==', true));
      }

      const querySnapshot = await getDocs(q);
      const collections: Collection[] = [];

      querySnapshot.forEach((doc) => {
        const collection = { id: doc.id, ...doc.data() } as Collection;
        
        // Client-side filtering by name (Firestore doesn't support case-insensitive contains)
        if (collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
          collections.push(collection);
        }
      });

      return collections;
    } catch (error) {
      console.error('Error searching collections:', error);
      throw error;
    }
  }
}

export const collectionService = new CollectionService();