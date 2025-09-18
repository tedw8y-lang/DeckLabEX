export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  isPremium: boolean;
  premiumTier?: 'pro' | 'elite';
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  scanning: ScanningSettings;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  marketTrends: boolean;
  newSets: boolean;
  socialUpdates: boolean;
  achievements: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  collectionVisibility: 'public' | 'friends' | 'private';
  showRealNames: boolean;
  allowFriendRequests: boolean;
}

export interface ScanningSettings {
  autoScan: boolean;
  scanDelay: number;
  qualityThreshold: number;
  saveScannedImages: boolean;
}

export interface UserStats {
  totalCards: number;
  totalValue: number;
  collectionsCount: number;
  achievementsUnlocked: number;
  scanSessionsCompleted: number;
  daysActive: number;
}

export interface Card {
  id: string;
  name: string;
  set: CardSet;
  setNumber: string;
  rarity: string;
  type: string;
  subtype?: string;
  hp?: number;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  attacks?: Attack[];
  weaknesses?: Weakness[];
  resistances?: Resistance[];
  abilities?: Ability[];
  rules?: string[];
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  artist: string;
  images: CardImages;
  tcgplayer?: TCGPlayerData;
  cardmarket?: CardMarketData;
  prices: PriceData;
  legalities: Legalities;
  evolvesFrom?: string;
  evolvesTo?: string[];
  evolutionStage?: 'Basic' | 'Stage 1' | 'Stage 2' | 'BREAK' | 'GX' | 'V' | 'VMAX' | 'VSTAR';
}

export interface CardSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities: Legalities;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: SetImages;
  symbol?: string;
}

export interface SetImages {
  symbol: string;
  logo: string;
}

export interface CardImages {
  small: string;
  large: string;
}

export interface Attack {
  cost: string[];
  name: string;
  text: string;
  damage: string;
  convertedEnergyCost: number;
}

export interface Weakness {
  type: string;
  value: string;
}

export interface Resistance {
  type: string;
  value: string;
}

export interface Ability {
  name: string;
  text: string;
  type: string;
}

export interface PriceData {
  low?: number;
  mid?: number;
  high?: number;
  market?: number;
  directLow?: number;
  lastUpdated: string;
}

export interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices: {
    normal?: PriceData;
    holofoil?: PriceData;
    reverseHolofoil?: PriceData;
    unlimited?: PriceData;
    firstEdition?: PriceData;
  };
}

export interface CardMarketData {
  url: string;
  updatedAt: string;
  prices: PriceData;
}

export interface Legalities {
  unlimited?: string;
  standard?: string;
  expanded?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  tags: string[];
  cards: CollectionCard[];
  createdAt: string;
  updatedAt: string;
  stats: CollectionStats;
}

export interface CollectionCard {
  cardId: string;
  card: Card;
  quantity: number;
  condition: CardCondition;
  language: string;
  isHolo: boolean;
  isFirstEdition: boolean;
  isGraded: boolean;
  gradingCompany?: GradingCompany;
  grade?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  images?: string[];
  addedAt: string;
}

export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  totalValue: number;
  averageValue: number;
  completionPercentage: number;
  topValueCard?: CollectionCard;
  recentlyAdded: CollectionCard[];
}

export type CardCondition = 
  | 'Mint (M)'
  | 'Near Mint (NM)'
  | 'Lightly Played (LP)'
  | 'Moderately Played (MP)'
  | 'Heavily Played (HP)'
  | 'Damaged (D)';

export type GradingCompany = 'PSA' | 'BGS' | 'CGC' | 'SGC' | 'TAG' | 'AGS';

export interface Binder {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  pages: BinderPage[];
  createdAt: string;
  updatedAt: string;
  template: BinderTemplate;
}

export interface BinderPage {
  id: string;
  pageNumber: number;
  cards: (CollectionCard | null)[];
  notes?: string;
}

export interface BinderTemplate {
  id: string;
  name: string;
  slotsPerPage: number;
  layout: 'grid' | 'list';
  dimensions: {
    rows: number;
    columns: number;
  };
}

export interface SearchFilters {
  name?: string;
  set?: string;
  rarity?: string[];
  type?: string[];
  subtype?: string[];
  artist?: string;
  hp?: {
    min?: number;
    max?: number;
  };
  price?: {
    min?: number;
    max?: number;
  };
  releaseDate?: {
    start?: string;
    end?: string;
  };
  language?: string[];
  condition?: CardCondition[];
  isGraded?: boolean;
  gradingCompany?: GradingCompany[];
  grade?: {
    min?: number;
    max?: number;
  };
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  results: number;
  timestamp: string;
  userId: string;
}

export interface MarketData {
  cardId: string;
  prices: {
    tcgplayer?: PriceData;
    cardmarket?: PriceData;
    ebay?: PriceData;
  };
  priceHistory: PriceHistoryPoint[];
  populationReports: PopulationReport[];
  lastUpdated: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  source: string;
  condition?: CardCondition;
}

export interface PopulationReport {
  gradingCompany: GradingCompany;
  grade: number;
  population: number;
  lastUpdated: string;
}

