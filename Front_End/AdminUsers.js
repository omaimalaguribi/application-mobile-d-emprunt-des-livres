import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api/admin';

const AdminUsers = ({ navigation }) => {
  // États locaux pour gérer les utilisateurs et l'UI
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fonction pour récupérer la liste des utilisateurs
  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée');
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les utilisateurs');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (showUserModal && selectedUser) {
      // Vérifie si l'utilisateur sélectionné existe encore dans la liste
      const userStillExists = users.some(user => user.id === selectedUser.id);
      if (!userStillExists) {
        setShowUserModal(false);
      }
    }
  }, [users, selectedUser, showUserModal]);
  
  // Chargement initial des données
  useEffect(() => {
    fetchUsers();
    
    // Ajout d'un écouteur de focus pour recharger les données lorsque l'écran est revisité
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers();
    });

    // Nettoyage de l'écouteur
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    return () => {
      // Reset des états quand le composant est démonté
      setIsDeleting(false);
      setShowUserModal(false);
    };
  }, []);
  
  const handleUserAction = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };
 
  // Fonction de suppression d'utilisateur
  const handleDeleteUser = async (userId) => {
    setIsDeleting(true);
    
    // Fermer IMMÉDIATEMENT le modal
    setShowUserModal(false);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Mise à jour OPTIMISTE de l'interface AVANT l'appel API
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      // Appel API pour supprimer l'utilisateur côté serveur
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Afficher confirmation de succès
      Alert.alert('Succès', 'Utilisateur supprimé avec succès');
      
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'La suppression a échoué');
      
      // Si l'API échoue, recharger les données pour resynchroniser
      fetchUsers();
    } finally {
      setIsDeleting(false);
      setSelectedUser(null); // S'assurer que selectedUser est réinitialisé
    }
  };
  
  // Modifiez la fonction confirmDelete pour une meilleure gestion
  const confirmDelete = (userId) => {
    Alert.alert(
      'Confirmer',
      'Supprimer définitivement cet utilisateur ?',
      [
        { text: 'Annuler' },
        { 
          text: 'Supprimer',
          onPress: () => handleDeleteUser(userId),
          style: 'destructive'
        }
      ]
    );
  };

  // Composant pour afficher l'avatar (photo ou icône par défaut)
  const UserAvatar = ({ userId, size, style }) => {
    const [profilePicture, setProfilePicture] = useState(null);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Tailles d'avatar différentes selon l'utilisation
    const avatarSize = size === 'large' ? 80 : 50;
    const iconSize = size === 'large' ? 40 : 30;
    
    useEffect(() => {
      const fetchProfilePicture = async () => {
        try {
          setIsLoading(true);
          const token = await AsyncStorage.getItem('userToken');
          const response = await axios.get(`${API_URL}/user/profile-picture/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data && response.data.profile_picture) {
            setProfilePicture(response.data.profile_picture);
          } else {
            setHasError(true);
          }
        } catch (error) {
          console.error('Erreur chargement photo profil:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProfilePicture();
    }, [userId]);
    
    const avatarStyle = {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: '#87512a',
      justifyContent: 'center',
      alignItems: 'center',
      ...style
    };

    // Si chargement, afficher indicateur
    if (isLoading) {
      return (
        <View style={avatarStyle}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      );
    }

    // Si erreur ou pas d'image, afficher l'icône par défaut
    if (hasError || !profilePicture) {
      return (
        <View style={avatarStyle}>
          <Icon name="user" size={iconSize} color="#fff" />
        </View>
      );
    }

    return (
      <View style={avatarStyle}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${profilePicture}` }}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }}
          onError={() => setHasError(true)}
        />
      </View>
    );
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user => {
    if (!user.prenom || !user.nom || !user.email) return false;
    
    const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <View style={styles.container}>
      
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Liste des utilisateurs */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userCard}
            onPress={() => handleUserAction(item)}
          >
            <View style={styles.userHeader}>
              <UserAvatar userId={item.id} size="normal" style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.prenom} {item.nom}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={[
                  styles.roleText,
                  item.role === 'administrateur' ? styles.adminText : styles.userText
                ]}>
                  {item.role}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#87512a" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
        onRefresh={fetchUsers}
        refreshing={refreshing}
      />

      {/* Modal de détails de l'utilisateur */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUser && (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <UserAvatar userId={selectedUser.id} size="large" style={styles.modalAvatar} />
                  <Text style={styles.modalUserName}>{selectedUser.prenom} {selectedUser.nom}</Text>
                  <Text style={styles.modalUserRole}>{selectedUser.role}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                  <View style={styles.detailRow}>
                    <Icon name="envelope" size={18} color="#87512a" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={18} color="#87512a" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>Téléphone:</Text>
                    <Text style={styles.detailValue}>{selectedUser.telephone || 'Non renseigné'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="id-card" size={18} color="#87512a" style={styles.detailIcon} />
                    <Text style={styles.detailLabel}>CIN:</Text>
                    <Text style={styles.detailValue}>{selectedUser.cin || 'Non renseigné'}</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      setShowUserModal(false);
                      // Navigation vers l'écran d'édition, sans passer de callback
                      navigation.navigate('EditUser', { 
                        user: selectedUser,
                        // Utiliser une chaîne pour identifier l'action plutôt qu'une fonction
                        updateAction: 'UPDATE_USER'
                      });
                    }}
                  >
                    <Icon name="edit" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(selectedUser.id)}
                    disabled={isDeleting}
                  >
                    <Icon name="trash" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => setShowUserModal(false)}
                  >
                    <Text style={styles.actionButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  adminText: {
    color: '#e74c3c', // Rouge pour admin
  },
  userText: {
    color: '#3498db', // Bleu pour utilisateur
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    marginBottom: 15,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalUserRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    width: 30,
  },
  detailLabel: {
    width: 100,
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
  },
  editButton: {
    backgroundColor: '#87512a',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  closeButton: {
    backgroundColor: '#95a5a6',
    width: '100%',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AdminUsers;