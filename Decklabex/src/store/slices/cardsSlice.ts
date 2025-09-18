import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Card, CardSet, CardsState, SearchFilters } from '../../types/global';
import { pokemonTcgService } from '../../services/pokemonTcgService';

const initialState: CardsState = {
  cards: {},
  sets: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchCards = createAsyncThunk(
  'cards/fetchCards',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      const response = await pokemonTcgService.searchCards(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cards');
    }
  }
);

export const fetchCardById = createAsyncThunk(
  'cards/fetchCardById',
  async (cardId: string, { rejectWithValue }) => {
    try {
      const card = await pokemonTcgService.getCardById(cardId);
      return card;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch card');
    }
  }
);

export const fetchSets = createAsyncThunk(
  'cards/fetchSets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pokemonTcgService.getAllSets();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sets');
    }
  }
);

export const fetchSetById = createAsyncThunk(
  'cards/fetchSetById',
  async (setId: string, { rejectWithValue }) => {
    try {
      const set = await pokemonTcgService.getSetById(setId);
      return set;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch set');
    }
  }
);

export const fetchCardsInSet = createAsyncThunk(
  'cards/fetchCardsInSet',
  async (setId: string, { rejectWithValue }) => {
    try {
      const response = await pokemonTcgService.getCardsInSet(setId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cards in set');
    }
  }
);

const cardsSlice = createSlice({
  name: 'cards',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addCard: (state, action: PayloadAction<Card>) => {
      state.cards[action.payload.id] = action.payload;
    },
    addCards: (state, action: PayloadAction<Card[]>) => {
      action.payload.forEach(card => {
        state.cards[card.id] = card;
      });
    },
    addSet: (state, action: PayloadAction<CardSet>) => {
      state.sets[action.payload.id] = action.payload;
    },
    addSets: (state, action: PayloadAction<CardSet[]>) => {
      action.payload.forEach(set => {
        state.sets[set.id] = set;
      });
    },
    clearCards: (state) => {
      state.cards = {};
    },
    clearSets: (state) => {
      state.sets = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Cards
    builder
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(card => {
          state.cards[card.id] = card;
        });
        state.error = null;
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Card by ID
    builder
      .addCase(fetchCardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCardById.fulfilled, (state, action) => {
        state.loading = false;
        state.cards[action.payload.id] = action.payload;
        state.error = null;
      })
      .addCase(fetchCardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Sets
    builder
      .addCase(fetchSets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSets.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(set => {
          state.sets[set.id] = set;
        });
        state.error = null;
      })
      .addCase(fetchSets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Set by ID
    builder
      .addCase(fetchSetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSetById.fulfilled, (state, action) => {
        state.loading = false;
        state.sets[action.payload.id] = action.payload;
        state.error = null;
      })
      .addCase(fetchSetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Cards in Set
    builder
      .addCase(fetchCardsInSet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCardsInSet.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(card => {
          state.cards[card.id] = card;
        });
        state.error = null;
      })
      .addCase(fetchCardsInSet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  addCard, 
  addCards, 
  addSet, 
  addSets, 
  clearCards, 
  clearSets 
} = cardsSlice.actions;

export default cardsSlice.reducer;