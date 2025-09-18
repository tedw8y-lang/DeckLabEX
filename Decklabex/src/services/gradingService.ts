import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { 
  GradingReport, 
  GradingAnalysis, 
  GradingPrediction, 
  GradingCompany,
  CornerDamage,
  SurfaceDefect 
} from '../types/global';
import { mlCardRecognitionService } from './mlCardRecognitionService';

export class GradingService {
  private getGradingReportsRef() {
    return collection(firestore, 'gradingReports');
  }

  async generateGradingReport(cardId: string, images: string[]): Promise<GradingReport> {
    try {
      if (images.length < 2) {
        throw new Error('At least front and back images are required');
      }

      const [frontImage, backImage, ...additionalImages] = images;

      // Analyze each aspect of the card
      const analysis = await this.performDetailedAnalysis(frontImage, backImage, additionalImages);
      
      // Generate predictions for each grading company
      const predictions = await this.generateGradingPredictions(analysis);

      const report: Omit<GradingReport, 'id'> = {
        cardId,
        images: {
          front: frontImage,
          back: backImage,
          corners: additionalImages.slice(0, 4),
          edges: additionalImages.slice(4, 8),
          surface: additionalImages.slice(8, 12),
        },
        analysis,
        predictions,
        confidence: this.calculateOverallConfidence(analysis),
        timestamp: new Date().toISOString(),
      };

      const docRef = await addDoc(this.getGradingReportsRef(), report);
      
      return {
        id: docRef.id,
        ...report,
      };
    } catch (error) {
      console.error('Error generating grading report:', error);
      throw error;
    }
  }

  private async performDetailedAnalysis(
    frontImage: string, 
    backImage: string, 
    additionalImages: string[]
  ): Promise<GradingAnalysis> {
    try {
      // Simulate detailed grading analysis
      // In production, this would use computer vision to analyze:
      
      const centeringAnalysis = await this.analyzeCentering(frontImage);
      const cornersAnalysis = await this.analyzeCorners(frontImage, backImage);
      const edgesAnalysis = await this.analyzeEdges(frontImage, backImage);
      const surfaceAnalysis = await this.analyzeSurface(frontImage, backImage);

      return {
        centering: centeringAnalysis,
        corners: cornersAnalysis,
        edges: edgesAnalysis,
        surface: surfaceAnalysis,
      };
    } catch (error) {
      console.error('Error performing detailed analysis:', error);
      throw error;
    }
  }

  private async analyzeCentering(image: string): Promise<GradingAnalysis['centering']> {
    // Simulate centering analysis
    const leftRight = 50 + (Math.random() - 0.5) * 10; // 45-55%
    const topBottom = 50 + (Math.random() - 0.5) * 8; // 46-54%
    
    const leftRightDeviation = Math.abs(leftRight - 50);
    const topBottomDeviation = Math.abs(topBottom - 50);
    const maxDeviation = Math.max(leftRightDeviation, topBottomDeviation);
    
    let score = 10;
    if (maxDeviation > 5) score = 6;
    else if (maxDeviation > 3) score = 7;
    else if (maxDeviation > 2) score = 8;
    else if (maxDeviation > 1) score = 9;

    return {
      score,
      leftRight,
      topBottom,
      notes: this.generateCenteringNotes(leftRight, topBottom),
    };
  }

  private async analyzeCorners(frontImage: string, backImage: string): Promise<GradingAnalysis['corners']> {
    const damage: CornerDamage[] = [];
    const corners: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = 
      ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    // Simulate corner damage detection
    corners.forEach(corner => {
      if (Math.random() < 0.3) { // 30% chance of damage
        damage.push({
          corner,
          severity: Math.random() < 0.7 ? 'minor' : Math.random() < 0.9 ? 'moderate' : 'severe',
          type: Math.random() < 0.5 ? 'rounding' : Math.random() < 0.8 ? 'whitening' : 'cracking',
        });
      }
    });

    const score = Math.max(6, 10 - damage.length * 1.5);

    return {
      score,
      damage,
      notes: this.generateCornerNotes(damage),
    };
  }

  private async analyzeEdges(frontImage: string, backImage: string): Promise<GradingAnalysis['edges']> {
    const roughness = Math.random() * 0.4; // 0-40% roughness
    const whitening = Math.random() * 0.3; // 0-30% whitening
    
    const score = Math.max(6, 10 - (roughness * 5) - (whitening * 6));

    return {
      score,
      roughness,
      whitening,
      notes: this.generateEdgeNotes(roughness, whitening),
    };
  }

  private async analyzeSurface(frontImage: string, backImage: string): Promise<GradingAnalysis['surface']> {
    const defects: SurfaceDefect[] = [];
    
    // Simulate surface defect detection
    const defectCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < defectCount; i++) {
      defects.push({
        type: ['scratch', 'stain', 'print-line', 'indent', 'spot'][Math.floor(Math.random() * 5)] as any,
        severity: Math.random() < 0.6 ? 'minor' : Math.random() < 0.9 ? 'moderate' : 'severe',
        location: {
          x: Math.random(),
          y: Math.random(),
        },
        size: Math.random() * 0.1,
      });
    }

    const score = Math.max(6, 10 - defects.length * 0.8);

