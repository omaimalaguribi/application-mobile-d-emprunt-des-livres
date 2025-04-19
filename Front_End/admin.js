import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  Modal,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import AdminBorrowings from './AdminEmpruntes';
const API_URL = 'http://10.0.2.2:5000/api/admin';

// Composant pour le menu drawer d'admin
const AdminDrawer = ({ visible, onClose, navigation, setActiveTab, activeTab, logout }) => {
  
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.drawerContainer}>
          <ScrollView>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Ouma Books</Text>
              <Text style={styles.drawerSubtitle}>Administration</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <FontAwesome5 name="times" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuItems}>
              <MenuItem
                icon="tachometer-alt"
                label="Tableau de bord"
                onPress={() => handleTabChange('dashboard')}
                isActive={activeTab === 'dashboard'}
              />
           dashboard   <MenuItem
                icon="users"
                label="Gestion utilisateurs"
                onPress={() => handleTabChange('users')}
                isActive={activeTab === 'users'}
              />
              <MenuItem
                icon="book"
                label="Gestion des livres"
                onPress={() => handleTabChange('books')}
                isActive={activeTab === 'books'}
              />
              <MenuItem
                icon="exchange-alt"
                label="Gestion des emprunts"
                onPress={() => handleTabChange('empruntes')}
                isActive={activeTab === 'empruntes'}
              />
              <View style={styles.separator} />
             
             
              <MenuItem
                icon="sign-out-alt"
                label="Déconnexion"
                onPress={() => {
                  onClose();
                  logout();
                }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={onClose} 
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

// Composant pour un élément du menu
const MenuItem = ({ icon, label, onPress, isActive }) => {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeMenuItem]} 
      onPress={onPress}
    >
      <FontAwesome5 name={icon} size={22} color={isActive ? "#fff" : "#87512A"} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

// Header personnalisé avec bouton menu
const AdminHeader = ({ openDrawer }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
        <FontAwesome5 name="bars" size={20} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Administration</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

const AdminScreen = ({ navigation }) => {
  const [adminData, setAdminData] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

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
      <AdminHeader openDrawer={() => setDrawerVisible(true)} />
      
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
            onUserDeleted={handleUserDeleted}
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
        {activeTab === 'empruntes' && <AdminBorrowings />}
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
          style={[styles.tabButton, activeTab === 'empruntes' && styles.activeTabButton]} 
          onPress={() => setActiveTab('empruntes')}
        >
          <Icon name="exchange" size={22} color={activeTab === 'empruntes' ? '#87512a' : '#888'} />
          <Text style={[styles.tabLabel, activeTab === 'empruntes' && styles.activeTabLabel]}>Emprunts</Text>
        </TouchableOpacity>
      </View>
      
      <AdminDrawer 
        visible={drawerVisible} 
        onClose={() => setDrawerVisible(false)} 
        navigation={navigation}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        logout={logout}
      />
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Styles pour le drawer
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '70%',
    backgroundColor: '#F8F5F2',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    backgroundColor: '#87512A',
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  drawerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  drawerSubtitle: {
    color: '#FFF',
    opacity: 0.8,
    marginTop: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  activeMenuItem: {
    backgroundColor: '#87512A',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  menuIcon: {
    width: 30,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  activeMenuLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    marginHorizontal: 20,
  },
});

export default AdminScreen;