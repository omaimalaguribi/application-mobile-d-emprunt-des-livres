import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const AdminBorrowings = () => {
  
const API_URL = 'http://10.0.2.2:5000/api/admin';
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

const fetchBorrowings = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.get(`${API_URL}/borrowings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBorrowings(response.data);
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to fetch borrowings');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const handleReturn = async (borrowingId) => {
    try {
      const token = await AsyncStorage.getItem('userToken'); // Récupérer le token correctement
      
      await axios.post(`${API_URL}/borrowings/${borrowingId}/return`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      Alert.alert('Succès', 'Livre marqué comme retourné');
      fetchBorrowings(); // Rafraîchir la liste
    } catch (error) {
      console.error('Error returning book:', error);
      Alert.alert('Erreur', 'Impossible de marquer le livre comme retourné');
    }
  };
  const renderItem = ({ item }) => (
    <View style={styles.borrowingItem}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.book_title}</Text>
        <Text style={styles.bookAuthor}>{item.book_author}</Text>
        <Text style={styles.userInfo}>Emprunté par: {item.user_prenom} {item.user_nom}</Text>
        <Text style={styles.dateInfo}>
          Emprunté le: {new Date(item.borrow_date).toLocaleDateString()}
        </Text>
        {item.return_date && (
          <Text style={styles.dateInfo}>
            Retourné le: {new Date(item.return_date).toLocaleDateString()}
          </Text>
        )}
      </View>
      
      {item.status === 'emprunté' && (
        <TouchableOpacity 
          style={styles.returnButton}
          onPress={() => handleReturn(item.id)}
        >
          <Icon name="check" size={18} color="#fff" />
          <Text style={styles.returnButtonText}>Retourné</Text>
        </TouchableOpacity>
      )}
      
      {item.status === 'retourné' && (
        <View style={styles.returnedBadge}>
          <Icon name="check-circle" size={18} color="#27ae60" />
          <Text style={styles.returnedText}>Retourné</Text>
        </View>
      )}
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBorrowings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gestion des Emprunts</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Chargement en cours...</Text>
        </View>
      ) : (
        <FlatList
          data={borrowings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="book" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Aucun emprunt en cours</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  borrowingItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
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
  userInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  dateInfo: {
    fontSize: 12,
    color: '#777',
    marginBottom: 3,
  },
  returnButton: {
    backgroundColor: '#3498db',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  returnedBadge: {
    backgroundColor: '#e8f8f0',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnedText: {
    color: '#27ae60',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default AdminBorrowings;