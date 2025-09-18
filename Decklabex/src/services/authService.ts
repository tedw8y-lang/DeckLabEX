import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithCredential,
  FacebookAuthProvider,
  TwitterAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { User } from '../types/global';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = await this.createUserFromFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
    });
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const user = await this.createUserFromFirebaseUser(firebaseUser);
      
      // Update last login
      await this.updateUserDocument(user.id, {
        lastLoginAt: new Date().toISOString(),
      });

      // Cache user data locally
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      this.currentUser = user;
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: email.toLowerCase(),
        displayName,
        avatar: null,
        isPremium: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'system',
          language: 'en',
          currency: 'USD',
          notifications: {
            priceAlerts: true,
            marketTrends: true,
            newSets: true,
            socialUpdates: true,
            achievements: true,
          },
          privacy: {
            profileVisibility: 'public',
            collectionVisibility: 'public',
            showRealNames: true,
            allowFriendRequests: true,
          },
          scanning: {
            autoScan: true,
            scanDelay: 2000,
            qualityThreshold: 0.8,
            saveScannedImages: true,
          },
        },
        stats: {
          totalCards: 0,
          totalValue: 0,
          collectionsCount: 0,
          achievementsUnlocked: 0,
          scanSessionsCompleted: 0,
          daysActive: 1,
        },
      };

      await this.createUserDocument(newUser);
      
      // Cache user data locally
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      this.currentUser = newUser;
      return newUser;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      this.currentUser = null;
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get user from local storage first
    try {
      const cachedUser = await AsyncStorage.getItem('user');
      if (cachedUser) {
        this.currentUser = JSON.parse(cachedUser);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error reading cached user:', error);
    }

    // If no cached user and Firebase user exists, fetch from Firestore
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      this.currentUser = await this.createUserFromFirebaseUser(firebaseUser);
      return this.currentUser;
    }

    return null;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedUser = { ...this.currentUser, ...updates };
      
      // Update Firebase profile if display name or photo changed
      const firebaseUser = auth.currentUser;
      if (firebaseUser && (updates.displayName || updates.avatar)) {
        await updateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName,
          photoURL: updates.avatar || firebaseUser.photoURL,
        });
      }

      // Update Firestore document
      await this.updateUserDocument(this.currentUser.id, updates);
      
      // Update cached user
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      this.currentUser = updatedUser;
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('No authenticated user');
    }

    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      console.error('Password change error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  async signInWithGoogle(idToken: string): Promise<User> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      let user = await this.getUserDocument(firebaseUser.uid);
      
      if (!user) {
        // Create new user document
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email!.toLowerCase(),
          displayName: firebaseUser.displayName || 'User',
          avatar: firebaseUser.photoURL,
          isPremium: false,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          preferences: {
            theme: 'system',
            language: 'en',
            currency: 'USD',
            notifications: {
              priceAlerts: true,
              marketTrends: true,
              newSets: true,
              socialUpdates: true,
              achievements: true,
            },
            privacy: {
              profileVisibility: 'public',
              collectionVisibility: 'public',
              showRealNames: true,
              allowFriendRequests: true,
            },
            scanning: {
              autoScan: true,
              scanDelay: 2000,
              qualityThreshold: 0.8,
              saveScannedImages: true,
            },
          },
          stats: {
            totalCards: 0,
            totalValue: 0,
            collectionsCount: 0,
            achievementsUnlocked: 0,
            scanSessionsCompleted: 0,
            daysActive: 1,
          },
        };
        await this.createUserDocument(user);
      } else {
        // Update last login
        await this.updateUserDocument(user.id, {
          lastLoginAt: new Date().toISOString(),
        });
      }

      // Cache user data locally
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      this.currentUser = user;
      return user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  private async createUserFromFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    let user = await this.getUserDocument(firebaseUser.uid);
    
    if (!user) {
      // Create user document if it doesn't exist
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!.toLowerCase(),
        displayName: firebaseUser.displayName || 'User',
        avatar: firebaseUser.photoURL,
        isPremium: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'system',
          language: 'en',
          currency: 'USD',
          notifications: {
            priceAlerts: true,
            marketTrends: true,
            newSets: true,
            socialUpdates: true,
            achievements: true,
          },
          privacy: {
            profileVisibility: 'public',
            collectionVisibility: 'public',
            showRealNames: true,
            allowFriendRequests: true,
          },
          scanning: {
            autoScan: true,
            scanDelay: 2000,
            qualityThreshold: 0.8,
            saveScannedImages: true,
          },
        },
        stats: {
          totalCards: 0,
          totalValue: 0,
          collectionsCount: 0,
          achievementsUnlocked: 0,
          scanSessionsCompleted: 0,
          daysActive: 1,
        },
      };
      await this.createUserDocument(user);
    }

    return user;
  }

  private async createUserDocument(user: User): Promise<void> {
    const userRef = doc(firestore, 'users', user.id);
    await setDoc(userRef, user);
  }

  private async getUserDocument(userId: string): Promise<User | null> {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    
    return null;
  }

  private async updateUserDocument(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, updates);
  }

  private getFirebaseErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Invalid password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export const authService = new AuthService();