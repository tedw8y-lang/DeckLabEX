import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { MarketData, PriceAlert, Card, PriceHistoryPoint } from '../types/global';
import { tcgPlayerService } from './tcgPlayerService';
import { cardMarketService } from './cardMarketService';
import { ebayService } from './ebayService';

export class MarketService {
  private getMarketDataRef() {
    return collection(firestore, 'marketData');
  }

  private getPriceAlertsRef() {
    return collection(firestore, 'priceAlerts');
  }

  async getCardMarketData(cardId: string): Promise<MarketData> {
    try {
      // Fetch data from multiple sources
      const [tcgPlayerData, cardMarketData, ebayData] = await Promise.allSettled([
        tcgPlayerService.getCardPrices(cardId),
        cardMarketService.getCardPrices(cardId),
        ebayService.getCardPrices(cardId),
      ]);

      const marketData: MarketData = {
        cardId,
        prices: {
          tcgplayer: tcgPlayerData.status === 'fulfilled' ? tcgPlayerData.value : undefined,
          cardmarket: cardMarketData.status === 'fulfilled' ? cardMarketData.value : undefined,
          ebay: ebayData.status === 'fulfilled' ? ebayData.value : undefined,
        },
        priceHistory: await this.getPriceHistory(cardId),
        populationReports: await this.getPopulationReports(cardId),
        lastUpdated: new Date().toISOString(),
      };

      // Cache the market data
      await this.cacheMarketData(marketData);

      return marketData;
    } catch (error) {
      console.error('Error fetching card market data:', error);
      throw error;
    }
  }

  async getTrendingCards(): Promise<Card[]> {
    try {
      // This would typically analyze price changes and volume
      // For now, we'll return some popular cards
      const trendingCardIds = [
        'base1-4', // Charizard
        'base1-25', // Pikachu
        'base1-150', // Mewtwo
        'neo1-249', // Lugia
        'ex12-97', // Rayquaza
      ];

      // In production, this would fetch actual trending data
      return [];
    } catch (error) {
      console.error('Error fetching trending cards:', error);
      return [];
    }
  }

  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<PriceAlert> {
    try {
      const newAlert: Omit<PriceAlert, 'id'> = {
        ...alert,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(this.getPriceAlertsRef(), newAlert);
      
      return {
        id: docRef.id,
        ...newAlert,
      };
    } catch (error) {
      console.error('Error creating price alert:', error);
      throw error;
    }
  }

  async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const q = query(
        this.getPriceAlertsRef(),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const alerts: PriceAlert[] = [];

      querySnapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() } as PriceAlert);
      });

      return alerts;
    } catch (error) {
      console.error('Error fetching user price alerts:', error);
      return [];
    }
  }

  private async getPriceHistory(cardId: string): Promise<PriceHistoryPoint[]> {
    try {
      // In production, this would fetch historical price data
      // For now, generate sample data
      const history: PriceHistoryPoint[] = [];
      const basePrice = 50 + Math.random() * 200;
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const priceVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const price = basePrice * (1 + priceVariation);
        
        history.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(price * 100) / 100,
          source: 'tcgplayer',
        });
      }

      return history;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  private async getPopulationReports(cardId: string) {
    try {
      // In production, this would fetch from PSA, BGS, CGC APIs
      // For now, generate sample population data
      return [
        {
          gradingCompany: 'PSA' as const,
          grade: 10,
          population: Math.floor(Math.random() * 1000),
          lastUpdated: new Date().toISOString(),
        },
        {
          gradingCompany: 'PSA' as const,
          grade: 9,
          population: Math.floor(Math.random() * 2000),
          lastUpdated: new Date().toISOString(),
        },
        {
          gradingCompany: 'BGS' as const,
          grade: 10,
          population: Math.floor(Math.random() * 500),
          lastUpdated: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error('Error fetching population reports:', error);
      return [];
    }
  }

  private async cacheMarketData(marketData: MarketData): Promise<void> {
    try {
      await addDoc(this.getMarketDataRef(), marketData);
    } catch (error) {
      console.error('Error caching market data:', error);
    }
  }
}

export const marketService = new MarketService();