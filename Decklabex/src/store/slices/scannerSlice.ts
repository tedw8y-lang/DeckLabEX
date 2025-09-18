import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ScanSession, ScannedCard, ScannerState, GradingReport } from '../../types/global';
import { scannerService } from '../../services/scannerService';
import { gradingService } from '../../services/gradingService';

const initialState: ScannerState = {
  isActive: false,
  currentSession: null,
  scannedCards: [],
  isProcessing: false,
  error: null,
};

// Async thunks
export const startScanSession = createAsyncThunk(
  'scanner/startScanSession',
  async (userId: string, { rejectWithValue }) => {
    try {
      const session = await scannerService.createScanSession(userId);
      return session;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start scan session');
    }
  }
);

export const scanCard = createAsyncThunk(
  'scanner/scanCard',
  async ({ imageUri, sessionId }: { imageUri: string; sessionId: string }, { rejectWithValue }) => {
    try {
      const scannedCard = await scannerService.processCardImage(imageUri, sessionId);
      return scannedCard;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to scan card');
    }
  }
);

export const completeScanSession = createAsyncThunk(
  'scanner/completeScanSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const completedSession = await scannerService.completeScanSession(sessionId);
      return completedSession;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete scan session');
    }
  }
);

export const generateGradingReport = createAsyncThunk(
  'scanner/generateGradingReport',
  async ({ cardId, images }: { cardId: string; images: string[] }, { rejectWithValue }) => {
    try {
      const report = await gradingService.generateGradingReport(cardId, images);
      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate grading report');
    }
  }
);

const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    addScannedCard: (state, action: PayloadAction<ScannedCard>) => {
      state.scannedCards.push(action.payload);
      if (state.currentSession) {
        state.currentSession.cards.push(action.payload);
        state.currentSession.totalValue += action.payload.estimatedValue;
      }
    },
    removeScannedCard: (state, action: PayloadAction<string>) => {
      const cardIndex = state.scannedCards.findIndex(card => card.id === action.payload);
      if (cardIndex !== -1) {
        const removedCard = state.scannedCards[cardIndex];
        state.scannedCards.splice(cardIndex, 1);
        
        if (state.currentSession) {
          const sessionCardIndex = state.currentSession.cards.findIndex(card => card.id === action.payload);
          if (sessionCardIndex !== -1) {
            state.currentSession.cards.splice(sessionCardIndex, 1);
            state.currentSession.totalValue -= removedCard.estimatedValue;
          }
        }
      }
    },
    clearScannedCards: (state) => {
      state.scannedCards = [];
      if (state.currentSession) {
        state.currentSession.cards = [];
        state.currentSession.totalValue = 0;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Start Scan Session
    builder
      .addCase(startScanSession.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(startScanSession.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentSession = action.payload;
        state.isActive = true;
        state.scannedCards = [];
        state.error = null;
      })
      .addCase(startScanSession.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });

    // Scan Card
    builder
      .addCase(scanCard.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(scanCard.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.scannedCards.push(action.payload);
        if (state.currentSession) {
          state.currentSession.cards.push(action.payload);
          state.currentSession.totalValue += action.payload.estimatedValue;
        }
        state.error = null;
      })
      .addCase(scanCard.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });

    // Complete Scan Session
    builder
      .addCase(completeScanSession.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(completeScanSession.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentSession = action.payload;
        state.isActive = false;
        state.error = null;
      })
      .addCase(completeScanSession.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });

    // Generate Grading Report
    builder
      .addCase(generateGradingReport.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(generateGradingReport.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.error = null;
      })
      .addCase(generateGradingReport.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setActive, 
  setProcessing, 
  addScannedCard, 
  removeScannedCard, 
  clearScannedCards, 
  clearError 
} = scannerSlice.actions;

export default scannerSlice.reducer;