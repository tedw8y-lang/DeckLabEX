import { Binder, BinderPage, CollectionCard, Card } from '../types/global';

interface AIRequest {
  prompt: string;
  context?: any;
}

interface AIResponse {
  response: string;
  actions?: any[];
}

export class AIAssistantService {
  private readonly apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  async processUserRequest(request: string, context?: any): Promise<AIResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const prompt = this.buildPrompt(request, context);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I could not process your request.';

      return {
        response: aiResponse,
        actions: this.extractActions(aiResponse),
      };
    } catch (error) {
      console.error('Error processing AI request:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
      };
    }
  }

  async organizeBinder(binder: Binder, criteria: string): Promise<BinderPage[]> {
    try {
      // Extract all cards from binder
      const allCards: CollectionCard[] = [];
      binder.pages.forEach(page => {
        page.cards.forEach(card => {
          if (card) allCards.push(card);
        });
      });

      // Use AI to determine organization strategy
      const organizationPlan = await this.getOrganizationPlan(allCards, criteria);
      
      // Apply organization
      const organizedCards = this.applySorting(allCards, organizationPlan);
      
      // Redistribute cards across pages
      const newPages = this.redistributeCards(organizedCards, binder.template.slotsPerPage);

      return newPages;
    } catch (error) {
      console.error('Error organizing binder:', error);
      throw error;
    }
  }

  async analyzeCollection(cards: CollectionCard[]): Promise<string> {
    try {
      const analysis = {
        totalCards: cards.length,
        totalValue: cards.reduce((sum, card) => sum + (this.getCardValue(card) * card.quantity), 0),
        rarityBreakdown: this.getRarityBreakdown(cards),
        typeBreakdown: this.getTypeBreakdown(cards),
        setBreakdown: this.getSetBreakdown(cards),
        topCards: this.getTopValueCards(cards, 5),
      };

      const prompt = `Analyze this Pokemon TCG collection and provide insights:
        
        Collection Summary:
        - Total Cards: ${analysis.totalCards}
        - Total Value: $${analysis.totalValue.toFixed(2)}
        - Rarity Distribution: ${JSON.stringify(analysis.rarityBreakdown)}
        - Type Distribution: ${JSON.stringify(analysis.typeBreakdown)}
        - Top Value Cards: ${analysis.topCards.map(c => `${c.card.name} ($${this.getCardValue(c)})`).join(', ')}
        
        Please provide:
        1. Collection strengths and highlights
        2. Investment potential and market trends
        3. Suggestions for improvement or completion
        4. Notable cards or gaps to address`;

      const response = await this.processUserRequest(prompt);
      return response.response;
    } catch (error) {
      console.error('Error analyzing collection:', error);
      return 'Unable to analyze collection at this time.';
    }
  }

  async suggestCardPurchases(cards: CollectionCard[], budget: number): Promise<string> {
    try {
      const prompt = `Based on this Pokemon TCG collection, suggest cards to purchase within a $${budget} budget:
        
        Current Collection: ${cards.length} cards
        Budget: $${budget}
        
        Please suggest specific cards that would:
        1. Complete important sets
        2. Add value to the collection
        3. Fill strategic gaps
        4. Provide good investment potential
        
        Format as a prioritized list with reasoning.`;

      const response = await this.processUserRequest(prompt, { cards, budget });
      return response.response;
    } catch (error) {
      console.error('Error suggesting card purchases:', error);
      return 'Unable to provide purchase suggestions at this time.';
    }
  }

  private buildPrompt(request: string, context?: any): string {
    let prompt = `You are an expert Pokemon TCG advisor and collection manager. You have deep knowledge of:
    - Pokemon TCG cards, sets, and market values
    - Collection organization and optimization strategies
    - Market trends and investment potential
    - Competitive play and deck building
    
    User Request: ${request}`;

    if (context) {
      prompt += `\n\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    prompt += `\n\nPlease provide a helpful, accurate, and actionable response. If organizing cards, be specific about the sorting criteria and logic.`;

    return prompt;
  }

  private extractActions(response: string): any[] {
    // Extract actionable items from AI response
    const actions: any[] = [];
    
    // Look for organization commands
    if (response.toLowerCase().includes('organize') || response.toLowerCase().includes('sort')) {
      actions.push({ type: 'organize', criteria: 'value_desc' });
    }

    return actions;
  }

  private async getOrganizationPlan(cards: CollectionCard[], criteria: string): Promise<string> {
    try {
      const prompt = `Organize these ${cards.length} Pokemon TCG cards based on: "${criteria}"
        
        Available sorting options:
        - By color/type (Fire, Water, Grass, etc.)
        - By value (highest to lowest)
        - By rarity (Secret Rare, Ultra Rare, etc.)
        - By set (chronological or alphabetical)
        - By Pokemon type or evolution stage
        - Custom combinations
        
        Return the best sorting strategy as a single word or phrase (e.g., "value_desc", "type_fire_first", "rarity_desc").`;

      const response = await this.processUserRequest(prompt, { cards: cards.length, criteria });
      
      // Extract sorting strategy from response
      return this.parseSortingStrategy(response.response);
    } catch (error) {
      console.error('Error getting organization plan:', error);
      return 'value_desc'; // Default fallback
    }
  }

  private parseSortingStrategy(aiResponse: string): string {
    const response = aiResponse.toLowerCase();
    
    if (response.includes('value') && response.includes('high')) return 'value_desc';
    if (response.includes('value') && response.includes('low')) return 'value_asc';
    if (response.includes('rarity')) return 'rarity_desc';
    if (response.includes('color') || response.includes('type')) return 'type_grouped';
    if (response.includes('set')) return 'set_chronological';
    if (response.includes('name') || response.includes('alphabetical')) return 'name_asc';
    
    return 'value_desc'; // Default
  }

  private applySorting(cards: CollectionCard[], strategy: string): CollectionCard[] {
    const sortedCards = [...cards];

    switch (strategy) {
      case 'value_desc':
        return sortedCards.sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
      
      case 'value_asc':
        return sortedCards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
      
      case 'rarity_desc':
        return sortedCards.sort((a, b) => this.getRarityWeight(b.card.rarity) - this.getRarityWeight(a.card.rarity));
      
      case 'type_grouped':
        return sortedCards.sort((a, b) => {
          const typeA = a.card.type || 'Unknown';
          const typeB = b.card.type || 'Unknown';
          return typeA.localeCompare(typeB);
        });
      
      case 'set_chronological':
        return sortedCards.sort((a, b) => {
          const dateA = new Date(a.card.set.releaseDate);
          const dateB = new Date(b.card.set.releaseDate);
          return dateB.getTime() - dateA.getTime();
        });
      
      case 'name_asc':
        return sortedCards.sort((a, b) => a.card.name.localeCompare(b.card.name));
      
      default:
        return sortedCards.sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
    }
  }

  private redistributeCards(cards: CollectionCard[], slotsPerPage: number): BinderPage[] {
    const pages: BinderPage[] = [];
    let currentPageCards: (CollectionCard | null)[] = [];
    let pageNumber = 1;

    cards.forEach((card, index) => {
      currentPageCards.push(card);

      if (currentPageCards.length === slotsPerPage || index === cards.length - 1) {
        // Fill remaining slots with null
        while (currentPageCards.length < slotsPerPage) {
          currentPageCards.push(null);
        }

        pages.push({
          id: `page_${pageNumber}`,
          pageNumber,
          cards: [...currentPageCards],
          notes: '',
        });

        currentPageCards = [];
        pageNumber++;
      }
    });

    return pages;
  }

  private getCardValue(card: CollectionCard): number {
    const basePrice = card.card.prices?.market || card.card.prices?.mid || card.card.prices?.low || 0;
    
    const conditionMultipliers = {
      'Mint (M)': 1.0,
      'Near Mint (NM)': 0.9,
      'Lightly Played (LP)': 0.7,
      'Moderately Played (MP)': 0.5,
      'Heavily Played (HP)': 0.3,
      'Damaged (D)': 0.1,
    };

    const multiplier = conditionMultipliers[card.condition] || 0.9;
    let adjustedPrice = basePrice * multiplier;

    if (card.isGraded && card.grade) {
      adjustedPrice *= Math.max(1.2, card.grade / 5);
    }

    if (card.isFirstEdition) {
      adjustedPrice *= 1.5;
    }

    return Math.round(adjustedPrice * 100) / 100;
  }

  private getRarityWeight(rarity: string): number {
    const weights: { [key: string]: number } = {
      'Secret Rare': 10,
      'Rare Rainbow': 9,
      'Rare Ultra': 8,
      'Rare Holo VSTAR': 7,
      'Rare Holo VMAX': 6,
      'Rare Holo V': 5,
      'Rare Holo GX': 4,
      'Rare Holo EX': 3,
      'Rare Holo': 2,
      'Rare': 1,
      'Uncommon': 0.5,
      'Common': 0,
    };

    return weights[rarity] || 0;
  }

  private getRarityBreakdown(cards: CollectionCard[]): { [rarity: string]: number } {
    const breakdown: { [rarity: string]: number } = {};
    
    cards.forEach(card => {
      const rarity = card.card.rarity || 'Unknown';
      breakdown[rarity] = (breakdown[rarity] || 0) + card.quantity;
    });

    return breakdown;
  }

  private getTypeBreakdown(cards: CollectionCard[]): { [type: string]: number } {
    const breakdown: { [type: string]: number } = {};
    
    cards.forEach(card => {
      const type = card.card.type || 'Unknown';
      breakdown[type] = (breakdown[type] || 0) + card.quantity;
    });

    return breakdown;
  }

  private getSetBreakdown(cards: CollectionCard[]): { [set: string]: number } {
    const breakdown: { [set: string]: number } = {};
    
    cards.forEach(card => {
      const setName = card.card.set.name;
      breakdown[setName] = (breakdown[setName] || 0) + card.quantity;
    });

    return breakdown;
  }

  private getTopValueCards(cards: CollectionCard[], count: number): CollectionCard[] {
    return [...cards]
      .sort((a, b) => this.getCardValue(b) - this.getCardValue(a))
      .slice(0, count);
  }
}

export const aiAssistantService = new AIAssistantService();