import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomAlert from './CustomAlert';

const API_URL = 'http://10.0.2.2:5000/api/user'; // Adaptez selon votre configuration

const MyBooksScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '' });
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const fetchMyBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/my-borrowings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mise à jour pour correspondre à la structure renvoyée par l'API
      if (response.data.success && response.data.borrowings) {
        setLoans(response.data.borrowings);
      } else {
        setLoans([]);
      }
      
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching my books:', error);
      setIsLoading(false);
      setRefreshing(false);
      showAlert('Erreur', 'Impossible de charger vos livres', 'error');
    }
  };

  const handleCancelBorrowing = async (borrowingId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_URL}/cancel-borrowing/${borrowingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Succès', 'Emprunt annulé avec succès', 'success');
      fetchMyBooks(); // Rafraîchir la liste
    } catch (error) {
      console.error('Error canceling borrowing:', error);
      showAlert('Erreur', error.response?.data?.message || 'Erreur lors de l\'annulation', 'error');
    }
  };

  const showAlert = (title, message, type) => {
    setAlertMessage({ title, message });
    setAlertType(type);
    setAlertVisible(true);
  };

  const renderLoanItem = ({ item }) => (
    <View style={styles.loanCard}>
      <Image
        source={item.Picture_link ? { uri: item.Picture_link } : require('./photos/logo1.png')}
        style={styles.bookImage}
        resizeMode="contain"
      />
      <View style={styles.loanInfo}>
        <Text style={styles.bookTitle}>{item.Title}</Text>
        <Text style={styles.bookAuthor}>{item.Author}</Text>
        
        <View style={styles.loanDates}>
          <Text style={styles.loanDate}>Emprunté le: {new Date(item.borrow_date).toLocaleDateString()}</Text>
          {item.return_date && (
            <Text style={[styles.loanDate, styles.returned]}>
              Retourné le: {new Date(item.return_date).toLocaleDateString()}
            </Text>
          )}
          <Text style={[
            styles.loanDate, 
            item.status === 'emprunté' ? styles.borrowed : styles.returned
          ]}>
            Statut: {item.status}
          </Text>
        </View>
        
        {item.status === 'emprunté' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBorrowing(item.id)}
          >
            <Text style={styles.cancelButtonText}>Annuler l'emprunt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#6b4119" barStyle="light-content" />
      
    
     
      
      {/* Sous-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Gérez vos emprunts de livres</Text>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertMessage.title}
        message={alertMessage.message}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      <FlatList
        data={loans}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchMyBooks();
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="book" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Vous n'avez aucun livre emprunté</Text>
          </View>
        }
      />

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
          style={[styles.navItem, styles.activeNavItem]} 
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Styles du header
  header: {
    backgroundColor: '#87512A',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Styles du sous-header
  subHeader: {
    backgroundColor: '#f0e6e0',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subHeaderText: {
    color: '#87512A',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 80, // Espace pour la barre de navigation
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
  },
  bookImage: {
    width: 100,
    height: 150,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  loanInfo: {
    flex: 1,
    padding: 15,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  loanDates: {
    marginBottom: 10,
  },
  loanDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  returned: {
    color: '#4CD964',
    fontWeight: 'bold',
  },
  borrowed: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
  },
  // Styles pour la barre de navigation
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 60,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },

  navLabel: {
    fontSize: 12,
    marginTop: 2,
    color: '#87512A',
  },
});

export default MyBooksScreen;