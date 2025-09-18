import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ScanSession, ScannedCard, Card } from '../types/global';
import { authService } from './authService';
import { pokemonTcgService } from './pokemonTcgService';
import { mlCardRecognitionService } from './mlCardRecognitionService';

export class ScannerService {
  private getScanSessionsRef() {
    return collection(firestore, 'scanSessions');
  }

  private getScanSessionRef(sessionId: string) {
    return doc(firestore, 'scanSessions', sessionId);
  }

  async createScanSession(userId: string): Promise<ScanSession> {
    try {
      const newSession: Omit<ScanSession, 'id'> = {
        userId,
        cards: [],
        totalValue: 0,
        startedAt: new Date().toISOString(),
        isActive: true,
      };

      const docRef = await addDoc(this.getScanSessionsRef(), newSession);
      
      return {
        id: docRef.id,
        ...newSession,
      };
    } catch (error) {
      console.error('Error creating scan session:', error);
      throw error;
    }
  }

  async processCardImage(imageUri: string, sessionId: string): Promise<ScannedCard> {
    try {
      // Use ML service to recognize the card
      const recognitionResult = await mlCardRecognitionService.recognizeCard(imageUri);
      
      if (!recognitionResult.cardId) {
        throw new Error('Card not recognized');
      }

      // Fetch full card data
      const card = await pokemonTcgService.getCardById(recognitionResult.cardId);
      
      // Estimate condition and value
      const estimatedCondition = await this.estimateCardCondition(imageUri);
      const estimatedValue = this.calculateEstimatedValue(card, estimatedCondition);

      const scannedCard: ScannedCard = {
        id: `${sessionId}_${Date.now()}`,
        card,
        confidence: recognitionResult.confidence,
        image: imageUri,
        estimatedCondition,
        estimatedValue,
        timestamp: new Date().toISOString(),
      };

      // Update session
      await this.addCardToSession(sessionId, scannedCard);

      return scannedCard;
    } catch (error) {
      console.error('Error processing card image:', error);
      throw error;
    }
  }

  async completeScanSession(sessionId: string): Promise<ScanSession> {
    try {
      const sessionRef = this.getScanSessionRef(sessionId);
      
      await updateDoc(sessionRef, {
        completedAt: new Date().toISOString(),
        isActive: false,
      });

      const updatedDoc = await getDoc(sessionRef);
      if (!updatedDoc.exists()) {
        throw new Error('Session not found');
      }

      return { id: updatedDoc.id, ...updatedDoc.data() } as ScanSession;
    } catch (error) {
      console.error('Error completing scan session:', error);
      throw error;
    }
  }

  private async addCardToSession(sessionId: string, scannedCard: ScannedCard): Promise<void> {
    try {
      const sessionRef = this.getScanSessionRef(sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data() as ScanSession;
      const updatedCards = [...sessionData.cards, scannedCard];
      const updatedTotalValue = sessionData.totalValue + scannedCard.estimatedValue;

      await updateDoc(sessionRef, {
        cards: updatedCards,
        totalValue: updatedTotalValue,
      });
    } catch (error) {
      console.error('Error adding card to session:', error);
      throw error;
    }
  }

  private async estimateCardCondition(imageUri: string): Promise<'Mint (M)' | 'Near Mint (NM)' | 'Lightly Played (LP)' | 'Moderately Played (MP)' | 'Heavily Played (HP)' | 'Damaged (D)'> {
    try {
      // Use ML service to analyze card condition
      const conditionAnalysis = await mlCardRecognitionService.analyzeCardCondition(imageUri);
      return conditionAnalysis.estimatedCondition;
    } catch (error) {
      console.error('Error estimating card condition:', error);
      return 'Near Mint (NM)'; // Default fallback
    }
  }

  private calculateEstimatedValue(card: Card, condition: string): number {
    const basePrice = card.prices?.market || card.prices?.mid || card.prices?.low || 0;
    
    const conditionMultipliers = {
      'Mint (M)': 1.0,
      'Near Mint (NM)': 0.9,
      'Lightly Played (LP)': 0.7,
      'Moderately Played (MP)': 0.5,
      'Heavily Played (HP)': 0.3,
      'Damaged (D)': 0.1,
    };

    const multiplier = conditionMultipliers[condition as keyof typeof conditionMultipliers] || 0.9;
    return Math.round(basePrice * multiplier * 100) / 100;
  }

  async getScanSessionHistory(userId: string): Promise<ScanSession[]> {
    try {
      const q = query(
        this.getScanSessionsRef(),
        where('userId', '==', userId),
        where('isActive', '==', false),
        orderBy('completedAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const sessions: ScanSession[] = [];

      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() } as ScanSession);
      });

      return sessions;
    } catch (error) {
      console.error('Error fetching scan session history:', error);
      return [];
    }
  }
}

export const scannerService = new ScannerService();