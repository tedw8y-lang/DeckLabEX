import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Zap,
  Sword,
  Shield,
  X
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { DeckList, Tournament, Card } from '../../types/global';
import { competitiveService } from '../../services/competitiveService';

interface CompetitiveToolsProps {
  visible: boolean;
  onClose: () => void;
}

export const CompetitiveTools: React.FC<CompetitiveToolsProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { collections } = useSelector((state: RootState) => state.collections);
  
  const [activeTab, setActiveTab] = useState<'decks' | 'tournaments' | 'meta'>('decks');
  const [userDecks, setUserDecks] = useState<DeckList[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [metaData, setMetaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadCompetitiveData();
    }
  }, [visible, user]);

  const loadCompetitiveData = async () => {
    setLoading(true);
    try {
      const [decks, tournamentData, meta] = await Promise.all([
        competitiveService.getUserDecks(user!.id),
        competitiveService.getRecentTournaments(),
        competitiveService.getCurrentMeta(),
      ]);
      
      setUserDecks(decks);
      setTournaments(tournamentData);
      setMetaData(meta);
    } catch (error) {
      console.error('Failed to load competitive data:', error);
    }
    setLoading(false);
  };

  const renderDeckItem = ({ item }: { item: DeckList }) => (
    <TouchableOpacity style={styles.deckItem}>
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A']}
        style={styles.deckGradient}
      >
        <View style={styles.deckHeader}>
          <Text style={styles.deckName}>{item.name}</Text>
          <Text style={styles.deckFormat}>{item.format}</Text>
        </View>
        
        <View style={styles.deckStats}>
          <View style={styles.deckStat}>
            <Text style={styles.statValue}>{item.cards.length}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
          {item.stats && (
            <>
              <View style={styles.deckStat}>
                <Text style={styles.statValue}>{item.stats.winRate?.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
              <View style={styles.deckStat}>
                <Text style={styles.statValue}>{item.stats.gamesPlayed}</Text>
                <Text style={styles.statLabel}>Games</Text>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTournamentItem = ({ item }: { item: Tournament }) => (
    <TouchableOpacity style={styles.tournamentItem}>
      <View style={styles.tournamentHeader}>
        <Text style={styles.tournamentName}>{item.name}</Text>
        <Text style={styles.tournamentDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.tournamentLocation}>{item.location}</Text>
      <Text style={styles.tournamentPlayers}>{item.players} players</Text>
    </TouchableOpacity>
  );

  const renderMetaAnalysis = () => (
    <ScrollView style={styles.metaContainer}>
      <View style={styles.metaSection}>
        <Text style={styles.metaTitle}>Current Meta Snapshot</Text>
        <Text style={styles.metaDescription}>
          Based on recent tournament results from LimitlessTCG
        </Text>
        
        {metaData && (
          <View style={styles.metaCards}>
            <View style={styles.metaCard}>
              <TrendingUp size={24} color="#4CAF50" />
              <Text style={styles.metaCardTitle}>Rising</Text>
              <Text style={styles.metaCardValue}>{metaData.rising || 'Charizard ex'}</Text>
            </View>
            
            <View style={styles.metaCard}>
              <Target size={24} color="#FFD700" />
              <Text style={styles.metaCardTitle}>Meta Share</Text>
              <Text style={styles.metaCardValue}>{metaData.topShare || '15.3%'}</Text>
            </View>
            
            <View style={styles.metaCard}>
              <Trophy size={24} color="#FF9800" />
              <Text style={styles.metaCardTitle}>Top Deck</Text>
              <Text style={styles.metaCardValue}>{metaData.topDeck || 'Miraidon ex'}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tierList}>
        <Text style={styles.tierTitle}>Tier List</Text>
        
        <View style={styles.tier}>
          <View style={[styles.tierBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.tierText}>S</Text>
          </View>
          <Text style={styles.tierDecks}>Miraidon ex, Charizard ex, Gardevoir ex</Text>
        </View>
        
        <View style={styles.tier}>
          <View style={[styles.tierBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.tierText}>A</Text>
          </View>
          <Text style={styles.tierDecks}>Pidgeot Control, Lost Box, Chien-Pao ex</Text>
        </View>
        
        <View style={styles.tier}>
          <View style={[styles.tierBadge, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.tierText}>B</Text>
          </View>
          <Text style={styles.tierDecks}>Roaring Moon ex, Iron Valiant ex</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'decks':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>My Decks</Text>
              <TouchableOpacity style={styles.createButton}>
                <Text style={styles.createButtonText}>+ New Deck</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={userDecks}
              renderItem={renderDeckItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );
      
      case 'tournaments':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Tournaments</Text>
            </View>
            <FlatList
              data={tournaments}
              renderItem={renderTournamentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        );
      
      case 'meta':
        return renderMetaAnalysis();
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Competitive Tools</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'decks' && styles.activeTab]}
            onPress={() => setActiveTab('decks')}
          >
            <Sword size={16} color={activeTab === 'decks' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'decks' && styles.activeTabText]}>
              Decks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tournaments' && styles.activeTab]}
            onPress={() => setActiveTab('tournaments')}
          >
            <Trophy size={16} color={activeTab === 'tournaments' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'tournaments' && styles.activeTabText]}>
              Tournaments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'meta' && styles.activeTab]}
            onPress={() => setActiveTab('meta')}
          >
            <BarChart3 size={16} color={activeTab === 'meta' ? '#FFD700' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'meta' && styles.activeTabText]}>
              Meta
            </Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#2A2A2A',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFD700',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  listContainer: {
    paddingBottom: 20,
  },
  deckItem: {
    marginBottom: 12,
  },
  deckGradient: {
    borderRadius: 12,
    padding: 16,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deckFormat: {
    fontSize: 12,
    color: '#FFD700',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  deckStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  tournamentItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tournamentDate: {
    fontSize: 12,
    color: '#FFD700',
  },
  tournamentLocation: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  tournamentPlayers: {
    fontSize: 12,
    color: '#999',
  },
  metaContainer: {
    flex: 1,
    padding: 16,
  },
  metaSection: {
    marginBottom: 24,
  },
  metaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  metaCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metaCardTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  metaCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tierList: {
    marginBottom: 24,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierDecks: {
    flex: 1,
    fontSize: 14,
    color: '#CCC',
  },
});