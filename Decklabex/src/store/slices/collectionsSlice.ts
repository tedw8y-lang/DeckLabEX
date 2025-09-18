import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Collection, CollectionCard, CollectionsState } from '../../types/global';
import { collectionService } from '../../services/collectionService';

const initialState: CollectionsState = {
  collections: {},
  activeCollectionId: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserCollections = createAsyncThunk(
  'collections/fetchUserCollections',
  async (userId: string, { rejectWithValue }) => {
    try {
      const collections = await collectionService.getUserCollections(userId);
      return collections;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch collections');
    }
  }
);

export const createCollection = createAsyncThunk(
  'collections/createCollection',
  async ({ name, description, isPublic }: { name: string; description?: string; isPublic: boolean }, { rejectWithValue }) => {
    try {
      const collection = await collectionService.createCollection({ name, description, isPublic });
      return collection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create collection');
    }
  }
);

export const updateCollection = createAsyncThunk(
  'collections/updateCollection',
  async ({ collectionId, updates }: { collectionId: string; updates: Partial<Collection> }, { rejectWithValue }) => {
    try {
      const collection = await collectionService.updateCollection(collectionId, updates);
      return collection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update collection');
    }
  }
);

export const deleteCollection = createAsyncThunk(
  'collections/deleteCollection',
  async (collectionId: string, { rejectWithValue }) => {
    try {
      await collectionService.deleteCollection(collectionId);
      return collectionId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete collection');
    }
  }
);

export const addCardToCollection = createAsyncThunk(
  'collections/addCardToCollection',
  async ({ collectionId, card }: { collectionId: string; card: Omit<CollectionCard, 'addedAt'> }, { rejectWithValue }) => {
    try {
      const updatedCollection = await collectionService.addCardToCollection(collectionId, card);
      return { collectionId, collection: updatedCollection };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add card to collection');
    }
  }
);

export const removeCardFromCollection = createAsyncThunk(
  'collections/removeCardFromCollection',
  async ({ collectionId, cardId }: { collectionId: string; cardId: string }, { rejectWithValue }) => {
    try {
      const updatedCollection = await collectionService.removeCardFromCollection(collectionId, cardId);
      return { collectionId, collection: updatedCollection };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove card from collection');
    }
  }
);

export const updateCardInCollection = createAsyncThunk(
  'collections/updateCardInCollection',
  async ({ 
    collectionId, 
    cardId, 
    updates 
  }: { 
    collectionId: string; 
    cardId: string; 
    updates: Partial<CollectionCard> 
  }, { rejectWithValue }) => {
    try {
      const updatedCollection = await collectionService.updateCardInCollection(collectionId, cardId, updates);
      return { collectionId, collection: updatedCollection };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update card in collection');
    }
  }
);

export const bulkAddCardsToCollection = createAsyncThunk(
  'collections/bulkAddCardsToCollection',
  async ({ collectionId, cards }: { collectionId: string; cards: Omit<CollectionCard, 'addedAt'>[] }, { rejectWithValue }) => {
    try {
      const updatedCollection = await collectionService.bulkAddCardsToCollection(collectionId, cards);
      return { collectionId, collection: updatedCollection };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk add cards to collection');
    }
  }
);

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveCollection: (state, action: PayloadAction<string | null>) => {
      state.activeCollectionId = action.payload;
    },
    optimisticAddCard: (state, action: PayloadAction<{ collectionId: string; card: CollectionCard }>) => {
      const { collectionId, card } = action.payload;
      if (state.collections[collectionId]) {
        state.collections[collectionId].cards.push(card);
        // Update stats
        state.collections[collectionId].stats.totalCards += card.quantity;
        state.collections[collectionId].stats.uniqueCards += 1;
      }
    },
    optimisticRemoveCard: (state, action: PayloadAction<{ collectionId: string; cardId: string }>) => {
      const { collectionId, cardId } = action.payload;
      if (state.collections[collectionId]) {
        const cardIndex = state.collections[collectionId].cards.findIndex(c => c.cardId === cardId);
        if (cardIndex !== -1) {
          const removedCard = state.collections[collectionId].cards[cardIndex];
          state.collections[collectionId].cards.splice(cardIndex, 1);
          // Update stats
          state.collections[collectionId].stats.totalCards -= removedCard.quantity;
          state.collections[collectionId].stats.uniqueCards -= 1;
        }
      }
    },
    optimisticUpdateCard: (state, action: PayloadAction<{ 
      collectionId: string; 
      cardId: string; 
      updates: Partial<CollectionCard> 
    }>) => {
      const { collectionId, cardId, updates } = action.payload;
      if (state.collections[collectionId]) {
        const cardIndex = state.collections[collectionId].cards.findIndex(c => c.cardId === cardId);
        if (cardIndex !== -1) {
          const oldQuantity = state.collections[collectionId].cards[cardIndex].quantity;
          state.collections[collectionId].cards[cardIndex] = {
            ...state.collections[collectionId].cards[cardIndex],
            ...updates,
          };
          // Update stats if quantity changed
          if (updates.quantity && updates.quantity !== oldQuantity) {
            state.collections[collectionId].stats.totalCards += (updates.quantity - oldQuantity);
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Collections
    builder
      .addCase(fetchUserCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = {};
        action.payload.forEach(collection => {
          state.collections[collection.id] = collection;
        });
        state.error = null;
      })
      .addCase(fetchUserCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Collection
    builder
      .addCase(createCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.collections[action.payload.id] = action.payload;
        state.activeCollectionId = action.payload.id;
        state.error = null;
      })
      .addCase(createCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Collection
    builder
      .addCase(updateCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.collections[action.payload.id] = action.payload;
        state.error = null;
      })
      .addCase(updateCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Collection
    builder
      .addCase(deleteCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.loading = false;
        delete state.collections[action.payload];
        if (state.activeCollectionId === action.payload) {
          state.activeCollectionId = null;
        }
        state.error = null;
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add Card to Collection
    builder
      .addCase(addCardToCollection.pending, (state) => {
        state.error = null;
      })
      .addCase(addCardToCollection.fulfilled, (state, action) => {
        const { collectionId, collection } = action.payload;
        state.collections[collectionId] = collection;
        state.error = null;
      })
      .addCase(addCardToCollection.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Remove Card from Collection
    builder
      .addCase(removeCardFromCollection.pending, (state) => {
        state.error = null;
      })
      .addCase(removeCardFromCollection.fulfilled, (state, action) => {
        const { collectionId, collection } = action.payload;
        state.collections[collectionId] = collection;
        state.error = null;
      })
      .addCase(removeCardFromCollection.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update Card in Collection
    builder
      .addCase(updateCardInCollection.pending, (state) => {
        state.error = null;
      })
      .addCase(updateCardInCollection.fulfilled, (state, action) => {
        const { collectionId, collection } = action.payload;
        state.collections[collectionId] = collection;
        state.error = null;
      })
      .addCase(updateCardInCollection.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Bulk Add Cards to Collection
    builder
      .addCase(bulkAddCardsToCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAddCardsToCollection.fulfilled, (state, action) => {
        state.loading = false;
        const { collectionId, collection } = action.payload;
        state.collections[collectionId] = collection;
        state.error = null;
      })
      .addCase(bulkAddCardsToCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setActiveCollection, 
  optimisticAddCard, 
  optimisticRemoveCard, 
  optimisticUpdateCard 
} = collectionsSlice.actions;

export default collectionsSlice.reducer;