import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MarketData, MarketState, PriceAlert, Card } from '../../types/global';
import { marketService } from '../../services/marketService';
import { ebayService } from '../../services/ebayService';

const initialState: MarketState = {
  marketData: {},
  priceAlerts: [],
  trending: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async (cardId: string, { rejectWithValue }) => {
    try {
      const marketData = await marketService.getCardMarketData(cardId);
      return { cardId, marketData };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch market data');
    }
  }
);

export const fetchEbayListings = createAsyncThunk(
  'market/fetchEbayListings',
  async ({ cardName, isGraded }: { cardName: string; isGraded: boolean }, { rejectWithValue }) => {
    try {
      const listings = await ebayService.searchCardListings(cardName, isGraded);
      return listings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch eBay listings');
    }
  }
);

export const fetchTrendingCards = createAsyncThunk(
  'market/fetchTrendingCards',
  async (_, { rejectWithValue }) => {
    try {
      const trending = await marketService.getTrendingCards();
      return trending;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trending cards');
    }
  }
);

export const createPriceAlert = createAsyncThunk(
  'market/createPriceAlert',
  async (alert: Omit<PriceAlert, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const newAlert = await marketService.createPriceAlert(alert);
      return newAlert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create price alert');
    }
  }
);

export const fetchUserPriceAlerts = createAsyncThunk(
  'market/fetchUserPriceAlerts',
  async (userId: string, { rejectWithValue }) => {
    try {
      const alerts = await marketService.getUserPriceAlerts(userId);
      return alerts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch price alerts');
    }
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateMarketData: (state, action: PayloadAction<{ cardId: string; marketData: MarketData }>) => {
      const { cardId, marketData } = action.payload;
      state.marketData[cardId] = marketData;
    },
    addPriceAlert: (state, action: PayloadAction<PriceAlert>) => {
      state.priceAlerts.push(action.payload);
    },
    removePriceAlert: (state, action: PayloadAction<string>) => {
      state.priceAlerts = state.priceAlerts.filter(alert => alert.id !== action.payload);
    },
    togglePriceAlert: (state, action: PayloadAction<string>) => {
      const alert = state.priceAlerts.find(alert => alert.id === action.payload);
      if (alert) {
        alert.isActive = !alert.isActive;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Market Data
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        const { cardId, marketData } = action.payload;
        state.marketData[cardId] = marketData;
        state.error = null;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch eBay Listings
    builder
      .addCase(fetchEbayListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEbayListings.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchEbayListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Trending Cards
    builder
      .addCase(fetchTrendingCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingCards.fulfilled, (state, action) => {
        state.loading = false;
        state.trending = action.payload;
        state.error = null;
      })
      .addCase(fetchTrendingCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Price Alert
    builder
      .addCase(createPriceAlert.fulfilled, (state, action) => {
        state.priceAlerts.push(action.payload);
      });

    // Fetch User Price Alerts
    builder
      .addCase(fetchUserPriceAlerts.fulfilled, (state, action) => {
        state.priceAlerts = action.payload;
      });
  },
});

export const { 
  clearError, 
  updateMarketData, 
  addPriceAlert, 
  removePriceAlert, 
  togglePriceAlert 
} = marketSlice.actions;

export default marketSlice.reducer;