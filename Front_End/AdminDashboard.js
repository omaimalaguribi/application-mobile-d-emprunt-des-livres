import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView,LogBox } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Désactive les alertes d'erreur spécifiques
LogBox.ignoreLogs([
  'AxiosError: Request failed with status code 404',
  'Non-serializable values were found in the navigation state'
]);

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    usersCount: 0,
    booksCount: 0,
    returnedBooksCount: 0,
    activeBorrowingsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Optionnel - Désactive complètement le LogBox en développement
    if (__DEV__) {
      LogBox.ignoreAllLogs();
    }

    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // 3. Configuration Axios qui ignore les erreurs 404
      const response = await axios.get('http://10.0.2.2:5000/api/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 500 // Ignore les erreurs 4xx sauf 500+
      });

      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      // 4. Gestion silencieuse des erreurs
      if (!error.response || error.response.status !== 404) {
        console.log('Erreur non gérée:', error); // Seulement dans la console
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#87512a" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.tabTitle}>Tableau de bord</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="users" size={32} color="#87512a" />
              <Text style={styles.statValue}>{stats.usersCount}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="book" size={32} color="#87512a" />
              <Text style={styles.statValue}>{stats.booksCount}</Text>
              <Text style={styles.statLabel}>Livres</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="check-circle" size={32} color="#87512a" />
              <Text style={styles.statValue}>{stats.returnedBooksCount}</Text>
              <Text style={styles.statLabel}>Livres retournés</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="exchange" size={32} color="#87512a" />
              <Text style={styles.statValue}>{stats.activeBorrowingsCount}</Text>
              <Text style={styles.statLabel}>Emprunts actifs</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#f5f5f5',
  },
  tabTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 5,
    height: 140,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
  }
});

export default AdminDashboard;