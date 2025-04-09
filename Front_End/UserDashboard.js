import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://10.0.2.2:5000/api/user'; // Adaptez selon votre configuration

const UserDashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données utilisateur et les statistiques
  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      // Récupérer les données du profil
      const profileResponse = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(profileResponse.data);
      
      // Récupérer les statistiques
      const statsResponse = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);
      
      // Récupérer les livres récemment ajoutés
      const booksResponse = await axios.get(`${API_URL}/recent-books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentBooks(booksResponse.data);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger les données à chaque fois que l'écran est focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
      </View>
    );
  }

  // Les éléments de statistiques à afficher
  const statItems = [
    {
      icon: 'book',
      number: stats?.totalBorrowed || 0,
      label: 'Emprunts totaux'
    },
    {
      icon: 'clock',
      number: stats?.currentBorrowed || 0,
      label: 'En cours'
    },
    {
      icon: 'check-circle',
      number: stats?.returnedBooks || 0,
      label: 'Retournés'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#6D4426" barStyle="light-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* En-tête avec dégradé */}
        <LinearGradient
          colors={['#87512A', '#A06941']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Ouma Books</Text>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={18} color="#FFF" />
              {stats?.unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{stats.unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.welcomeText}>
            Bonjour, {userData?.prenom} {userData?.nom}
          </Text>
         
        </LinearGradient>

        {/* Section Statistiques */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vos Statistiques</Text>
          <View style={styles.statsRow}>
            {statItems.map((item, index) => (
              <View key={index} style={styles.statCard}>
                <Icon name={item.icon} size={24} color="#87512A" />
                <Text style={styles.statNumber}>{item.number}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section Actions rapides */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Books')}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="book-open" size={20} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Emprunter un livre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyBooks')}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="bookmark" size={20} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Mes emprunts</Text>
            </TouchableOpacity>
          </View>
        </View>

     
      </ScrollView>

      {/* Barre de navigation en bas */}
      <View style={styles.bottomNavBar}>
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('UserDashboard')}
  >
    <Icon name="home" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Accueil</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('Books')}
  >
    <Icon name="book" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Livres</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('MyBooks')}
  >
    <Icon name="bookmark" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Emprunts</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => navigation.navigate('UserProfile')}
  >
    <Icon name="user" size={22} color="#87512A" />
    <Text style={styles.navLabel}>Profil</Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5F2',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 15,
  },
  memberSince: {
    fontSize: 14,
    color: '#F3E0D2',
    marginTop: 5,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginTop:'15%',
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3A1E',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FBF7F4',
    borderRadius: 12,
    padding: 16,
    width: '30%',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#87512A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8C6E5A',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginTop:'10%',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#87512A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D3A1E',
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#87512A',
    fontWeight: '500',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E9E3',
  },
  bookIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8E9DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D3A1E',
  },
  bookAuthor: {
    fontSize: 13,
    color: '#8C6E5A',
    marginTop: 2,
  },
  bookAvailability: {
    marginTop: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: '#87512A',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#8C6E5A',
    textAlign: 'center',
    paddingVertical: 10,
  },
  activitiesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#87512A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#5D3A1E',
  },
  activityDate: {
    fontSize: 12,
    color: '#8C6E5A',
    marginTop: 2,
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#F0E9E3',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#87512A',
    marginTop: 4,
  },
});

export default UserDashboard;