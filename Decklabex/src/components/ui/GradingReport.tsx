import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Target, Square, Layers, Award } from 'lucide-react-native';
import { GradingReport as GradingReportType, GradingCompany } from '../../types/global';

interface GradingReportProps {
  report: GradingReportType;
  onClose: () => void;
}

export const GradingReport: React.FC<GradingReportProps> = ({
  report,
  onClose,
}) => {
  const getGradeColor = (score: number): string => {
    if (score >= 9) return '#4CAF50';
    if (score >= 8) return '#8BC34A';
    if (score >= 7) return '#FFC107';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  };

  const getCompanyLogo = (company: GradingCompany): string => {
    // In production, these would be actual company logos
    const logos = {
      PSA: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
      BGS: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
      CGC: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
      SGC: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
      TAG: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
      AGS: 'https://images.pexels.com/photos/9072316/pexels-photo-9072316.jpeg',
    };
    return logos[company];
  };

  const renderAnalysisSection = (
    title: string,
    icon: React.ReactNode,
    score: number,
    notes: string
  ) => (
    <View style={styles.analysisSection}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.scoreChip, { backgroundColor: getGradeColor(score) }]}>
          <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.sectionNotes}>{notes}</Text>
    </View>
  );

  const renderPredictionCard = (prediction: any) => (
    <View key={prediction.company} style={styles.predictionCard}>
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A']}
        style={styles.predictionGradient}
      >
        <View style={styles.predictionHeader}>
          <Image
            source={{ uri: getCompanyLogo(prediction.company) }}
            style={styles.companyLogo}
          />
          <Text style={styles.companyName}>{prediction.company}</Text>
        </View>
        
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeNumber}>{prediction.grade}</Text>
          <Text style={styles.confidenceText}>
            {(prediction.confidence * 100).toFixed(0)}% confidence
          </Text>
        </View>
        
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Centering</Text>
            <Text style={styles.breakdownValue}>{prediction.breakdown.centering}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Corners</Text>
            <Text style={styles.breakdownValue}>{prediction.breakdown.corners}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Edges</Text>
            <Text style={styles.breakdownValue}>{prediction.breakdown.edges}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Surface</Text>
            <Text style={styles.breakdownValue}>{prediction.breakdown.surface}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Grading Analysis Report</Text>
        <Text style={styles.subtitle}>
          Generated {new Date(report.timestamp).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.imagesContainer}>
        <View style={styles.imageRow}>
          <View style={styles.imageItem}>
            <Image source={{ uri: report.images.front }} style={styles.analysisImage} />
            <Text style={styles.imageLabel}>Front</Text>
          </View>
          <View style={styles.imageItem}>
            <Image source={{ uri: report.images.back }} style={styles.analysisImage} />
            <Text style={styles.imageLabel}>Back</Text>
          </View>
        </View>
      </View>

      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>Detailed Analysis</Text>
        
        {renderAnalysisSection(
          'Centering',
          <Target size={20} color="#FFD700" />,
          report.analysis.centering.score,
          report.analysis.centering.notes
        )}
        
        {renderAnalysisSection(
          'Corners',
          <Square size={20} color="#FFD700" />,
          report.analysis.corners.score,
          report.analysis.corners.notes
        )}
        
        {renderAnalysisSection(
          'Edges',
          <Layers size={20} color="#FFD700" />,
          report.analysis.edges.score,
          report.analysis.edges.notes
        )}
        
        {renderAnalysisSection(
          'Surface',
          <Star size={20} color="#FFD700" />,
          report.analysis.surface.score,
          report.analysis.surface.notes
        )}
      </View>

      <View style={styles.predictionsContainer}>
        <Text style={styles.predictionsTitle}>Grade Predictions</Text>
        <View style={styles.predictionsGrid}>
          {report.predictions.map(renderPredictionCard)}
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  imagesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageItem: {
    alignItems: 'center',
  },
  analysisImage: {
    width: 120,
    height: 168,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: '#999',
  },
  analysisContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  analysisSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionNotes: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
  predictionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  predictionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  predictionCard: {
    width: '48%',
    marginBottom: 12,
  },
  predictionGradient: {
    borderRadius: 12,
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gradeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
  },
  confidenceText: {
    fontSize: 12,
    color: '#999',
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#999',
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#FFD700',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});