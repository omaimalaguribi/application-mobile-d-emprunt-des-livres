import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from './CustomAlert';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Platform } from 'react-native'; 
const API_URL = 'http://10.0.2.2:5000/api/user'; // Adaptez selon votre configuration
// Import correct

const UserProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    cin: ''
  });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    console.log('User data:', user); // Vérifiez les données reçues
  }, [user]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });
    return unsubscribe;
  }, [navigation]);
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 secondes timeout
        params: { t: Date.now() }
      });
      
      if (!response.data) throw new Error('Aucune donnée reçue');
      setUser(response.data);
    } catch (error) {
      console.error('Error:', error);
      showAlert('Erreur', error.message || 'Erreur de chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditMode(false);
      fetchUserProfile();
      showAlert('Succès', 'Profil mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Erreur', error.response?.data?.message || 'Erreur de mise à jour', 'error');
    }
  };

  const pickImage = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission requise pour accéder à la galerie');
        return;
      }
  
      // Nouvelle syntaxe pour mediaTypes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Syntaxe corrigée
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });
  
      if (result.canceled) {
        return;
      }
  
      const uri = result.assets[0].uri;
      const type = 'image/jpeg'; // Type fixe pour simplifier
      const name = 'profile.jpg';
  
      // Préparation FormData
      const formData = new FormData();
      formData.append('profilePicture', {
        uri,
        type,
        name
      });
  
      const token = await AsyncStorage.getItem('userToken');
      
      // Envoi avec XMLHttpRequest (plus fiable pour les uploads)
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/profile/picture`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.response);
          alert(response.message);
          fetchUserProfile();
        } else {
          alert('Échec de l\'upload');
        }
      };
      
      xhr.onerror = () => {
        alert('Erreur réseau');
      };
      
      xhr.send(formData);
  
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sélection de l\'image');
    }
  };
  const showAlert = (title, message, type) => {
    setAlertMessage({ title, message });
    setAlertType(type);
    setAlertVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#87512a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <CustomAlert
          visible={alertVisible}
          title={alertMessage.title}
          message={alertMessage.message}
          type={alertType}
          onClose={() => setAlertVisible(false)}
        />

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage}>
          <Image
  source={
    user?.profile_picture 
      ? { uri: `data:image/jpeg;base64,${user.profile_picture}` } 
      : require('./photos/logo1.png')
  }
  style={styles.profileImage}
  onError={(e) => {
    console.log('Erreur chargement image:', e.nativeEvent.error);
    // Fallback si l'image ne charge pas
    setUser(prev => ({...prev, profile_picture: null}));
  }}
/>
            <View style={styles.cameraIcon}>
              <Icon name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.infoRow}>
  <Text style={styles.infoLabel}>Nom:</Text>
  <Text style={styles.infoValue}>{user?.nom}</Text>
</View>


          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.prenom}
                onChangeText={(text) => setFormData({...formData, prenom: text})}
              />
            ) : (
              <Text style={styles.infoValue}>{user?.prenom}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.email}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.telephone}
                onChangeText={(text) => setFormData({...formData, telephone: text})}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{user?.telephone || 'Non renseigné'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CIN:</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={formData.cin}
                onChangeText={(text) => setFormData({...formData, cin: text})}
              />
            ) : (
              <Text style={styles.infoValue}>{user?.cin || 'Non renseigné'}</Text>
            )}
          </View>

          {editMode ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => navigation.navigate('EditProfile', { user })}
          >
            <Icon name="edit" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsSection}>
        <TouchableOpacity 
  style={styles.actionButton}
  onPress={() => navigation.navigate('ChangePassword')}
>
  <Icon name="lock" size={24} color="#87512a" />
  <Text style={styles.actionButtonText}>Changer le mot de passe</Text>
  <Icon name="chevron-right" size={20} color="#87512a" />
</TouchableOpacity>
        </View>
      </ScrollView>

      {/* Barre de navigation en bas (même que dans UserDashboard) */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F5F2',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    width: '30%',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    width: '65%',
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#87512a',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#87512a',
    resizeMode: 'cover' // Ajoutez cette ligne
  },
  cameraIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#87512a',
    borderRadius: 15,
    padding: 5,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileSection: {
    backgroundColor: '#F8F5F2',
    padding: 30,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#87512a',
    marginBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    width: '30%',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    width: '65%',
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#333',
    width: '65%',
    borderBottomWidth: 1,
    borderBottomColor: '#87512a',
    paddingVertical: 5,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#87512a',
    borderRadius: 25,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    borderRadius: 25,
    padding: 12,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#55d66c',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsSection: {
  backgroundColor: '#F8F5F2',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 15,
  },
  // Styles pour la barre de navigation en bas (ajoutés depuis UserDashboard)
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

export default UserProfileScreen;