export interface ScanSession {
  id: string;
  userId: string;
  cards: ScannedCard[];
  totalValue: number;
  startedAt: string;
  completedAt?: string;
  isActive: boolean;
}

export interface ScannedCard {
  id: string;
  card: Card;
  confidence: number;
  image: string;
  estimatedCondition: CardCondition;
  estimatedValue: number;
  timestamp: string;
}

export interface GradingReport {
  id: string;
  cardId: string;
  images: GradingImages;
  analysis: GradingAnalysis;
  predictions: GradingPrediction[];
  confidence: number;
  timestamp: string;
}

export interface GradingImages {
  front: string;
  back: string;
  corners: string[];
  edges: string[];
  surface: string[];
}

export interface GradingAnalysis {
  centering: {
    score: number;
    leftRight: number;
    topBottom: number;
    notes: string;
  };
  corners: {
    score: number;
    damage: CornerDamage[];
    notes: string;
  };
  edges: {
    score: number;
    roughness: number;
    whitening: number;
    notes: string;
  };
  surface: {
    score: number;
    scratches: SurfaceDefect[];
    stains: SurfaceDefect[];
    printDefects: SurfaceDefect[];
    notes: string;
  };
}

export interface CornerDamage {
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  severity: 'minor' | 'moderate' | 'severe';
  type: 'rounding' | 'whitening' | 'cracking';
}

export interface SurfaceDefect {
  type: 'scratch' | 'stain' | 'print-line' | 'indent' | 'spot';
  severity: 'minor' | 'moderate' | 'severe';
  location: {
    x: number;
    y: number;
  };
  size: number;
}

export interface GradingPrediction {
  company: GradingCompany;
  grade: number;
  confidence: number;
  breakdown: {
    centering: number;
    corners: number;
    edges: number;
    surface: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  reward: AchievementReward;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export type AchievementCategory = 
  | 'collector'
  | 'scanner'
  | 'trader'
  | 'social'
  | 'competitive'
  | 'explorer';

export interface AchievementRequirement {
  type: string;
  value: number;
  description: string;
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'theme' | 'feature';
  value: string;
  description: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  category: NewsCategory;
  tags: string[];
  url: string;
}

export type NewsCategory = 
  | 'releases'
  | 'tournaments'
  | 'market'
  | 'community'
  | 'rules'
  | 'spoilers';

export interface TradeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromCards: CollectionCard[];
  toCards: CollectionCard[];
  message?: string;
  status: TradeStatus;
  createdAt: string;
  expiresAt: string;
}

export type TradeStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed';

export interface DeckList {
  id: string;
  name: string;
  format: string;
  cards: DeckCard[];
  ownerId: string;
  isPublic: boolean;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  stats?: DeckStats;
}

export interface DeckCard {
  cardId: string;
  card: Card;
  quantity: number;
  category: 'pokemon' | 'trainer' | 'energy';
}

export interface DeckStats {
  winRate?: number;
  gamesPlayed?: number;
  avgGameLength?: number;
  popularityRank?: number;
  metaShare?: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: string;
  date: string;
  location: string;
  players: number;
  decks: DeckList[];
  results: TournamentResult[];
}

export interface TournamentResult {
  placement: number;
  playerName: string;
  deck: DeckList;
  record: string;
}

export interface APIResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code: number;
  timestamp: string;
}

// Redux State Types
export interface RootState {
  auth: AuthState;
  cards: CardsState;
  collections: CollectionsState;
  search: SearchState;
  scanner: ScannerState;
  market: MarketState;
  binder: BinderState;
  achievements: AchievementsState;
  news: NewsState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface CardsState {
  cards: { [id: string]: Card };
  sets: { [id: string]: CardSet };
  loading: boolean;
  error: string | null;
}

export interface CollectionsState {
  collections: { [id: string]: Collection };
  activeCollectionId: string | null;
  loading: boolean;
  error: string | null;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: Card[];
  history: SearchHistory[];
  loading: boolean;
  error: string | null;
}

export interface ScannerState {
  isActive: boolean;
  currentSession: ScanSession | null;
  scannedCards: ScannedCard[];
  isProcessing: boolean;
  error: string | null;
}

export interface MarketState {
  marketData: { [cardId: string]: MarketData };
  priceAlerts: PriceAlert[];
  trending: Card[];
  loading: boolean;
  error: string | null;
}

export interface BinderState {
  binders: { [id: string]: Binder };
  activeBinderId: string | null;
  templates: BinderTemplate[];
  loading: boolean;
  error: string | null;
}

export interface AchievementsState {
  achievements: { [id: string]: Achievement };
  unlockedCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export interface NewsState {
  articles: NewsItem[];
  categories: NewsCategory[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  activeTab: string;
  notifications: UINotification[];
}

export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  duration?: number;
}

export interface PriceAlert {
  id: string;
  cardId: string;
  userId: string;
  type: 'above' | 'below' | 'change';
  threshold: number;
  isActive: boolean;
  createdAt: string;
}