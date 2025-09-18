import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Achievement, AchievementsState } from '../../types/global';
import { achievementsService } from '../../services/achievementsService';

const initialState: AchievementsState = {
  achievements: {},
  unlockedCount: 0,
  totalCount: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserAchievements = createAsyncThunk(
  'achievements/fetchUserAchievements',
  async (userId: string, { rejectWithValue }) => {
    try {
      const achievements = await achievementsService.getUserAchievements(userId);
      return achievements;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch achievements');
    }
  }
);

export const unlockAchievement = createAsyncThunk(
  'achievements/unlockAchievement',
  async ({ userId, achievementId }: { userId: string; achievementId: string }, { rejectWithValue }) => {
    try {
      const achievement = await achievementsService.unlockAchievement(userId, achievementId);
      return achievement;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unlock achievement');
    }
  }
);

export const checkAchievementProgress = createAsyncThunk(
  'achievements/checkAchievementProgress',
  async (userId: string, { rejectWithValue }) => {
    try {
      const progress = await achievementsService.checkAllAchievementProgress(userId);
      return progress;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check achievement progress');
    }
  }
);

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateAchievementProgress: (state, action: PayloadAction<{ achievementId: string; progress: number }>) => {
      const { achievementId, progress } = action.payload;
      if (state.achievements[achievementId]) {
        state.achievements[achievementId].progress = progress;
      }
    },
    markAchievementUnlocked: (state, action: PayloadAction<string>) => {
      const achievementId = action.payload;
      if (state.achievements[achievementId]) {
        state.achievements[achievementId].unlockedAt = new Date().toISOString();
        state.unlockedCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Achievements
    builder
      .addCase(fetchUserAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.achievements = {};
        let unlockedCount = 0;
        
        action.payload.forEach(achievement => {
          state.achievements[achievement.id] = achievement;
          if (achievement.unlockedAt) {
            unlockedCount += 1;
          }
        });
        
        state.unlockedCount = unlockedCount;
        state.totalCount = action.payload.length;
        state.error = null;
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Unlock Achievement
    builder
      .addCase(unlockAchievement.fulfilled, (state, action) => {
        state.achievements[action.payload.id] = action.payload;
        state.unlockedCount += 1;
      });

    // Check Achievement Progress
    builder
      .addCase(checkAchievementProgress.fulfilled, (state, action) => {
        action.payload.forEach(({ achievementId, progress }) => {
          if (state.achievements[achievementId]) {
            state.achievements[achievementId].progress = progress;
          }
        });
      });
  },
});

export const { 
  clearError, 
  updateAchievementProgress, 
  markAchievementUnlocked 
} = achievementsSlice.actions;

export default achievementsSlice.reducer;