import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupListeners } from '@reduxjs/toolkit/query';
import { Platform } from 'react-native';

// Import all slice reducers
import authReducer from './slices/authSlice';
import cardsReducer from './slices/cardsSlice';
import collectionsReducer from './slices/collectionsSlice';
import searchReducer from './slices/searchSlice';
import scannerReducer from './slices/scannerSlice';
import marketReducer from './slices/marketSlice';
import binderReducer from './slices/binderSlice';
import achievementsReducer from './slices/achievementsSlice';
import newsReducer from './slices/newsSlice';
import uiReducer from './slices/uiSlice';

// Import API services

// Cross-platform storage configuration
const getStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use a simple localStorage adapter
    return {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Silently fail
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Silently fail
        }
      },
    };
  }
  return AsyncStorage;
};

const persistConfig = {
  key: 'root',
  storage: getStorage(),
  whitelist: ['auth', 'collections', 'achievements', 'ui'], // Only persist these reducers
  blacklist: ['cards', 'search', 'scanner', 'market', 'news'], // Don't persist these (always fetch fresh)
};

const rootReducer = combineReducers({
  auth: authReducer,
  cards: cardsReducer,
  collections: collectionsReducer,
  search: searchReducer,
  scanner: scannerReducer,
  market: marketReducer,
  binder: binderReducer,
  achievements: achievementsReducer,
  news: newsReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Setup listeners for refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;