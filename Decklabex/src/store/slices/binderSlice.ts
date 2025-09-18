import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Binder, BinderPage, BinderTemplate, BinderState, CollectionCard } from '../../types/global';
import { binderService } from '../../services/binderService';

const initialState: BinderState = {
  binders: {},
  activeBinderId: null,
  templates: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserBinders = createAsyncThunk(
  'binder/fetchUserBinders',
  async (userId: string, { rejectWithValue }) => {
    try {
      const binders = await binderService.getUserBinders(userId);
      return binders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch binders');
    }
  }
);

export const createBinder = createAsyncThunk(
  'binder/createBinder',
  async ({ name, description, templateId }: { name: string; description?: string; templateId: string }, { rejectWithValue }) => {
    try {
      const binder = await binderService.createBinder({ name, description, templateId });
      return binder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create binder');
    }
  }
);

export const updateBinder = createAsyncThunk(
  'binder/updateBinder',
  async ({ binderId, updates }: { binderId: string; updates: Partial<Binder> }, { rejectWithValue }) => {
    try {
      const binder = await binderService.updateBinder(binderId, updates);
      return binder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update binder');
    }
  }
);

export const addCardToBinder = createAsyncThunk(
  'binder/addCardToBinder',
  async ({ 
    binderId, 
    pageNumber, 
    slotIndex, 
    card 
  }: { 
    binderId: string; 
    pageNumber: number; 
    slotIndex: number; 
    card: CollectionCard 
  }, { rejectWithValue }) => {
    try {
      const updatedBinder = await binderService.addCardToBinder(binderId, pageNumber, slotIndex, card);
      return updatedBinder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add card to binder');
    }
  }
);

export const removeCardFromBinder = createAsyncThunk(
  'binder/removeCardFromBinder',
  async ({ 
    binderId, 
    pageNumber, 
    slotIndex 
  }: { 
    binderId: string; 
    pageNumber: number; 
    slotIndex: number 
  }, { rejectWithValue }) => {
    try {
      const updatedBinder = await binderService.removeCardFromBinder(binderId, pageNumber, slotIndex);
      return updatedBinder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove card from binder');
    }
  }
);

export const organizeBinder = createAsyncThunk(
  'binder/organizeBinder',
  async ({ binderId, criteria }: { binderId: string; criteria: string }, { rejectWithValue }) => {
    try {
      const organizedBinder = await binderService.organizeBinder(binderId, criteria);
      return organizedBinder;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to organize binder');
    }
  }
);

export const fetchBinderTemplates = createAsyncThunk(
  'binder/fetchBinderTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const templates = await binderService.getBinderTemplates();
      return templates;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch binder templates');
    }
  }
);

const binderSlice = createSlice({
  name: 'binder',
  initialState,
  reducers: {
    setActiveBinder: (state, action: PayloadAction<string | null>) => {
      state.activeBinderId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    optimisticMoveCard: (state, action: PayloadAction<{
      binderId: string;
      fromPage: number;
      fromSlot: number;
      toPage: number;
      toSlot: number;
    }>) => {
      const { binderId, fromPage, fromSlot, toPage, toSlot } = action.payload;
      const binder = state.binders[binderId];
      
      if (binder) {
        const fromPageObj = binder.pages.find(p => p.pageNumber === fromPage);
        const toPageObj = binder.pages.find(p => p.pageNumber === toPage);
        
        if (fromPageObj && toPageObj) {
          const card = fromPageObj.cards[fromSlot];
          fromPageObj.cards[fromSlot] = null;
          toPageObj.cards[toSlot] = card;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Binders
    builder
      .addCase(fetchUserBinders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBinders.fulfilled, (state, action) => {
        state.loading = false;
        state.binders = {};
        action.payload.forEach(binder => {
          state.binders[binder.id] = binder;
        });
        state.error = null;
      })
      .addCase(fetchUserBinders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Binder
    builder
      .addCase(createBinder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBinder.fulfilled, (state, action) => {
        state.loading = false;
        state.binders[action.payload.id] = action.payload;
        state.activeBinderId = action.payload.id;
        state.error = null;
      })
      .addCase(createBinder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Binder
    builder
      .addCase(updateBinder.fulfilled, (state, action) => {
        state.binders[action.payload.id] = action.payload;
      });

    // Add Card to Binder
    builder
      .addCase(addCardToBinder.fulfilled, (state, action) => {
        state.binders[action.payload.id] = action.payload;
      });

    // Remove Card from Binder
    builder
      .addCase(removeCardFromBinder.fulfilled, (state, action) => {
        state.binders[action.payload.id] = action.payload;
      });

    // Organize Binder
    builder
      .addCase(organizeBinder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(organizeBinder.fulfilled, (state, action) => {
        state.loading = false;
        state.binders[action.payload.id] = action.payload;
        state.error = null;
      })
      .addCase(organizeBinder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Binder Templates
    builder
      .addCase(fetchBinderTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      });
  },
});

export const { 
  setActiveBinder, 
  clearError, 
  optimisticMoveCard 
} = binderSlice.actions;

export default binderSlice.reducer;