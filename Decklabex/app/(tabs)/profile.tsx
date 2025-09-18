import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { User as UserIcon, Settings, Crown, Trophy, Star, TrendingUp, Grid3x3 as Grid, BookOpen, LogOut, CreditCard as Edit3, Bell, Shield, Palette } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState, AppDispatch } from '../../src/store/store';
import { logoutUser } from '../../src/store/slices/authSlice';
import { fetchUserAchievements } from '../../src/store/slices/achievementsSlice';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { achievements, unlockedCount, totalCount } = useSelector((state: RootState) => state.achievements);
  const { collections } = useSelector((state: RootState) => state.collections);
  const { binders } = useSelector((state: RootState) => state.binder);

  const collectionsArray = Object.values(collections);
  const bindersArray = Object.values(binders);
  const achievementsArray = Object.values(achievements);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserAchievements(user.id));
    }
  }, [user, dispatch]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <LinearGradient
      colors={['#1A1A1A', '#2A2A2A']}
      style={styles.profileHeader}
    >
      <View style={styles.avatarContainer}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserIcon size={32} color="#666" />
          </View>
        )}
        {user?.isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={16} color="#FFD700" />
          </View>
        )}
      </View>

      <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {user?.isPremium && (
        <View style={styles.premiumContainer}>
          <Crown size={16} color="#FFD700" />
          <Text style={styles.premiumText}>
            {user.premiumTier === 'elite' ? 'DeckLab Elite' : 'DeckLab Pro'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.editProfileButton}>
        <Edit3 size={16} color="#FFD700" />
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Collection Stats</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Grid size={24} color="#FFD700" />
          <Text style={styles.statValue}>{user?.stats.totalCards || 0}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>

        <View style={styles.statCard}>
          <DollarSign size={24} color="#4CAF50" />
          <Text style={styles.statValue}>${user?.stats.totalValue.toFixed(0) || '0'}</Text>
          <Text style={styles.statLabel}>Collection Value</Text>
        </View>

        <View style={styles.statCard}>
          <BookOpen size={24} color="#2196F3" />
          <Text style={styles.statValue}>{bindersArray.length}</Text>
          <Text style={styles.statLabel}>Binders</Text>
        </View>

        <View style={styles.statCard}>
          <Trophy size={24} color="#FF9800" />
          <Text style={styles.statValue}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentAchievements = () => {
    const recentAchievements = achievementsArray
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 3);

    if (recentAchievements.length === 0) return null;

    return (
      <View style={styles.achievementsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity onPress={() => router.push('/achievements')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentAchievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Star size={16} color="#FFD700" />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSettingsMenu = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Settings</Text>

      <TouchableOpacity style={styles.settingItem}>
        <Bell size={20} color="#666" />
        <Text style={styles.settingText}>Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Shield size={20} color="#666" />
        <Text style={styles.settingText}>Privacy</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Palette size={20} color="#666" />
        <Text style={styles.settingText}>Appearance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Settings size={20} color="#666" />
        <Text style={styles.settingText}>General</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
        <LogOut size={20} color="#FF4444" />
        <Text style={[styles.settingText, { color: '#FF4444' }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.unauthenticatedContainer}>
        <UserIcon size={64} color="#333" />
        <Text style={styles.unauthenticatedTitle}>Sign In Required</Text>
        <Text style={styles.unauthenticatedDescription}>
          Please sign in to view your profile and manage your collections
        </Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderStatsGrid()}
        {renderRecentAchievements()}
        {renderSettingsMenu()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  premiumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 6,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 6,
  },
  statsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  achievementsContainer: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#CCC',
  },
  achievementBadge: {
    alignItems: 'center',
  },
  settingsContainer: {
    margin: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  unauthenticatedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  unauthenticatedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthenticatedDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
});