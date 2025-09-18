import { 
  Card, 
  CardSet, 
  SearchFilters, 
  PaginatedResponse,
  APIResponse 
} from '../types/global';

const BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY;

export class PokemonTcgService {
  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      
      // Add query parameters
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key].toString());
          }
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (API_KEY) {
        headers['X-Api-Key'] = API_KEY;
      }

      console.log('Making API request to:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response received:', {
        endpoint,
        dataCount: Array.isArray(data.data) ? data.data.length : 'single item',
      });

      return data;
    } catch (error) {
      console.error('Pokemon TCG API Error:', error);
      throw error;
    }
  }

  async searchCards(filters: SearchFilters): Promise<PaginatedResponse<Card>> {
    const queryParams: Record<string, any> = {
      pageSize: 50,
    };

    // Build query string based on filters
    const queries: string[] = [];

    if (filters.name) {
      queries.push(`name:"*${filters.name}*"`);
    }

    if (filters.set) {
      queries.push(`set.id:${filters.set}`);
    }

    if (filters.rarity && filters.rarity.length > 0) {
      if (filters.rarity.length === 1) {
        queries.push(`rarity:"${filters.rarity[0]}"`);
      } else {
        const rarityQueries = filters.rarity.map(r => `rarity:"${r}"`);
        queries.push(`(${rarityQueries.join(' OR ')})`);
      }
    }

    if (filters.type && filters.type.length > 0) {
      if (filters.type.length === 1) {
        queries.push(`types:"${filters.type[0]}"`);
      } else {
        const typeQueries = filters.type.map(t => `types:"${t}"`);
        queries.push(`(${typeQueries.join(' OR ')})`);
      }
    }

    if (filters.subtype && filters.subtype.length > 0) {
      if (filters.subtype.length === 1) {
        queries.push(`subtypes:"${filters.subtype[0]}"`);
      } else {
        const subtypeQueries = filters.subtype.map(s => `subtypes:"${s}"`);
        queries.push(`(${subtypeQueries.join(' OR ')})`);
      }
    }

    if (filters.artist) {
      queries.push(`artist:"*${filters.artist}*"`);
    }

    if (filters.hp && (filters.hp.min || filters.hp.max)) {
      if (filters.hp.min && filters.hp.max) {
        queries.push(`hp:[${filters.hp.min} TO ${filters.hp.max}]`);
      } else if (filters.hp.min) {
        queries.push(`hp:[${filters.hp.min} TO *]`);
      } else if (filters.hp.max) {
        queries.push(`hp:[* TO ${filters.hp.max}]`);
      }
    }

    if (queries.length > 0) {
      queryParams.q = queries.join(' AND ');
    }

    const response = await this.makeRequest<{
      data: Card[];
      page: number;
      pageSize: number;
      count: number;
      totalCount: number;
    }>('/cards', queryParams);

    return {
      data: response.data,
      page: response.page,
      totalPages: Math.ceil(response.totalCount / response.pageSize),
      totalCount: response.totalCount,
      hasMore: response.page * response.pageSize < response.totalCount,
    };
  }

  async getCardById(cardId: string): Promise<Card> {
    const response = await this.makeRequest<{ data: Card }>(`/cards/${cardId}`);
    return response.data;
  }

  async getAllSets(): Promise<PaginatedResponse<CardSet>> {
    const response = await this.makeRequest<{
      data: CardSet[];
      page: number;
      pageSize: number;
      count: number;
      totalCount: number;
    }>('/sets', { 
      pageSize: 100,
      orderBy: '-releaseDate' 
    });

    return {
      data: response.data,
      page: response.page,
      totalPages: Math.ceil(response.totalCount / response.pageSize),
      totalCount: response.totalCount,
      hasMore: response.page * response.pageSize < response.totalCount,
    };
  }

  async getSetById(setId: string): Promise<CardSet> {
    const response = await this.makeRequest<{ data: CardSet }>(`/sets/${setId}`);
    return response.data;
  }

  async getCardsInSet(setId: string): Promise<PaginatedResponse<Card>> {
    const response = await this.makeRequest<{
      data: Card[];
      page: number;
      pageSize: number;
      count: number;
      totalCount: number;
    }>('/cards', {
      q: `set.id:${setId}`,
      pageSize: 250, // Get all cards in set
      orderBy: 'number',
    });

    return {
      data: response.data,
      page: response.page,
      totalPages: Math.ceil(response.totalCount / response.pageSize),
      totalCount: response.totalCount,
      hasMore: response.page * response.pageSize < response.totalCount,
    };
  }

  async getPopularCards(): Promise<Card[]> {
    try {
      // Get popular cards - start with a simple query for Charizard cards
      const response = await this.makeRequest<{
        data: Card[];
      }>('/cards', {
        q: 'name:Charizard',
        pageSize: 20,
        orderBy: '-set.releaseDate',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching popular cards:', error);
      // Return empty array on error - let the UI handle empty state
      return [];
    }
  }

  async getCardsByPokedexNumber(pokedexNumber: number): Promise<Card[]> {
    try {
      const response = await this.makeRequest<{
        data: Card[];
      }>('/cards', {
        q: `nationalPokedexNumbers:${pokedexNumber}`,
        pageSize: 50,
        orderBy: 'set.releaseDate',
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching cards by Pokedex number:', error);
      return [];
    }
  }

  async getEvolutionFamily(pokemonName: string): Promise<Card[]> {
    try {
      // Get all cards with this Pokemon name
      const response = await this.makeRequest<{
        data: Card[];
      }>('/cards', {
        q: `name:"*${pokemonName}*"`,
        pageSize: 100,
      });

      // Group by evolution stage
      const evolutionOrder = ['Basic', 'Stage 1', 'Stage 2', 'BREAK', 'EX', 'GX', 'V', 'VMAX', 'VSTAR'];
      
      return response.data.sort((a, b) => {
        const aIndex = evolutionOrder.indexOf(a.evolutionStage || 'Basic');
        const bIndex = evolutionOrder.indexOf(b.evolutionStage || 'Basic');
        return aIndex - bIndex;
      });
    } catch (error) {
      console.error('Error fetching evolution family:', error);
      return [];
    }
  }

  async searchCardsByName(name: string, limit: number = 10): Promise<Card[]> {
    const response = await this.makeRequest<{
      data: Card[];
    }>('/cards', {
      q: `name:"*${name}*"`,
      pageSize: limit,
      orderBy: '-set.releaseDate',
    });

    return response.data;
  }

  async getSetsByFranchise(franchise: string = 'pokemon'): Promise<CardSet[]> {
    // For now, we only support Pokemon TCG
    // In the future, this could be extended for other TCGs
    const response = await this.getAllSets();
    return response.data;
  }

  async getCardTypes(): Promise<string[]> {
    // Common Pokemon TCG types
    return [
      'Colorless',
      'Darkness',
      'Dragon',
      'Fairy',
      'Fighting',
      'Fire',
      'Grass',
      'Lightning',
      'Metal',
      'Psychic',
      'Water'
    ];
  }

  async getCardRarities(): Promise<string[]> {
    // Common Pokemon TCG rarities
    return [
      'Common',
      'Uncommon',
      'Rare',
      'Rare Holo',
      'Rare Holo EX',
      'Rare Holo GX',
      'Rare Holo V',
      'Rare Holo VMAX',
      'Rare Holo VSTAR',
      'Rare Rainbow',
      'Rare Secret',
      'Rare Ultra',
      'Promo'
    ];
  }

  async getCardSubtypes(): Promise<string[]> {
    // Common Pokemon TCG subtypes
    return [
      'Basic',
      'Stage 1',
      'Stage 2',
      'BREAK',
      'EX',
      'GX',
      'V',
      'VMAX',
      'VSTAR',
      'TAG TEAM',
      'Mega',
      'Supporter',
      'Item',
      'Stadium',
      'Tool',
      'Energy',
      'Special Energy'
    ];
  }

  // Evolution chain helpers
  async getEvolutionChain(cardName: string): Promise<Card[]> {
    const evolutionCards: Card[] = [];
    
    try {
      // Search for cards with the same Pokemon name but different stages
      const response = await this.makeRequest<{
        data: Card[];
      }>('/cards', {
        q: `name:"*${cardName}*"`,
        pageSize: 20,
      });

      // Sort by evolution stage and number
      evolutionCards.push(...response.data.sort((a, b) => {
        const stageOrder = ['Basic', 'Stage 1', 'Stage 2', 'BREAK', 'EX', 'GX', 'V', 'VMAX', 'VSTAR'];
        const aStage = stageOrder.indexOf(a.evolutionStage || 'Basic');
        const bStage = stageOrder.indexOf(b.evolutionStage || 'Basic');
        return aStage - bStage;
      }));
    } catch (error) {
      console.error('Error fetching evolution chain:', error);
    }

    return evolutionCards;
  }
}

export const pokemonTcgService = new PokemonTcgService();