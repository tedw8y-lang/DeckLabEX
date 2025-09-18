import { PriceData } from '../types/global';
import { pokemonTcgService } from './pokemonTcgService';

export class CardMarketService {
  // CardMarket API no longer accepts new applications
  // Using Pokemon TCG API which includes real CardMarket pricing data in EUR
  
  async getCardPrices(cardId: string): Promise<PriceData> {
    try {
      console.log('Fetching CardMarket prices for card:', cardId);
      
      // Get card data from Pokemon TCG API (includes CardMarket pricing)
      const card = await pokemonTcgService.getCardById(cardId);
      
      if (!card.cardmarket?.prices) {
        console.warn(`No CardMarket pricing data available for card: ${cardId}`);
        // Return minimal pricing data if CardMarket data is not available
        return {
          low: 0,
          mid: 0,
          high: 0,
          market: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      // Map CardMarket pricing fields to our PriceData interface
      const cardmarketPrices = card.cardmarket.prices;
      const priceData: PriceData = {
        low: cardmarketPrices.lowPrice || cardmarketPrices.lowPriceExPlus || 0,
        mid: cardmarketPrices.suggestedPrice || cardmarketPrices.trendPrice || 0,
        high: cardmarketPrices.trendPrice || cardmarketPrices.suggestedPrice || 0,
        market: cardmarketPrices.averageSellPrice || cardmarketPrices.trendPrice || 0,
        lastUpdated: card.cardmarket.updatedAt || new Date().toISOString(),
      };

      console.log('CardMarket prices retrieved successfully:', {
        cardId,
        prices: priceData,
        currency: 'EUR'
      });

      return priceData;
    } catch (error) {
      console.error('Error fetching CardMarket prices:', error);
      // Return fallback pricing instead of throwing to prevent app crashes
      return {
        low: 0,
        mid: 0, 
        high: 0,
        market: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async searchProducts(cardName: string): Promise<any[]> {
    try {
      console.log('Searching CardMarket products for:', cardName);
      
      // Use Pokemon TCG API to search for cards (includes CardMarket data)
      const searchResults = await pokemonTcgService.searchCardsByName(cardName, 20);
      
      // Filter results to only include cards with CardMarket data
      const productsWithCardMarket = searchResults
        .filter(card => card.cardmarket?.prices)
        .map(card => ({
          id: card.id,
          name: card.name,
          set: card.set.name,
          number: card.number, // Fixed: was card.setNumber
          rarity: card.rarity,
          cardmarketUrl: card.cardmarket?.url,
          prices: card.cardmarket?.prices,
          imageUrl: card.images.small,
        }));
      
      console.log(`Found ${productsWithCardMarket.length} products with CardMarket data`);
      return productsWithCardMarket;
    } catch (error) {
      console.error('Error searching CardMarket products:', error);
      return [];
    }
  }

  async getProductPrices(productId: string): Promise<PriceData> {
    try {
      console.log('Getting CardMarket product prices for:', productId);
      
      // Delegate to the main getCardPrices method
      return await this.getCardPrices(productId);
    } catch (error) {
      console.error('Error fetching CardMarket product prices:', error);
      // Return fallback pricing instead of throwing
      return {
        low: 0,
        mid: 0,
        high: 0,
        market: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get European market trends for a specific card
   */
  async getMarketTrends(cardId: string): Promise<{
    avg1: number;
    avg7: number; 
    avg30: number;
    trendDirection: 'up' | 'down' | 'stable';
  } | null> {
    try {
      const card = await pokemonTcgService.getCardById(cardId);
      
      if (!card.cardmarket?.prices) {
        return null;
      }

      const prices = card.cardmarket.prices;
      const avg30 = prices.avg30 || 0;
      const avg7 = prices.avg7 || 0;
      const avg1 = prices.avg1 || 0;

      // Determine trend direction
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (avg1 > avg7 && avg7 > avg30) {
        trendDirection = 'up';
      } else if (avg1 < avg7 && avg7 < avg30) {
        trendDirection = 'down';
      }

      return {
        avg1,
        avg7,
        avg30,
        trendDirection,
      };
    } catch (error) {
      console.error('Error fetching CardMarket trends:', error);
      return null;
    }
  }

  /**
   * Check if CardMarket data is available for a specific card
   */
  async hasCardMarketData(cardId: string): Promise<boolean> {
    try {
      const card = await pokemonTcgService.getCardById(cardId);
      return !!(card.cardmarket?.prices);
    } catch (error) {
      console.error('Error checking CardMarket data availability:', error);
      return false;
    }
  }
}

export const cardMarketService = new CardMarketService();