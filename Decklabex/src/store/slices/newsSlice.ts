import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NewsItem, NewsState, NewsCategory } from '../../types/global';
import { newsService } from '../../services/newsService';

const initialState: NewsState = {
  articles: [],
  categories: ['releases', 'tournaments', 'market', 'community', 'rules', 'spoilers'],
  loading: false,
  error: null,
};

// Async thunks
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async (category?: NewsCategory, { rejectWithValue }) => {
    try {
      const articles = await newsService.getNews(category);
      return articles;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch news');
    }
  }
);

export const fetchNewsFromSource = createAsyncThunk(
  'news/fetchNewsFromSource',
  async (source: string, { rejectWithValue }) => {
    try {
      const articles = await newsService.getNewsBySource(source);
      return articles;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch news from source');
    }
  }
);

export const refreshNews = createAsyncThunk(
  'news/refreshNews',
  async (_, { rejectWithValue }) => {
    try {
      const articles = await newsService.refreshAllNews();
      return articles;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh news');
    }
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addArticle: (state, action: PayloadAction<NewsItem>) => {
      state.articles.unshift(action.payload);
    },
    markArticleRead: (state, action: PayloadAction<string>) => {
      const article = state.articles.find(a => a.id === action.payload);
      if (article) {
        // Could add a 'read' property to NewsItem type
      }
    },
    filterByCategory: (state, action: PayloadAction<NewsCategory | null>) => {
      // This would be handled in the component, but we can store the active filter
    },
  },
  extraReducers: (builder) => {
    // Fetch News
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
        state.error = null;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch News from Source
    builder
      .addCase(fetchNewsFromSource.fulfilled, (state, action) => {
        // Merge articles from specific source
        const newArticles = action.payload.filter(
          newArticle => !state.articles.some(existing => existing.id === newArticle.id)
        );
        state.articles.push(...newArticles);
      });

    // Refresh News
    builder
      .addCase(refreshNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
        state.error = null;
      })
      .addCase(refreshNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  addArticle, 
  markArticleRead, 
  filterByCategory 
} = newsSlice.actions;

export default newsSlice.reducer;