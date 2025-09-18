import { PriceData } from '../types/global';

interface EbayListing {
  title: string;
  price: number;
  currency: string;
  condition: string;
  isAuction: boolean;
  endTime?: string;
  imageUrl: string;
  listingUrl: string;
  seller: {
    username: string;
    feedbackScore: number;
    feedbackPercentage: number;
  };
}

export class EbayService {
  private readonly baseUrl = 'https://api.ebay.com/buy/browse/v1';
  private readonly appId = process.env.EXPO_PUBLIC_EBAY_APP_ID;
  private readonly devId = process.env.EXPO_PUBLIC_EBAY_DEV_ID;
  private readonly certId = process.env.EXPO_PUBLIC_EBAY_CERT_ID;

  async searchCardListings(cardName: string, isGraded: boolean = false): Promise<EbayListing[]> {
    try {
      if (!this.appId) {
        throw new Error('eBay API credentials not configured');
      }

      // Build search query
      let searchQuery = `${cardName} pokemon card`;
      if (isGraded) {
        searchQuery += ' PSA BGS CGC graded';
      } else {
        searchQuery += ' -PSA -BGS -CGC -graded';
      }

      // In production, this would make actual eBay API calls
      // For now, simulate listings
      const simulatedListings: EbayListing[] = this.generateSimulatedListings(cardName, isGraded);

      return simulatedListings;
    } catch (error) {
      console.error('Error searching eBay listings:', error);
      throw error;
    }
  }

  async getCardPrices(cardId: string): Promise<PriceData> {
    try {
      // Simulate eBay price data
      const simulatedPrices: PriceData = {
        low: 12 + Math.random() * 60,
        mid: 30 + Math.random() * 120,
        high: 60 + Math.random() * 240,
        market: 35 + Math.random() * 140,
        lastUpdated: new Date().toISOString(),
      };

      return simulatedPrices;
    } catch (error) {
      console.error('Error fetching eBay prices:', error);
      throw error;
    }
  }

  async getSoldListings(cardName: string, days: number = 30): Promise<EbayListing[]> {
    try {
      // Search for completed/sold listings
      const searchQuery = `${cardName} pokemon card`;
      
      // Simulate sold listings
      const soldListings: EbayListing[] = this.generateSimulatedSoldListings(cardName, days);

      return soldListings;
    } catch (error) {
      console.error('Error fetching sold listings:', error);
      return [];
    }
  }

  private generateSimulatedListings(cardName: string, isGraded: boolean): EbayListing[] {
    const listings: EbayListing[] = [];
    const listingCount = 8 + Math.floor(Math.random() * 12); // 8-20 listings

    for (let i = 0; i < listingCount; i++) {
      const basePrice = isGraded ? 100 + Math.random() * 500 : 20 + Math.random() * 200;
      const isAuction = Math.random() < 0.3;
      
      listings.push({
        title: `${cardName} ${isGraded ? 'PSA 9' : 'Near Mint'} Pokemon Card`,
        price: Math.round(basePrice * 100) / 100,
        currency: 'USD',
        condition: isGraded ? 'Graded' : ['New', 'Used', 'Very Good'][Math.floor(Math.random() * 3)],
        isAuction,
        endTime: isAuction ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        imageUrl: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
        listingUrl: `https://ebay.com/itm/123456789${i}`,
        seller: {
          username: `seller${i + 1}`,
          feedbackScore: 500 + Math.floor(Math.random() * 10000),
          feedbackPercentage: 95 + Math.random() * 5,
        },
      });
    }

    return listings.sort((a, b) => a.price - b.price);
  }

  private generateSimulatedSoldListings(cardName: string, days: number): EbayListing[] {
    const listings: EbayListing[] = [];
    const listingCount = 5 + Math.floor(Math.random() * 15); // 5-20 sold listings

    for (let i = 0; i < listingCount; i++) {
      const basePrice = 15 + Math.random() * 150;
      const daysAgo = Math.floor(Math.random() * days);
      const soldDate = new Date();
      soldDate.setDate(soldDate.getDate() - daysAgo);
      
      listings.push({
        title: `${cardName} Pokemon Card - SOLD`,
        price: Math.round(basePrice * 100) / 100,
        currency: 'USD',
        condition: ['New', 'Used', 'Very Good'][Math.floor(Math.random() * 3)],
        isAuction: false,
        imageUrl: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
        listingUrl: `https://ebay.com/itm/sold123456${i}`,
        seller: {
          username: `seller${i + 1}`,
          feedbackScore: 200 + Math.floor(Math.random() * 5000),
          feedbackPercentage: 90 + Math.random() * 10,
        },
      });
    }

    return listings.sort((a, b) => b.price - a.price);
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      // eBay API requires OAuth token
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('eBay API request failed:', error);
      throw error;
    }
  }

  private getAccessToken(): string {
    // In production, this would handle OAuth token management
    return 'simulated_access_token';
  }
}

export const ebayService = new EbayService();