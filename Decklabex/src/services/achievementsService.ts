import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Achievement, User } from '../types/global';

export class AchievementsService {
  private getAchievementsRef() {
    return collection(firestore, 'achievements');
  }

  private getUserAchievementsRef() {
    return collection(firestore, 'userAchievements');
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Get all available achievements
      const allAchievements = await this.getAllAchievements();
      
      // Get user's progress
      const q = query(
        this.getUserAchievementsRef(),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const userProgress: { [achievementId: string]: any } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userProgress[data.achievementId] = data;
      });

      // Merge achievements with user progress
      return allAchievements.map(achievement => ({
        ...achievement,
        progress: userProgress[achievement.id]?.progress || 0,
        unlockedAt: userProgress[achievement.id]?.unlockedAt,
      }));
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<Achievement> {
    try {
      const achievement = await this.getAchievementById(achievementId);
      if (!achievement) {
        throw new Error('Achievement not found');
      }

      // Update user achievement progress
      await addDoc(this.getUserAchievementsRef(), {
        userId,
        achievementId,
        progress: achievement.maxProgress,
        unlockedAt: new Date().toISOString(),
      });

      return {
        ...achievement,
        progress: achievement.maxProgress,
        unlockedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  async checkAllAchievementProgress(userId: string): Promise<Array<{ achievementId: string; progress: number }>> {
    try {
      // This would check user's current stats against all achievement requirements
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error checking achievement progress:', error);
      return [];
    }
  }

  private async getAllAchievements(): Promise<Achievement[]> {
    try {
      // Return predefined achievements
      return [
        {
          id: 'first_card',
          title: 'First Card',
          description: 'Add your first card to a collection',
          icon: '🎴',
          category: 'collector',
          requirements: [{ type: 'cards_added', value: 1, description: 'Add 1 card' }],
          reward: { type: 'badge', value: 'first_card_badge', description: 'First Card Badge' },
          rarity: 'common',
          progress: 0,
          maxProgress: 1,
        },
        {
          id: 'hundred_cards',
          title: 'Century Collection',
          description: 'Collect 100 cards',
          icon: '💯',
          category: 'collector',
          requirements: [{ type: 'total_cards', value: 100, description: 'Own 100 cards' }],
          reward: { type: 'badge', value: 'century_badge', description: 'Century Collector Badge' },
          rarity: 'rare',
          progress: 0,
          maxProgress: 100,
        },
        {
          id: 'first_charizard',
          title: 'Dragon Master',
          description: 'Collect your first Charizard card',
          icon: '🐉',
          category: 'collector',
          requirements: [{ type: 'specific_card', value: 1, description: 'Own a Charizard card' }],
          reward: { type: 'badge', value: 'dragon_master_badge', description: 'Dragon Master Badge' },
          rarity: 'epic',
          progress: 0,
          maxProgress: 1,
        },
        {
          id: 'scanner_novice',
          title: 'Scanner Novice',
          description: 'Scan your first 10 cards',
          icon: '📷',
          category: 'scanner',
          requirements: [{ type: 'cards_scanned', value: 10, description: 'Scan 10 cards' }],
          reward: { type: 'feature', value: 'advanced_scanner', description: 'Advanced Scanner Features' },
          rarity: 'common',
          progress: 0,
          maxProgress: 10,
        },
        {
          id: 'market_watcher',
          title: 'Market Watcher',
          description: 'Set up your first price alert',
          icon: '📈',
          category: 'collector',
          requirements: [{ type: 'price_alerts', value: 1, description: 'Create 1 price alert' }],
          reward: { type: 'feature', value: 'advanced_alerts', description: 'Advanced Price Alerts' },
          rarity: 'rare',
          progress: 0,
          maxProgress: 1,
        },
        {
          id: 'binder_master',
          title: 'Binder Master',
          description: 'Create and organize 5 binders',
          icon: '📚',
          category: 'collector',
          requirements: [{ type: 'binders_created', value: 5, description: 'Create 5 binders' }],
          reward: { type: 'theme', value: 'premium_binder_themes', description: 'Premium Binder Themes' },
          rarity: 'epic',
          progress: 0,
          maxProgress: 5,
        },
        {
          id: 'social_butterfly',
          title: 'Social Butterfly',
          description: 'Make 10 friends in the community',
          icon: '🦋',
          category: 'social',
          requirements: [{ type: 'friends_added', value: 10, description: 'Add 10 friends' }],
          reward: { type: 'feature', value: 'social_features', description: 'Enhanced Social Features' },
          rarity: 'rare',
          progress: 0,
          maxProgress: 10,
        },
        {
          id: 'competitive_player',
          title: 'Competitive Player',
          description: 'Build your first tournament deck',
          icon: '🏆',
          category: 'competitive',
          requirements: [{ type: 'decks_built', value: 1, description: 'Build 1 tournament deck' }],
          reward: { type: 'feature', value: 'deck_analyzer', description: 'Advanced Deck Analyzer' },
          rarity: 'epic',
          progress: 0,
          maxProgress: 1,
        },
        {
          id: 'legendary_collector',
          title: 'Legendary Collector',
          description: 'Reach $10,000 collection value',
          icon: '👑',
          category: 'collector',
          requirements: [{ type: 'collection_value', value: 10000, description: 'Reach $10,000 value' }],
          reward: { type: 'title', value: 'legendary_collector', description: 'Legendary Collector Title' },
          rarity: 'legendary',
          progress: 0,
          maxProgress: 10000,
        },
        {
          id: 'set_completionist',
          title: 'Set Completionist',
          description: 'Complete your first full set',
          icon: '✅',
          category: 'collector',
          requirements: [{ type: 'sets_completed', value: 1, description: 'Complete 1 full set' }],
          reward: { type: 'badge', value: 'completionist_badge', description: 'Set Completionist Badge' },
          rarity: 'epic',
          progress: 0,
          maxProgress: 1,
        },
      ];
    } catch (error) {
      console.error('Error getting all achievements:', error);
      return [];
    }
  }

  private async getAchievementById(achievementId: string): Promise<Achievement | null> {
    const achievements = await this.getAllAchievements();
    return achievements.find(a => a.id === achievementId) || null;
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
}

export const achievementsService = new AchievementsService();