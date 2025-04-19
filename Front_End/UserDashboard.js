import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://10.0.2.2:5000/api/user'; 

const UserDashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    currentBorrowed: 0,
    returnedBooks: 0
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentBooks, setRecentBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour charger les notifications directement
  const loadUnreadNotificationsCount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Convertir explicitement en nombre
        const count = Number(response.data.count);
        console.log('Notifications non lues:', count);
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
      setUnreadNotifications(0); // Réinitialiser en cas d'erreur
    }
  };
  
  // Fonction alternative utilisant l'endpoint de comptage spécifique
  const loadUnreadNotificationsCountAlt = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Tentative alternative de chargement des notifications...');
      
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Réponse complète du comptage:', response.data);
      
      if (response.data.success) {
        // Vérifier le type de la réponse et sa structure
        console.log('Type de count:', typeof response.data.count);
        console.log('Valeur brute de count:', response.data.count);
        
        // Convertir en nombre entier
        const count = parseInt(response.data.count, 10);
        console.log('Count après conversion:', count);
        
        // Vérifier si c'est un nombre valide
        if (!isNaN(count)) {
          console.log('Nombre valide de notifications:', count);
          setUnreadNotifications(count);
        } else {
          console.warn('Valeur non numérique pour les notifications');
          setUnreadNotifications(0);
        }
      } else {
        console.warn('La réponse indique une erreur:', response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement alternatif des notifications:', error);
    }
  };

  // Fonction pour charger toutes les données
  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        navigation.navigate('Login');
        return;
      }
  
      // Configurer axios une fois pour toutes les requêtes
      const api = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 secondes timeout
      });
  
      // Paralléliser les requêtes
      const [profileRes, statsRes] = await Promise.all([
        api.get('/profile'),
        api.get('/stats')
      ]);
  
      setUserData(profileRes.data);
      
      if (statsRes.data.success) {
        setStats({
          totalBorrowed: statsRes.data.totalBorrowed || 0,
          currentBorrowed: statsRes.data.currentBorrowed || 0,
          returnedBooks: statsRes.data.returnedBooks || 0
        });
      }
  
      await loadUnreadNotificationsCount();
  
    } catch (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        config: error.config,
        response: error.response?.data
      });
  
      // Afficher un message plus précis
      let errorMessage = "Erreur de connexion au serveur";
      if (error.response) {
        errorMessage = error.response.data.message || "Erreur serveur";
      } else if (error.request) {
        errorMessage = "Pas de réponse du serveur";
      }
  
      Alert.alert(
        "Erreur",
        errorMessage,
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger les données à chaque fois que l'écran est focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => {
        // Nettoyage si nécessaire
      };
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
      number: stats.totalBorrowed,
      label: 'Emprunts totaux'
    },
    {
      icon: 'clock',
      number: stats.currentBorrowed,
      label: 'En cours'
    },
    {
      icon: 'check-circle',
      number: stats.returnedBooks,
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
            
            {/* Bouton de notification avec badge */}
            <View style={styles.notificationWrapper}>
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="bell" size={18} color="#FFF" />
              </TouchableOpacity>
              
              {/* Badge de notification avec condition d'affichage claire */}
              {unreadNotifications > 0 ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </View>
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
  notificationWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Style simplifié et explicite pour le badge
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 99,
    elevation: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 20,
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
    marginTop: 20,
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