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
  orderBy 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Binder, BinderPage, BinderTemplate, CollectionCard } from '../types/global';
import { authService } from './authService';
import { aiAssistantService } from './aiAssistantService';

export class BinderService {
  private getBindersRef() {
    return collection(firestore, 'binders');
  }

  private getBinderRef(binderId: string) {
    return doc(firestore, 'binders', binderId);
  }

  async getUserBinders(userId?: string): Promise<Binder[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const q = query(
        this.getBindersRef(),
        where('ownerId', '==', targetUserId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const binders: Binder[] = [];

      querySnapshot.forEach((doc) => {
        binders.push({ id: doc.id, ...doc.data() } as Binder);
      });

      return binders;
    } catch (error) {
      console.error('Error fetching user binders:', error);
      throw error;
    }
  }

  async createBinder(data: {
    name: string;
    description?: string;
    templateId: string;
  }): Promise<Binder> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const template = await this.getBinderTemplate(data.templateId);
      if (!template) {
        throw new Error('Binder template not found');
      }

      // Create initial pages based on template
      const initialPages: BinderPage[] = [];
      for (let i = 1; i <= 10; i++) { // Start with 10 pages
        initialPages.push({
          id: `page_${i}`,
          pageNumber: i,
          cards: new Array(template.slotsPerPage).fill(null),
          notes: '',
        });
      }

      const newBinder: Omit<Binder, 'id'> = {
        name: data.name,
        description: data.description || '',
        ownerId: currentUser.id,
        isPublic: false,
        pages: initialPages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        template,
      };

      const docRef = await addDoc(this.getBindersRef(), newBinder);
      
      return {
        id: docRef.id,
        ...newBinder,
      };
    } catch (error) {
      console.error('Error creating binder:', error);
      throw error;
    }
  }

  async updateBinder(binderId: string, updates: Partial<Binder>): Promise<Binder> {
    try {
      const binderRef = this.getBinderRef(binderId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(binderRef, updateData);

      const updatedBinder = await this.getBinderById(binderId);
      if (!updatedBinder) {
        throw new Error('Binder not found after update');
      }

      return updatedBinder;
    } catch (error) {
      console.error('Error updating binder:', error);
      throw error;
    }
  }

  async addCardToBinder(
    binderId: string,
    pageNumber: number,
    slotIndex: number,
    card: CollectionCard
  ): Promise<Binder> {
    try {
      const binder = await this.getBinderById(binderId);
      if (!binder) {
        throw new Error('Binder not found');
      }

      const page = binder.pages.find(p => p.pageNumber === pageNumber);
      if (!page) {
        throw new Error('Page not found');
      }

      if (slotIndex < 0 || slotIndex >= page.cards.length) {
        throw new Error('Invalid slot index');
      }

      // Add card to the specified slot
      page.cards[slotIndex] = card;

      await this.updateBinder(binderId, { pages: binder.pages });

      return binder;
    } catch (error) {
      console.error('Error adding card to binder:', error);
      throw error;
    }
  }

  async removeCardFromBinder(
    binderId: string,
    pageNumber: number,
    slotIndex: number
  ): Promise<Binder> {
    try {
      const binder = await this.getBinderById(binderId);
      if (!binder) {
        throw new Error('Binder not found');
      }

      const page = binder.pages.find(p => p.pageNumber === pageNumber);
      if (!page) {
        throw new Error('Page not found');
      }

      if (slotIndex < 0 || slotIndex >= page.cards.length) {
        throw new Error('Invalid slot index');
      }

      // Remove card from the specified slot
      page.cards[slotIndex] = null;

      await this.updateBinder(binderId, { pages: binder.pages });

      return binder;
    } catch (error) {
      console.error('Error removing card from binder:', error);
      throw error;
    }
  }

  async organizeBinder(binderId: string, criteria: string): Promise<Binder> {
    try {
      const binder = await this.getBinderById(binderId);
      if (!binder) {
        throw new Error('Binder not found');
      }

      // Use AI assistant to organize binder based on criteria
      const organizedPages = await aiAssistantService.organizeBinder(binder, criteria);

      await this.updateBinder(binderId, { pages: organizedPages });

      return {
        ...binder,
        pages: organizedPages,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error organizing binder:', error);
      throw error;
    }
  }

  async getBinderById(binderId: string): Promise<Binder | null> {
    try {
      const binderRef = this.getBinderRef(binderId);
      const docSnap = await getDoc(binderRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Binder;
      }

      return null;
    } catch (error) {
      console.error('Error fetching binder:', error);
      throw error;
    }
  }

  async getBinderTemplates(): Promise<BinderTemplate[]> {
    try {
      // Return predefined binder templates
      return [
        {
          id: '9-card-grid',
          name: '9-Card Grid',
          slotsPerPage: 9,
          layout: 'grid',
          dimensions: { rows: 3, columns: 3 },
        },
        {
          id: '18-card-grid',
          name: '18-Card Grid',
          slotsPerPage: 18,
          layout: 'grid',
          dimensions: { rows: 6, columns: 3 },
        },
        {
          id: '12-card-grid',
          name: '12-Card Grid',
          slotsPerPage: 12,
          layout: 'grid',
          dimensions: { rows: 4, columns: 3 },
        },
        {
          id: '6-card-showcase',
          name: '6-Card Showcase',
          slotsPerPage: 6,
          layout: 'grid',
          dimensions: { rows: 2, columns: 3 },
        },
      ];
    } catch (error) {
      console.error('Error fetching binder templates:', error);
      return [];
    }
  }

  private async getBinderTemplate(templateId: string): Promise<BinderTemplate | null> {
    const templates = await this.getBinderTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  async duplicateBinder(binderId: string, newName: string): Promise<Binder> {
    try {
      const originalBinder = await this.getBinderById(binderId);
      if (!originalBinder) {
        throw new Error('Original binder not found');
      }

      const duplicatedBinder = await this.createBinder({
        name: newName,
        description: `Copy of ${originalBinder.name}`,
        templateId: originalBinder.template.id,
      });

      // Copy all pages and cards
      await this.updateBinder(duplicatedBinder.id, {
        pages: originalBinder.pages.map(page => ({
          ...page,
          id: `${duplicatedBinder.id}_page_${page.pageNumber}`,
        })),
      });

      return duplicatedBinder;
    } catch (error) {
      console.error('Error duplicating binder:', error);
      throw error;
    }
  }

  async shareBinder(binderId: string): Promise<string> {
    try {
      const binder = await this.getBinderById(binderId);
      if (!binder) {
        throw new Error('Binder not found');
      }

      // Make binder public and return shareable URL
      await this.updateBinder(binderId, { isPublic: true });

      return `https://decklab.app/binder/${binderId}`;
    } catch (error) {
      console.error('Error sharing binder:', error);
      throw error;
    }
  }
}

export const binderService = new BinderService();