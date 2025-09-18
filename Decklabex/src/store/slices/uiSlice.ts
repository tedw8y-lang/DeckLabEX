import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, UINotification } from '../../types/global';

const initialState: UIState = {
  theme: 'dark',
  isLoading: false,
  activeTab: 'search',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UINotification, 'id' | 'timestamp'>>) => {
      const notification: UINotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { 
  setTheme, 
  setLoading, 
  setActiveTab, 
  addNotification, 
  removeNotification, 
  clearNotifications 
} = uiSlice.actions;

export default uiSlice.reducer;