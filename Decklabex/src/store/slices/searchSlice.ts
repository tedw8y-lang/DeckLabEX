import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Card, SearchFilters, SearchState, SearchHistory } from '../../types/global';
import { pokemonTcgService } from '../../services/pokemonTcgService';
import { searchAnalyticsService } from '../../services/searchAnalyticsService';

const initialState: SearchState = {
  query: '',
  filters: {},
  results: [],
  history: [],
  loading: false,
  error: null,
};

// Async thunks
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async ({ query, filters }: { query: string; filters: SearchFilters }, { rejectWithValue }) => {
    try {
      const searchFilters = { ...filters };
      if (query.trim()) {
        searchFilters.name = query.trim();
      }

      const response = await pokemonTcgService.searchCards(searchFilters);
      
      // Track search analytics
      await searchAnalyticsService.trackSearch(query, searchFilters, response.totalCount);
      
      return {
        results: response.data,
        query,
        filters: searchFilters,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Search failed');
    }
  }
);

export const getPopularCards = createAsyncThunk(
  'search/getPopularCards',
  async (_, { rejectWithValue }) => {
    try {
      const popularCards = await searchAnalyticsService.getPopularCards();
      return popularCards;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch popular cards');
    }
  }
);

export const getSearchHistory = createAsyncThunk(
  'search/getSearchHistory',
  async (userId: string, { rejectWithValue }) => {
    try {
      const history = await searchAnalyticsService.getUserSearchHistory(userId);
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch search history');
    }
  }
);

export const getPredictiveResults = createAsyncThunk(
  'search/getPredictiveResults',
  async (query: string, { rejectWithValue }) => {
    try {
      const results = await pokemonTcgService.searchCardsByName(query, 5);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch predictive results');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.query = '';
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    addToHistory: (state, action: PayloadAction<SearchHistory>) => {
      // Add to beginning and limit to 50 items
      state.history.unshift(action.payload);
      state.history = state.history.slice(0, 50);
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    // Perform Search
    builder
      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results;
        state.query = action.payload.query;
        state.filters = action.payload.filters;
        state.error = null;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Popular Cards
    builder
      .addCase(getPopularCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPopularCards.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
        state.error = null;
      })
      .addCase(getPopularCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Search History
    builder
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });

    // Get Predictive Results
    builder
      .addCase(getPredictiveResults.fulfilled, (state, action) => {
        // Store predictive results separately or update results
        state.results = action.payload;
      });
  },
});

export const { 
  setQuery, 
  setFilters, 
  clearResults, 
  clearError, 
  addToHistory, 
  clearHistory 
} = searchSlice.actions;

export default searchSlice.reducer;