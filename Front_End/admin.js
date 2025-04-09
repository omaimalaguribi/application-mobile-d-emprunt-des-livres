import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import AdminSettings from './AdminSettings';

const API_URL = 'http://10.0.2.2:5000/api/admin';

const AdminScreen = ({ navigation }) => {
  const [adminData, setAdminData] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchUsers();
    fetchBooks();
  }, []);

  const handleUserDeleted = (deletedUserId) => {
    // Mise à jour optimiste de l'état local
    setUsers(prevUsers => prevUsers.filter(user => user.id !== deletedUserId));
    setBooks(prevBooks => prevBooks.filter(book => book.userId !== deletedUserId));
  };
  const fetchAdminData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        logout();
        return;
      }
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur serveur');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur serveur');
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchBooks();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const filteredUsers = users.filter(user => 
    user.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooks = books.filter(book => 
    book.Title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.Author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.ISBN?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bibliothèque Admin</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Icon name="sign-out" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'dashboard' && <AdminDashboard usersCount={users.length} booksCount={books.length} />}
        {activeTab === 'users' && (
  <AdminUsers 
    users={filteredUsers} 
    searchQuery={searchQuery} 
    setSearchQuery={setSearchQuery} 
    navigation={navigation}
    handleRefresh={handleRefresh}
    refreshing={refreshing}
    onUserDeleted={handleUserDeleted} // Ajoutez cette ligne
  />
)}
        {activeTab === 'books' && (
          <AdminBooks 
            books={searchQuery ? filteredBooks : selectedLanguage === 'all' ? books : books.filter(book => book.Language?.toLowerCase() === selectedLanguage.toLowerCase())}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            navigation={navigation}
            handleRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
        {activeTab === 'settings' && <AdminSettings logout={logout} />}
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Icon name="dashboard" size={22} color={activeTab === 'dashboard' ? '#87512a' : '#888'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>Tableau</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'users' && styles.activeTabButton]} 
          onPress={() => setActiveTab('users')}
        >
          <Icon name="users" size={22} color={activeTab === 'users' ? '#87512a' : '#888'} />
          <Text style={[styles.tabLabel, activeTab === 'users' && styles.activeTabLabel]}>Utilisateurs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'books' && styles.activeTabButton]} 
          onPress={() => setActiveTab('books')}
        >
          <Icon name="book" size={22} color={activeTab === 'books' ? '#87512a' : '#888'} />
          <Text style={[styles.tabLabel, activeTab === 'books' && styles.activeTabLabel]}>Livres</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]} 
          onPress={() => setActiveTab('settings')}
        >
          <Icon name="cog" size={22} color={activeTab === 'settings' ? '#87512a' : '#888'} />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeTabLabel]}>Paramètres</Text>
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
  header: {
    backgroundColor: '#87512a',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#87512a',
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  activeTabButton: {
    borderTopWidth: 3,
    borderTopColor: '#87512a',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#87512a',
    fontWeight: 'bold',
  },
});

export default AdminScreen;