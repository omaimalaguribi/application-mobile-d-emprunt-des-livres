import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';

const API_URL = 'http://10.0.2.2:3000/api';

const UserScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        logout();
        return;
      }

      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUserData(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Espace Utilisateur</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Icon name="sign-out" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Icon name="user-circle" size={80} color="#87512a" style={styles.profileIcon} />
          <Text style={styles.welcomeText}>Bienvenue, {userData?.prenom} {userData?.nom}</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userData?.email}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Téléphone:</Text>
            <Text style={styles.infoValue}>{userData?.telephone}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>CIN:</Text>
            <Text style={styles.infoValue}>{userData?.cin}</Text>
          </View>
        </View>
        
        {/* Ajouter ici d'autres sections pour l'utilisateur */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="book" size={24} color="#87512a" />
            <Text style={styles.actionText}>Mes Réservations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="edit" size={24} color="#87512a" />
            <Text style={styles.actionText}>Modifier Profil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ededed',
  },
  loadingText: {
    fontSize: 18,
    color: '#87512a',
  },
  header: {
    backgroundColor: '#87512a',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  profileIcon: {
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    width: '30%',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    width: '70%',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    color: '#87512a',
    marginTop: 5,
    fontWeight: '500',
  },
});

export default UserScreen;