    return {
      score,
      scratches: defects.filter(d => d.type === 'scratch'),
      stains: defects.filter(d => d.type === 'stain'),
      printDefects: defects.filter(d => d.type === 'print-line'),
      notes: this.generateSurfaceNotes(defects),
    };
  }

  private async generateGradingPredictions(analysis: GradingAnalysis): Promise<GradingPrediction[]> {
    const companies: GradingCompany[] = ['PSA', 'BGS', 'CGC', 'SGC', 'TAG', 'AGS'];
    
    return companies.map(company => {
      const prediction = this.calculateGradeForCompany(company, analysis);
      return prediction;
    });
  }

  private calculateGradeForCompany(company: GradingCompany, analysis: GradingAnalysis): GradingPrediction {
    const { centering, corners, edges, surface } = analysis;
    
    // Different companies weight criteria differently
    const weights = this.getCompanyWeights(company);
    
    const weightedScore = 
      (centering.score * weights.centering) +
      (corners.score * weights.corners) +
      (edges.score * weights.edges) +
      (surface.score * weights.surface);

    const normalizedScore = weightedScore / (weights.centering + weights.corners + weights.edges + weights.surface);
    
    // Convert to company-specific scale
    const grade = this.convertToCompanyScale(company, normalizedScore);
    
    return {
      company,
      grade,
      confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
      breakdown: {
        centering: centering.score,
        corners: corners.score,
        edges: edges.score,
        surface: surface.score,
      },
    };
  }

  private getCompanyWeights(company: GradingCompany) {
    const weights = {
      PSA: { centering: 0.15, corners: 0.25, edges: 0.25, surface: 0.35 },
      BGS: { centering: 0.20, corners: 0.25, edges: 0.25, surface: 0.30 },
      CGC: { centering: 0.18, corners: 0.27, edges: 0.27, surface: 0.28 },
      SGC: { centering: 0.15, corners: 0.30, edges: 0.30, surface: 0.25 },
      TAG: { centering: 0.20, corners: 0.25, edges: 0.25, surface: 0.30 },
      AGS: { centering: 0.17, corners: 0.28, edges: 0.28, surface: 0.27 },
    };

    return weights[company];
  }

  private convertToCompanyScale(company: GradingCompany, normalizedScore: number): number {
    switch (company) {
      case 'PSA':
      case 'SGC':
        // 1-10 scale
        return Math.max(1, Math.min(10, Math.round(normalizedScore)));
      case 'BGS':
        // 1-10 scale with half points
        return Math.max(1, Math.min(10, Math.round(normalizedScore * 2) / 2));
      case 'CGC':
        // 1-10 scale
        return Math.max(1, Math.min(10, Math.round(normalizedScore)));
      case 'TAG':
        // 1-10 scale
        return Math.max(1, Math.min(10, Math.round(normalizedScore)));
      case 'AGS':
        // 1-10 scale
        return Math.max(1, Math.min(10, Math.round(normalizedScore)));
      default:
        return Math.max(1, Math.min(10, Math.round(normalizedScore)));
    }
  }

  private calculateOverallConfidence(analysis: GradingAnalysis): number {
    // Calculate confidence based on image quality and analysis certainty
    const scores = [analysis.centering.score, analysis.corners.score, analysis.edges.score, analysis.surface.score];
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Higher scores generally mean clearer analysis
    return Math.min(0.95, 0.6 + (avgScore / 10) * 0.35);
  }

  private generateCenteringNotes(leftRight: number, topBottom: number): string {
    const lrDeviation = Math.abs(leftRight - 50);
    const tbDeviation = Math.abs(topBottom - 50);
    
    if (lrDeviation < 1 && tbDeviation < 1) {
      return 'Excellent centering with minimal deviation.';
    } else if (lrDeviation < 2 && tbDeviation < 2) {
      return 'Good centering with slight deviation.';
    } else if (lrDeviation < 3 || tbDeviation < 3) {
      return 'Moderate centering issues detected.';
    } else {
      return 'Significant centering problems affecting grade.';
    }
  }

  private generateCornerNotes(damage: CornerDamage[]): string {
    if (damage.length === 0) {
      return 'All corners appear sharp and undamaged.';
    } else if (damage.length === 1) {
      return `Minor corner damage detected on ${damage[0].corner} corner.`;
    } else {
      return `Multiple corner issues detected affecting ${damage.length} corners.`;
    }
  }

  private generateEdgeNotes(roughness: number, whitening: number): string {
    if (roughness < 0.1 && whitening < 0.1) {
      return 'Edges appear clean and sharp.';
    } else if (roughness < 0.2 || whitening < 0.2) {
      return 'Minor edge wear detected.';
    } else {
      return 'Noticeable edge wear and whitening present.';
    }
  }

  private generateSurfaceNotes(defects: SurfaceDefect[]): string {
    if (defects.length === 0) {
      return 'Surface appears clean with no visible defects.';
    } else if (defects.length <= 2) {
      return 'Minor surface imperfections detected.';
    } else {
      return 'Multiple surface defects affecting card quality.';
    }
  }

  async getGradingHistory(cardId: string): Promise<GradingReport[]> {
    try {
      const q = query(
        this.getGradingReportsRef(),
        where('cardId', '==', cardId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports: GradingReport[] = [];

      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as GradingReport);
      });

      return reports;
    } catch (error) {
      console.error('Error fetching grading history:', error);
      return [];
    }
  }
}

export const gradingService = new GradingService();